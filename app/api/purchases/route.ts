import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId") ?? undefined;
  const limit      = parseInt(searchParams.get("limit") ?? "50");
  const page       = parseInt(searchParams.get("page") ?? "1");
  const skip       = (page - 1) * limit;

  const where: any = {
    businessId,
    ...(supplierId && { supplierId }),
  };

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { purchaseDate: "desc" },
      take:    limit,
      skip,
      include: { supplier: { select: { id: true, name: true } } },
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({ purchases, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, id: userId } = session.user;
  const body = await req.json();

  const {
    supplierId,
    purchaseDate,
    referenceNo,
    items,
    discountAmount = 0,
    paidAmount     = 0,
    paymentMethod  = "CASH",
    notes,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const subtotal    = items.reduce((s: number, i: any) => s + i.total, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const dueAmount   = Math.max(0, totalAmount - paidAmount);
  const paymentStatus =
    dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const purchase = await prisma.$transaction(async (tx) => {
    // ── Step 1: Resolve product IDs ──────────────────────────────────────────
    // Load all active products for this business once, build a lowercase name map.
    // This handles case-insensitive matching reliably on SQLite.
    const existingProducts = await tx.product.findMany({
      where:  { businessId, isActive: true },
      select: { id: true, name: true, unit: true, costPrice: true },
    });

    // Map: normalized-lowercase-name → product
    const productByName = new Map(
      existingProducts.map((p) => [p.name.trim().toLowerCase(), p])
    );

    // Resolve each item: assign a productId (found or freshly created)
    const resolvedItems: Array<typeof items[0] & { productId: string | null }> = [];

    for (const item of items) {
      // Already linked to a catalog product — use as-is
      if (item.productId) {
        resolvedItems.push({ ...item });
        continue;
      }

      const nameRaw = (item.productName ?? "").trim();
      if (!nameRaw) {
        // Unnamed custom item — save without product link
        resolvedItems.push({ ...item, productId: null });
        continue;
      }

      const nameKey = nameRaw.toLowerCase();
      const found   = productByName.get(nameKey);

      if (found) {
        // Match found — link to existing product
        resolvedItems.push({ ...item, productId: found.id });
      } else {
        // No match — auto-create product from purchase item data
        const skuPrefix = nameRaw.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase().padEnd(4, "X");
        // Timestamp-based suffix: unique to the millisecond within a business
        const skuSuffix = Date.now().toString(36).toUpperCase() +
          Math.floor(Math.random() * 999).toString(36).toUpperCase().padStart(2, "0");
        const sku = `${skuPrefix}-${skuSuffix}`;

        const newProduct = await tx.product.create({
          data: {
            businessId,
            name:         nameRaw,
            sku,
            unit:         item.unit || "pcs",
            costPrice:    item.unitPrice ?? 0,
            // Use cost price as the initial selling price — can be updated in Products later
            sellingPrice: item.unitPrice ?? 0,
            stock:        0,           // will be incremented below via InventoryAdjustment
            reorderLevel: 10,
            isActive:     true,
          },
        });

        resolvedItems.push({ ...item, productId: newProduct.id });
        // Add to map so a duplicate name in the same purchase reuses this product
        productByName.set(nameKey, {
          id:        newProduct.id,
          name:      nameRaw,
          unit:      item.unit || "pcs",
          costPrice: item.unitPrice ?? 0,
        });
      }
    }

    // ── Step 2: Create the Purchase with resolved items ──────────────────────
    const p = await tx.purchase.create({
      data: {
        businessId,
        supplierId:    supplierId || null,
        purchaseDate:  purchaseDate ? new Date(purchaseDate) : new Date(),
        referenceNo:   referenceNo || null,
        subtotal,
        discountAmount,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus,
        paymentMethod,
        notes:         notes || null,
        createdById:   userId,
        items: {
          create: resolvedItems.map((item) => ({
            productId:    item.productId  || null,
            productName:  item.productName,
            quantity:     item.quantity,
            unitPrice:    item.unitPrice,
            total:        item.total,
            purchaseUnit: item.purchaseUnit  || null,
            packageType:  item.packageType   || null,
            packageLines: item.packageLines  || null,   // JSON string from client
            convertedQty: item.convertedQty  ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // ── Step 3: Increment stock + log InventoryAdjustment for every linked item
    const purchaseRef = `Purchase #${p.id.slice(-8).toUpperCase()}${referenceNo ? ` (Ref: ${referenceNo})` : ""}`;

    for (const item of resolvedItems) {
      if (!item.productId) continue;

      // Use convertedQty (base units) when a unit conversion is in play;
      // otherwise fall back to quantity (already in base units).
      const stockQty: number = item.convertedQty ?? item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { increment: stockQty } },
      });

      await tx.inventoryAdjustment.create({
        data: {
          productId:  item.productId,
          type:       "PURCHASE",
          quantity:   stockQty,
          reason:     purchaseRef,
          adjustedBy: userId,
        },
      });
    }

    return p;
  });

  return NextResponse.json(purchase, { status: 201 });
}
