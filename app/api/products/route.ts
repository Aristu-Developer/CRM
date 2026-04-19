import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const category = searchParams.get("category") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";
  const status   = searchParams.get("status")   ?? "";
  const page     = parseInt(searchParams.get("page")  ?? "1");
  const pageSize = parseInt(searchParams.get("limit") ?? "20");

  const where: any = { businessId };
  if (search)   where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { sku:  { contains: search, mode: "insensitive" } },
  ];
  if (category) where.category = { contains: category, mode: "insensitive" };
  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  let enriched = products.map((p) => ({ ...p, isLowStock: p.stock <= p.reorderLevel }));
  if (lowStock) enriched = enriched.filter((p) => p.isLowStock);

  return NextResponse.json({ products: enriched, total });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    // SKU uniqueness is per-business
    const existing = await prisma.product.findFirst({ where: { sku: data.sku, businessId } });
    if (existing) return NextResponse.json({ error: "SKU already exists" }, { status: 409 });

    const product = await prisma.product.create({ data: { ...data, businessId } });

    if (data.stock > 0) {
      await prisma.inventoryAdjustment.create({
        data: {
          productId:  product.id,
          type:       "INITIAL",
          quantity:   data.stock,
          reason:     "Initial stock entry",
          adjustedBy: session.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
