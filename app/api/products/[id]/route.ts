import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const product = await prisma.product.findFirst({
    where: { id: params.id, businessId },
    include: {
      adjustments: {
        orderBy: { createdAt: "desc" },
        take:    20,
        include: { user: { select: { name: true } } },
      },
      saleItems: {
        orderBy: { sale: { saleDate: "desc" } },
        take:    10,
        include: { sale: { select: { invoiceNumber: true, saleDate: true, customer: { select: { name: true } } } } },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const salesAgg = await prisma.saleItem.aggregate({
    where:  { productId: params.id },
    _sum:   { quantity: true, total: true },
    _count: { id: true },
  });

  return NextResponse.json({
    ...product,
    isLowStock: product.stock <= product.reorderLevel,
    salesStats: {
      totalSold:    salesAgg._sum.quantity ?? 0,
      totalRevenue: salesAgg._sum.total    ?? 0,
      saleCount:    salesAgg._count.id,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = productSchema.partial().parse(body);
    const updated = await prisma.product.updateMany({
      where: { id: params.id, businessId },
      data,
    });
    if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const saleCount = await prisma.saleItem.count({ where: { productId: params.id } });
  if (saleCount > 0) {
    await prisma.product.updateMany({ where: { id: params.id, businessId }, data: { isActive: false } });
    return NextResponse.json({ message: "Product deactivated (has sale history)" });
  }

  await prisma.product.deleteMany({ where: { id: params.id, businessId } });
  return NextResponse.json({ message: "Deleted" });
}
