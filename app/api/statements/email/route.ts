import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(n: number, symbol = "Rs.") {
  return `${symbol} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function profitColor(n: number) {
  return n >= 0 ? "#166534" : "#991b1b";
}

function buildMonthlyHtml(data: any, businessName: string, currencySymbol: string) {
  const { year, month, salesTotal, paymentsReceived, purchasesTotal, expensesTotal,
          interestPaid, grossProfit, netProfit,
          outstandingCustomerDue, outstandingSupplierPayable } = data;
  const s = (n: number) => fmt(n, currencySymbol);

  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Monthly Statement</title></head>
<body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
  <div style="border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="margin:0;font-size:22px;color:#4f46e5;">${businessName}</h1>
    <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Monthly Statement — ${MONTH_NAMES[month]} ${year}</p>
  </div>

  <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">Income & Expenses</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
    <tr style="background:#f9fafb;">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Sales (Invoiced)</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:600;">${s(salesTotal)}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Payments Received</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(paymentsReceived)}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Purchases</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(purchasesTotal)}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Expenses</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(expensesTotal)}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Interest Paid</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(interestPaid)}</td>
    </tr>
  </table>

  <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">Profitability</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
    <tr style="background:#f9fafb;">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Gross Profit (Sales − Purchases)</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;color:${profitColor(grossProfit)};font-weight:600;">${s(grossProfit)}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;">Net Profit</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:700;color:${profitColor(netProfit)};">${s(netProfit)}</td>
    </tr>
  </table>

  <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">Outstanding Balances</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:32px;">
    <tr style="background:#f9fafb;">
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Customer Dues Receivable</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;color:#b45309;font-weight:600;">${s(outstandingCustomerDue)}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">Supplier Payables</td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;color:#b45309;">${s(outstandingSupplierPayable)}</td>
    </tr>
  </table>

  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
    Generated automatically by your CRM · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
  </p>
</body></html>`;
}

function buildYearlyHtml(data: any, businessName: string, currencySymbol: string) {
  const { year, totals, months } = data;
  const s = (n: number) => fmt(n, currencySymbol);

  const monthRows = months.map((m: any) =>
    `<tr>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;">${MONTH_NAMES[m.month]}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${s(m.salesTotal)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${s(m.purchasesTotal)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${s(m.expensesTotal)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;color:${profitColor(m.netProfit)};font-weight:600;">${s(m.netProfit)}</td>
    </tr>`
  ).join("");

  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Yearly Summary</title></head>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#111827;">
  <div style="border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="margin:0;font-size:22px;color:#4f46e5;">${businessName}</h1>
    <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Yearly Summary — ${year}</p>
  </div>

  <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">Year Totals</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
    <tr style="background:#f9fafb;"><td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Sales</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:600;">${s(totals.salesTotal)}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #e5e7eb;">Payments Received</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(totals.paymentsReceived)}</td></tr>
    <tr style="background:#f9fafb;"><td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Purchases</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(totals.purchasesTotal)}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #e5e7eb;">Total Expenses</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;">${s(totals.expensesTotal)}</td></tr>
    <tr style="background:#f9fafb;"><td style="padding:10px 12px;border:1px solid #e5e7eb;">Gross Profit</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;color:${profitColor(totals.grossProfit)};font-weight:600;">${s(totals.grossProfit)}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;">Net Profit</td><td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:700;color:${profitColor(totals.netProfit)};">${s(totals.netProfit)}</td></tr>
  </table>

  <h2 style="font-size:15px;color:#374151;margin-bottom:12px;">Month-by-Month Breakdown</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:32px;">
    <thead>
      <tr style="background:#4f46e5;color:#fff;">
        <th style="padding:9px 10px;text-align:left;">Month</th>
        <th style="padding:9px 10px;text-align:right;">Sales</th>
        <th style="padding:9px 10px;text-align:right;">Purchases</th>
        <th style="padding:9px 10px;text-align:right;">Expenses</th>
        <th style="padding:9px 10px;text-align:right;">Net Profit</th>
      </tr>
    </thead>
    <tbody>${monthRows}</tbody>
  </table>

  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
    Generated automatically by your CRM · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
  </p>
</body></html>`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const body = await req.json();
  const { type, period, to } = body;

  if (!type || !period || !to) {
    return NextResponse.json({ error: "type, period, and to are required" }, { status: 400 });
  }

  // Load business info for name + currency
  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { businessName: true, currencySymbol: true },
  });
  const businessName   = business?.businessName   ?? "My Business";
  const currencySymbol = business?.currencySymbol ?? "Rs.";

  // Fetch statement data internally
  let statementData: any;
  let subject: string;
  let html: string;

  if (type === "MONTHLY_STATEMENT") {
    const [yr, mo] = period.split("-").map(Number);
    const url = new URL(`/api/statements/monthly?year=${yr}&month=${mo}`, "http://localhost");
    // Re-run the query inline instead of an internal fetch to avoid auth complexity
    const now   = new Date();
    const year  = yr;
    const month = mo;
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);

    const [sales, payments, purchases, expenses, repayments, openDues, openPayables] =
      await Promise.all([
        prisma.sale.aggregate({ where: { businessId, saleDate: { gte: start, lte: end } }, _sum: { totalAmount: true, paidAmount: true, dueAmount: true }, _count: { _all: true } }),
        prisma.payment.aggregate({ where: { businessId, paymentDate: { gte: start, lte: end } }, _sum: { amount: true }, _count: { _all: true } }),
        prisma.purchase.aggregate({ where: { businessId, purchaseDate: { gte: start, lte: end } }, _sum: { totalAmount: true, paidAmount: true, dueAmount: true }, _count: { _all: true } }),
        prisma.expense.aggregate({ where: { businessId, expenseDate: { gte: start, lte: end } }, _sum: { amount: true }, _count: { _all: true } }),
        prisma.loanRepayment.aggregate({ where: { loan: { businessId }, repaymentDate: { gte: start, lte: end } }, _sum: { amount: true, interestAmount: true }, _count: { _all: true } }),
        prisma.sale.aggregate({ where: { businessId, dueAmount: { gt: 0 } }, _sum: { dueAmount: true } }),
        prisma.purchase.aggregate({ where: { businessId, dueAmount: { gt: 0 } }, _sum: { dueAmount: true } }),
      ]);

    const salesTotal    = sales._sum.totalAmount    ?? 0;
    const purchasesTotal = purchases._sum.totalAmount ?? 0;
    const expensesTotal  = expenses._sum.amount      ?? 0;
    const interestPaid   = repayments._sum.interestAmount ?? 0;
    const grossProfit    = salesTotal - purchasesTotal;
    const netProfit      = grossProfit - expensesTotal - interestPaid;

    statementData = {
      year, month, period,
      salesTotal,
      paymentsReceived:        payments._sum.amount ?? 0,
      purchasesTotal,
      expensesTotal,
      interestPaid,
      grossProfit,
      netProfit,
      outstandingCustomerDue:  openDues._sum.dueAmount    ?? 0,
      outstandingSupplierPayable: openPayables._sum.dueAmount ?? 0,
    };
    subject = `${businessName} — Monthly Statement: ${period}`;
    html    = buildMonthlyHtml(statementData, businessName, currencySymbol);

  } else if (type === "YEARLY_SUMMARY") {
    const year      = parseInt(period);
    const yearStart = new Date(year, 0,  1, 0,  0,  0,   0);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999);

    const [allSales, allPayments, allPurchases, allExpenses, allRepayments] = await Promise.all([
      prisma.sale.findMany({ where: { businessId, saleDate: { gte: yearStart, lte: yearEnd } }, select: { saleDate: true, totalAmount: true } }),
      prisma.payment.findMany({ where: { businessId, paymentDate: { gte: yearStart, lte: yearEnd } }, select: { paymentDate: true, amount: true } }),
      prisma.purchase.findMany({ where: { businessId, purchaseDate: { gte: yearStart, lte: yearEnd } }, select: { purchaseDate: true, totalAmount: true } }),
      prisma.expense.findMany({ where: { businessId, expenseDate: { gte: yearStart, lte: yearEnd } }, select: { expenseDate: true, amount: true } }),
      prisma.loanRepayment.findMany({ where: { loan: { businessId }, repaymentDate: { gte: yearStart, lte: yearEnd } }, select: { repaymentDate: true, amount: true, interestAmount: true } }),
    ]);

    function getMonth(d: Date | string) { return new Date(d).getMonth() + 1; }
    const months = Array.from({ length: 12 }, (_, i) => {
      const m          = i + 1;
      const st         = allSales.filter(x => getMonth(x.saleDate) === m).reduce((s, x) => s + x.totalAmount, 0);
      const pt         = allPayments.filter(x => getMonth(x.paymentDate) === m).reduce((s, x) => s + x.amount, 0);
      const purt       = allPurchases.filter(x => getMonth(x.purchaseDate) === m).reduce((s, x) => s + x.totalAmount, 0);
      const et         = allExpenses.filter(x => getMonth(x.expenseDate) === m).reduce((s, x) => s + x.amount, 0);
      const ip         = allRepayments.filter(x => getMonth(x.repaymentDate) === m).reduce((s, x) => s + x.interestAmount, 0);
      const gp         = st - purt;
      const np         = gp - et - ip;
      return { month: m, salesTotal: st, paymentsReceived: pt, purchasesTotal: purt, expensesTotal: et, interestPaid: ip, grossProfit: gp, netProfit: np };
    });

    const totals = {
      salesTotal:       months.reduce((s, x) => s + x.salesTotal, 0),
      paymentsReceived: months.reduce((s, x) => s + x.paymentsReceived, 0),
      purchasesTotal:   months.reduce((s, x) => s + x.purchasesTotal, 0),
      expensesTotal:    months.reduce((s, x) => s + x.expensesTotal, 0),
      interestPaid:     months.reduce((s, x) => s + x.interestPaid, 0),
      grossProfit:      0, netProfit: 0,
    };
    totals.grossProfit = totals.salesTotal - totals.purchasesTotal;
    totals.netProfit   = totals.grossProfit - totals.expensesTotal - totals.interestPaid;

    statementData = { year, period, totals, months };
    subject       = `${businessName} — Yearly Summary: ${year}`;
    html          = buildYearlyHtml(statementData, businessName, currencySymbol);

  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Send email
  const { success, error: sendError } = await sendEmail({ to, subject, html });

  // Log to NotificationLog
  await prisma.notificationLog.create({
    data: {
      businessId,
      type,
      period,
      sentTo: to,
      status: success ? "SENT" : "FAILED",
      error:  sendError ?? null,
    },
  });

  if (!success) {
    return NextResponse.json({ error: sendError ?? "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
