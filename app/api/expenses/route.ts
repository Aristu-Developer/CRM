import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const limit    = parseInt(searchParams.get("limit") ?? "50");
  const page     = parseInt(searchParams.get("page") ?? "1");
  const skip     = (page - 1) * limit;

  const where: any = {
    businessId,
    ...(category && { category }),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      take:    limit,
      skip,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ expenses, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, id: userId } = session.user;
  const body = await req.json();

  const {
    title,
    category     = "OTHER",
    amount,
    expenseDate,
    paidTo,
    paymentMethod = "CASH",
    notes,
  } = body;

  if (!title?.trim())  return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });

  const expense = await prisma.expense.create({
    data: {
      businessId,
      title:         title.trim(),
      category,
      amount,
      expenseDate:   expenseDate ? new Date(expenseDate) : new Date(),
      paidTo:        paidTo || null,
      paymentMethod,
      notes:         notes || null,
      createdById:   userId,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
