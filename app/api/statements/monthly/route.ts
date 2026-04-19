import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EXPENSE_CATEGORIES = [
  "RENT", "UTILITIES", "SALARIES", "TRANSPORT", "MAINTENANCE", "OTHER",
] as const;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);

  const now   = new Date();
  const year  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);

  const [sales, payments, purchases, expenseRows, repayments, openDues, openPayables] =
    await Promise.all([
      prisma.sale.aggregate({
        where:  { businessId, saleDate: { gte: start, lte: end } },
        _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { _all: true },
      }),
      prisma.payment.aggregate({
        where:  { businessId, paymentDate: { gte: start, lte: end } },
        _sum:   { amount: true },
        _count: { _all: true },
      }),
      prisma.purchase.aggregate({
        where:  { businessId, purchaseDate: { gte: start, lte: end } },
        _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { _all: true },
      }),
      // Fetch individual expense rows so we can break down by category
      prisma.expense.findMany({
        where:  { businessId, expenseDate: { gte: start, lte: end } },
        select: { category: true, amount: true },
      }),
      prisma.loanRepayment.aggregate({
        where:  { loan: { businessId }, repaymentDate: { gte: start, lte: end } },
        _sum:   { amount: true, interestAmount: true },
        _count: { _all: true },
      }),
      prisma.sale.aggregate({
        where: { businessId, dueAmount: { gt: 0 } },
        _sum:  { dueAmount: true },
        _count: { _all: true },
      }),
      prisma.purchase.aggregate({
        where: { businessId, dueAmount: { gt: 0 } },
        _sum:  { dueAmount: true },
        _count: { _all: true },
      }),
    ]);

  // Build expense totals per category
  const expensesByCategory: Record<string, number> = Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c, 0])
  );
  for (const row of expenseRows) {
    expensesByCategory[row.category] = (expensesByCategory[row.category] ?? 0) + row.amount;
  }
  const expensesTotal = expenseRows.reduce((s, e) => s + e.amount, 0);

  const salesTotal       = sales._sum.totalAmount     ?? 0;
  const paymentsReceived = payments._sum.amount        ?? 0;
  const purchasesTotal   = purchases._sum.totalAmount  ?? 0;
  const purchasesPaid    = purchases._sum.paidAmount   ?? 0;
  const purchasesDue     = purchases._sum.dueAmount    ?? 0;
  const repaymentTotal   = repayments._sum.amount      ?? 0;
  const interestPaid     = repayments._sum.interestAmount ?? 0;

  const grossProfit = salesTotal - purchasesTotal;
  const netProfit   = grossProfit - expensesTotal - interestPaid;

  // Cash movement: actual money in vs actual money out this period
  const cashIn  = paymentsReceived;
  const cashOut = purchasesPaid + expensesTotal + repaymentTotal;
  const netCash = cashIn - cashOut;

  return NextResponse.json({
    year,
    month,
    period: `${year}-${String(month).padStart(2, "0")}`,
    salesCount:       sales._count._all,
    salesTotal,
    paymentsReceived,
    purchasesCount:   purchases._count._all,
    purchasesTotal,
    purchasesPaid,
    purchasesDue,
    expensesCount:    expenseRows.length,
    expensesTotal,
    expensesByCategory,
    repaymentCount:   repayments._count._all,
    repaymentTotal,
    interestPaid,
    grossProfit,
    netProfit,
    cashIn,
    cashOut,
    netCash,
    outstandingCustomerDue:       openDues._sum.dueAmount    ?? 0,
    outstandingCustomerDueCount:  openDues._count._all,
    outstandingSupplierPayable:      openPayables._sum.dueAmount ?? 0,
    outstandingSupplierPayableCount: openPayables._count._all,
  });
}
