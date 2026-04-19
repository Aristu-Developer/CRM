import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const sale = await prisma.sale.findFirst({
    where:   { id: params.id, businessId },
    include: {
      customer:  true,
      items:     { include: { product: { select: { name: true, unit: true, sku: true } } } },
      payments:  { orderBy: { paymentDate: "desc" }, include: { receivedBy: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
  });

  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sale);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const { saleNote, promiseNote, nextRepayDate } = body;

    const updated = await prisma.sale.updateMany({
      where: { id: params.id, businessId },
      data:  { saleNote, promiseNote, nextRepayDate: nextRepayDate ? new Date(nextRepayDate) : null },
    });
    if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const sale = await prisma.sale.findFirst({
    where:   { id: params.id, businessId },
    include: { items: true, payments: true },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.payment.deleteMany({ where: { saleId: params.id } });
    await tx.sale.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ message: "Sale deleted and stock restored" });
}
