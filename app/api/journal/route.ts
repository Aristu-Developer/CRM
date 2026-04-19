import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Build a day-range pair (server-local time) from a YYYY-MM-DD string */
function dayRange(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return {
    gte: new Date(y, m - 1, d, 0,  0,  0,   0),
    lte: new Date(y, m - 1, d, 23, 59, 59, 999),
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);

  // Default to today if no date given
  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateStr  = searchParams.get("date") ?? todayStr;
  const range    = dayRange(dateStr);

  const [sales, payments, purchases, expenses, repayments] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, saleDate: range },
      select: {
        id: true, invoiceNumber: true, totalAmount: true,
        paidAmount: true, dueAmount: true, paymentStatus: true,
        customer: { select: { name: true } },
      },
      orderBy: { saleDate: "asc" },
    }),
    prisma.payment.findMany({
      where: { businessId, paymentDate: range },
      select: {
        id: true, amount: true, paymentMethod: true,
        sale: { select: { invoiceNumber: true } },
      },
      orderBy: { paymentDate: "asc" },
    }),
    prisma.purchase.findMany({
      where: { businessId, purchaseDate: range },
      select: {
        id: true, totalAmount: true, paidAmount: true, dueAmount: true,
        paymentStatus: true, referenceNo: true,
        supplier: { select: { name: true } },
      },
      orderBy: { purchaseDate: "asc" },
    }),
    prisma.expense.findMany({
      where: { businessId, expenseDate: range },
      select: { id: true, title: true, category: true, amount: true, paymentMethod: true },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.loanRepayment.findMany({
      where: { loan: { businessId }, repaymentDate: range },
      select: {
        id: true, amount: true, interestAmount: true, paymentMethod: true,
        loan: { select: { partyName: true, type: true } },
      },
      orderBy: { repaymentDate: "asc" },
    }),
  ]);

  // Aggregates
  const salesTotal       = sales.reduce((s, x) => s + x.totalAmount, 0);
  const salesPaid        = sales.reduce((s, x) => s + x.paidAmount, 0);
  const salesDue         = sales.reduce((s, x) => s + x.dueAmount, 0);
  const paymentsTotal    = payments.reduce((s, x) => s + x.amount, 0);
  const purchasesTotal   = purchases.reduce((s, x) => s + x.totalAmount, 0);
  const purchasesPaid    = purchases.reduce((s, x) => s + x.paidAmount, 0);
  const purchasesDue     = purchases.reduce((s, x) => s + x.dueAmount, 0);
  const expensesTotal    = expenses.reduce((s, x) => s + x.amount, 0);
  const repaymentTotal   = repayments.reduce((s, x) => s + x.amount, 0);
  const interestPaid     = repayments.reduce((s, x) => s + x.interestAmount, 0);

  // Cash flow
  const cashIn  = paymentsTotal;                                   // money received from customers
  const cashOut = purchasesPaid + expensesTotal + repaymentTotal;  // money paid out
  const netCash = cashIn - cashOut;

  return NextResponse.json({
    date: dateStr,
    summary: {
      salesCount:        sales.length,
      salesTotal,
      salesPaid,
      salesDue,
      paymentsCount:     payments.length,
      paymentsTotal,
      purchasesCount:    purchases.length,
      purchasesTotal,
      purchasesPaid,
      purchasesDue,
      expensesCount:     expenses.length,
      expensesTotal,
      repaymentCount:    repayments.length,
      repaymentTotal,
      interestPaid,
      cashIn,
      cashOut,
      netCash,
    },
    transactions: {
      sales,
      payments,
      purchases,
      expenses,
      repayments,
    },
  });
}
