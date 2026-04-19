import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loan = await prisma.loan.findFirst({
    where:   { id: params.id, businessId: session.user.businessId },
    include: { repayments: { orderBy: { repaymentDate: "desc" } } },
  });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalRepaid        = loan.repayments.reduce((s, r) => s + r.amount, 0);
  const totalInterestPaid  = loan.repayments.reduce((s, r) => s + r.interestAmount, 0);
  const outstanding        = Math.max(0, loan.principalAmount - totalRepaid);

  return NextResponse.json({ ...loan, totalRepaid, totalInterestPaid, outstanding });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loan = await prisma.loan.findFirst({
    where: { id: params.id, businessId: session.user.businessId },
  });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, dueDate, notes } = await req.json();

  const updated = await prisma.loan.update({
    where: { id: params.id },
    data: {
      ...(status  !== undefined && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(notes   !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(updated);
}
