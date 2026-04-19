import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type")   ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const where: any = {
    businessId,
    ...(type   && { type }),
    ...(status && { status }),
  };

  const loans = await prisma.loan.findMany({
    where,
    orderBy:  { startDate: "desc" },
    include: { _count: { select: { repayments: true } } },
  });

  // Compute totalRepaid per loan
  const loanIds = loans.map((l) => l.id);
  const repaidAggs = await prisma.loanRepayment.groupBy({
    by:    ["loanId"],
    where: { loanId: { in: loanIds } },
    _sum:  { amount: true, interestAmount: true },
  });
  const repaidMap = Object.fromEntries(
    repaidAggs.map((a) => [a.loanId, { amount: a._sum.amount ?? 0, interest: a._sum.interestAmount ?? 0 }])
  );

  const result = loans.map((l) => {
    const repaid      = repaidMap[l.id] ?? { amount: 0, interest: 0 };
    const outstanding = Math.max(0, l.principalAmount - repaid.amount);
    return { ...l, totalRepaid: repaid.amount, totalInterestPaid: repaid.interest, outstanding, _count: undefined };
  });

  return NextResponse.json({ loans: result, total: result.length });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, id: userId } = session.user;
  const body = await req.json();

  const {
    partyName,
    type            = "TAKEN",
    principalAmount,
    interestRate    = 0,
    startDate,
    dueDate,
    notes,
  } = body;

  if (!partyName?.trim())     return NextResponse.json({ error: "Party name is required" }, { status: 400 });
  if (!principalAmount || principalAmount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });

  const loan = await prisma.loan.create({
    data: {
      businessId,
      partyName:       partyName.trim(),
      type,
      principalAmount,
      interestRate,
      startDate:       startDate ? new Date(startDate) : new Date(),
      dueDate:         dueDate   ? new Date(dueDate) : null,
      notes:           notes || null,
      createdById:     userId,
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
