import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saleSchema } from "@/lib/validations/sale";

function calcPaymentStatus(total: number, paid: number, dueDate?: Date): "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" {
  if (paid >= total) return "PAID";
  if (paid > 0)      return "PARTIAL";
  if (dueDate && new Date(dueDate) < new Date()) return "OVERDUE";
  return "UNPAID";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const search     = searchParams.get("search")     ?? "";
  const status     = searchParams.get("status")     ?? "";
  const from       = searchParams.get("from")       ?? "";
  const to         = searchParams.get("to")         ?? "";
  const customerId = searchParams.get("customerId") ?? "";
  const page       = parseInt(searchParams.get("page")  ?? "1");
  const pageSize   = parseInt(searchParams.get("limit") ?? "20");

  const where: any = { businessId };
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status)     where.paymentStatus = status.toUpperCase();
  if (customerId) where.customerId    = customerId;
  if (from || to) {
    where.saleDate = {};
    if (from) where.saleDate.gte = new Date(from);
    if (to)   where.saleDate.lte = new Date(to + "T23:59:59");
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { saleDate: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        customer:  { select: { id: true, name: true, phone: true } },
        createdBy: { select: { name: true } },
        _count:    { select: { payments: true, items: true } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({ sales, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = saleSchema.parse(body);

    const subtotal      = data.items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount   = subtotal - (data.discountAmount ?? 0);
    const paidAmount    = data.paidAmount;
    const dueAmount     = Math.max(0, totalAmount - paidAmount);
    const nextRepayDate = data.nextRepayDate ? new Date(data.nextRepayDate) : undefined;
    const paymentStatus = calcPaymentStatus(totalAmount, paidAmount, nextRepayDate);

    // Resolve customer — walk-in sales have no customerId; use/create the business walk-in record
    let resolvedCustomerId = data.customerId ?? "";
    if (!resolvedCustomerId) {
      const existing = await prisma.customer.findFirst({
        where: { businessId, name: "Walk-in Customer", phone: "0000000000" },
        select: { id: true },
      });
      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const created = await prisma.customer.create({
          data: { businessId, name: "Walk-in Customer", phone: "0000000000" },
        });
        resolvedCustomerId = created.id;
      }
    }

    // Invoice number scoped to this business
    const count    = await prisma.sale.count({ where: { businessId } });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    const prefix   = business?.invoicePrefix ?? "INV";
    const invoiceNumber = `${prefix}-${String(count + 1).padStart(5, "0")}`;

    for (const item of data.items) {
      const product = await prisma.product.findFirst({ where: { id: item.productId, businessId } });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}" (available: ${product.stock})`);
      }
    }

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          businessId,
          invoiceNumber,
          customerId:     resolvedCustomerId,
          saleDate:       new Date(data.saleDate),
          subtotal,
          discountAmount: data.discountAmount ?? 0,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentStatus,
          paymentMethod:  data.paymentMethod,
          saleNote:       data.saleNote,
          promiseNote:    data.promiseNote,
          nextRepayDate,
          createdById:    session.user.id,
          items: {
            create: data.items.map((item) => ({
              productId:   item.productId,
              productName: item.productName,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              discount:    item.discount ?? 0,
              total:       item.total,
            })),
          },
        },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { decrement: item.quantity } },
        });
        await tx.inventoryAdjustment.create({
          data: {
            productId:  item.productId,
            type:       "SALE",
            quantity:   -item.quantity,
            reason:     `Sale ${invoiceNumber}`,
            adjustedBy: session.user.id,
          },
        });
      }

      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            businessId,
            saleId:        created.id,
            customerId:    resolvedCustomerId,
            amount:        paidAmount,
            paymentMethod: data.paymentMethod,
            referenceNote: `Initial payment for ${invoiceNumber}`,
            receivedById:  session.user.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err.message?.includes("Insufficient stock")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
