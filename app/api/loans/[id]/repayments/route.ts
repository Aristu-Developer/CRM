import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId, businessId } = session.user;

  const loan = await prisma.loan.findFirst({
    where: { id: params.id, businessId },
  });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (loan.status === "CLOSED") return NextResponse.json({ error: "Loan is already closed" }, { status: 400 });

  const body = await req.json();
  const {
    amount,
    interestAmount = 0,
    repaymentDate,
    paymentMethod  = "CASH",
    notes,
    closeLoan      = false,
  } = body;

  if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });

  const repayment = await prisma.$transaction(async (tx) => {
    const r = await tx.loanRepayment.create({
      data: {
        loanId:        params.id,
        amount,
        interestAmount,
        repaymentDate: repaymentDate ? new Date(repaymentDate) : new Date(),
        paymentMethod,
        notes:         notes || null,
        createdById:   userId,
      },
    });

    if (closeLoan) {
      await tx.loan.update({ where: { id: params.id }, data: { status: "CLOSED" } });
    }

    return r;
  });

  return NextResponse.json(repayment, { status: 201 });
}
