import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const yearStart = new Date(year, 0,  1, 0,  0,  0,   0);
  const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999);

  const [allSales, allPayments, allPurchases, allExpenses, allRepayments, openDues, openPayables] =
    await Promise.all([
      prisma.sale.findMany({
        where:  { businessId, saleDate: { gte: yearStart, lte: yearEnd } },
        select: { saleDate: true, totalAmount: true, paidAmount: true, dueAmount: true },
      }),
      prisma.payment.findMany({
        where:  { businessId, paymentDate: { gte: yearStart, lte: yearEnd } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.purchase.findMany({
        where:  { businessId, purchaseDate: { gte: yearStart, lte: yearEnd } },
        select: { purchaseDate: true, totalAmount: true, paidAmount: true, dueAmount: true },
      }),
      prisma.expense.findMany({
        where:  { businessId, expenseDate: { gte: yearStart, lte: yearEnd } },
        select: { expenseDate: true, amount: true },
      }),
      prisma.loanRepayment.findMany({
        where:  { loan: { businessId }, repaymentDate: { gte: yearStart, lte: yearEnd } },
        select: { repaymentDate: true, amount: true, interestAmount: true },
      }),
      prisma.sale.aggregate({
        where:  { businessId, dueAmount: { gt: 0 } },
        _sum:   { dueAmount: true },
        _count: { _all: true },
      }),
      prisma.purchase.aggregate({
        where:  { businessId, dueAmount: { gt: 0 } },
        _sum:   { dueAmount: true },
        _count: { _all: true },
      }),
    ]);

  function getMonth(d: Date | string) {
    return new Date(d).getMonth() + 1;
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const sales      = allSales.filter(x => getMonth(x.saleDate) === m);
    const payments   = allPayments.filter(x => getMonth(x.paymentDate) === m);
    const purchases  = allPurchases.filter(x => getMonth(x.purchaseDate) === m);
    const expenses   = allExpenses.filter(x => getMonth(x.expenseDate) === m);
    const repayments = allRepayments.filter(x => getMonth(x.repaymentDate) === m);

    const salesTotal       = sales.reduce((s, x) => s + x.totalAmount, 0);
    const paymentsReceived = payments.reduce((s, x) => s + x.amount, 0);
    const purchasesTotal   = purchases.reduce((s, x) => s + x.totalAmount, 0);
    const purchasesPaid    = purchases.reduce((s, x) => s + x.paidAmount, 0);
    const expensesTotal    = expenses.reduce((s, x) => s + x.amount, 0);
    const repaymentTotal   = repayments.reduce((s, x) => s + x.amount, 0);
    const interestPaid     = repayments.reduce((s, x) => s + x.interestAmount, 0);
    const grossProfit      = salesTotal - purchasesTotal;
    const netProfit        = grossProfit - expensesTotal - interestPaid;
    const cashIn           = paymentsReceived;
    const cashOut          = purchasesPaid + expensesTotal + repaymentTotal;
    const netCash          = cashIn - cashOut;

    return {
      month: m, salesTotal, paymentsReceived, purchasesTotal, purchasesPaid,
      expensesTotal, repaymentTotal, interestPaid, grossProfit, netProfit,
      cashIn, cashOut, netCash,
    };
  });

  const totalSales         = months.reduce((s, x) => s + x.salesTotal, 0);
  const totalPayments      = months.reduce((s, x) => s + x.paymentsReceived, 0);
  const totalPurchases     = months.reduce((s, x) => s + x.purchasesTotal, 0);
  const totalPurchasesPaid = months.reduce((s, x) => s + x.purchasesPaid, 0);
  const totalExpenses      = months.reduce((s, x) => s + x.expensesTotal, 0);
  const totalRepayments    = months.reduce((s, x) => s + x.repaymentTotal, 0);
  const totalInterest      = months.reduce((s, x) => s + x.interestPaid, 0);
  const totalGrossProfit   = totalSales - totalPurchases;
  const totalNetProfit     = totalGrossProfit - totalExpenses - totalInterest;
  const totalCashIn        = totalPayments;
  const totalCashOut       = totalPurchasesPaid + totalExpenses + totalRepayments;
  const totalNetCash       = totalCashIn - totalCashOut;

  return NextResponse.json({
    year,
    totals: {
      salesTotal:        totalSales,
      paymentsReceived:  totalPayments,
      purchasesTotal:    totalPurchases,
      purchasesPaid:     totalPurchasesPaid,
      expensesTotal:     totalExpenses,
      repaymentTotal:    totalRepayments,
      interestPaid:      totalInterest,
      grossProfit:       totalGrossProfit,
      netProfit:         totalNetProfit,
      cashIn:            totalCashIn,
      cashOut:           totalCashOut,
      netCash:           totalNetCash,
      outstandingCustomerDue:          openDues._sum.dueAmount    ?? 0,
      outstandingCustomerDueCount:     openDues._count._all,
      outstandingSupplierPayable:      openPayables._sum.dueAmount ?? 0,
      outstandingSupplierPayableCount: openPayables._count._all,
    },
    months,
  });
}
