import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purchase = await prisma.purchase.findFirst({
    where:   { id: params.id, businessId: session.user.businessId },
    include: {
      supplier: true,
      items:    { include: { product: { select: { id: true, name: true, unit: true, stock: true } } } },
    },
  });

  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(purchase);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purchase = await prisma.purchase.findFirst({
    where: { id: params.id, businessId: session.user.businessId },
  });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { paidAmount, notes } = await req.json();

  // Allow updating paid amount (partial payment recording)
  const newPaid   = paidAmount !== undefined ? Math.min(paidAmount, purchase.totalAmount) : purchase.paidAmount;
  const newDue    = Math.max(0, purchase.totalAmount - newPaid);
  const newStatus = newDue === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  const updated = await prisma.purchase.update({
    where: { id: params.id },
    data: {
      paidAmount:    newPaid,
      dueAmount:     newDue,
      paymentStatus: newStatus,
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(updated);
}
