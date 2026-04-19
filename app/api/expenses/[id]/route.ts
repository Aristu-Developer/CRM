import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, businessId: session.user.businessId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(expense);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, businessId: session.user.businessId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, category, amount, expenseDate, paidTo, paymentMethod, notes } = await req.json();

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(title         !== undefined && { title: title.trim() }),
      ...(category      !== undefined && { category }),
      ...(amount        !== undefined && { amount }),
      ...(expenseDate   !== undefined && { expenseDate: new Date(expenseDate) }),
      ...(paidTo        !== undefined && { paidTo: paidTo || null }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(notes         !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, businessId: session.user.businessId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
