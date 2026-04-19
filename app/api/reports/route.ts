import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

function getDateRange(preset: string, from?: string, to?: string) {
  const now = new Date();
  if (preset === "today") return { from: startOfDay(now), to: endOfDay(now) };
  if (preset === "week")  return { from: startOfWeek(now), to: endOfWeek(now) };
  if (preset === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (from && to)         return { from: new Date(from), to: new Date(to + "T23:59:59") };
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type")   ?? "sales";
  const preset = searchParams.get("preset") ?? "month";
  const from   = searchParams.get("from")   ?? "";
  const to     = searchParams.get("to")     ?? "";

  const { from: dateFrom, to: dateTo } = getDateRange(preset, from, to);

  try {
    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where:   { businessId, saleDate: { gte: dateFrom, lte: dateTo } },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { saleDate: "desc" },
      });
      const agg = await prisma.sale.aggregate({
        where:  { businessId, saleDate: { gte: dateFrom, lte: dateTo } },
        _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      });
      return NextResponse.json({ data: sales, summary: agg });
    }

    if (type === "payments") {
      const payments = await prisma.payment.findMany({
        where:   { businessId, paymentDate: { gte: dateFrom, lte: dateTo } },
        include: { sale: { select: { invoiceNumber: true } }, receivedBy: { select: { name: true } } },
        orderBy: { paymentDate: "desc" },
      });
      const agg = await prisma.payment.aggregate({
        where:  { businessId, paymentDate: { gte: dateFrom, lte: dateTo } },
        _sum:   { amount: true },
        _count: { id: true },
      });
      return NextResponse.json({ data: payments, summary: agg });
    }

    if (type === "dues") {
      const dues = await prisma.sale.findMany({
        where:   { businessId, dueAmount: { gt: 0 } },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { dueAmount: "desc" },
      });
      const total = await prisma.sale.aggregate({
        where: { businessId, dueAmount: { gt: 0 } },
        _sum:  { dueAmount: true },
      });
      const normalizedDues = dues.map((d) => ({
        ...d,
        subtotal:       Number(d.subtotal)       || 0,
        discountAmount: Number(d.discountAmount) || 0,
        totalAmount:    Number(d.totalAmount)    || 0,
        paidAmount:     Number(d.paidAmount)     || 0,
        dueAmount:      Number(d.dueAmount)      || 0,
      }));
      return NextResponse.json({ data: normalizedDues, summary: total });
    }

    if (type === "inventory") {
      const products = await prisma.product.findMany({
        where:   { businessId, isActive: true },
        orderBy: { stock: "asc" },
      });
      const lowStock = products.filter((p) => p.stock <= p.reorderLevel).length;
      return NextResponse.json({
        data:    products.map((p) => ({ ...p, isLowStock: p.stock <= p.reorderLevel })),
        summary: { totalProducts: products.length, lowStockCount: lowStock },
      });
    }

    if (type === "customers") {
      const customers = await prisma.customer.findMany({
        where:   { businessId, isActive: true },
        include: {
          _count: { select: { sales: true } },
          sales:  { select: { totalAmount: true, paidAmount: true, dueAmount: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const enriched = customers.map((c) => ({
        ...c,
        totalSales:  c._count.sales,
        totalAmount: c.sales.reduce((s, sale) => s + (Number(sale.totalAmount) || 0), 0),
        totalPaid:   c.sales.reduce((s, sale) => s + (Number(sale.paidAmount)  || 0), 0),
        totalDue:    c.sales.reduce((s, sale) => s + (Number(sale.dueAmount)   || 0), 0),
      }));
      return NextResponse.json({ data: enriched, summary: { total: customers.length } });
    }

    if (type === "purchases") {
      const purchases = await prisma.purchase.findMany({
        where:   { businessId, purchaseDate: { gte: dateFrom, lte: dateTo } },
        include: { supplier: { select: { name: true } } },
        orderBy: { purchaseDate: "desc" },
      });
      const agg = await prisma.purchase.aggregate({
        where:  { businessId, purchaseDate: { gte: dateFrom, lte: dateTo } },
        _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      });
      return NextResponse.json({ data: purchases, summary: agg });
    }

    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where:   { businessId, expenseDate: { gte: dateFrom, lte: dateTo } },
        orderBy: { expenseDate: "desc" },
      });
      const agg = await prisma.expense.aggregate({
        where:  { businessId, expenseDate: { gte: dateFrom, lte: dateTo } },
        _sum:   { amount: true },
        _count: { id: true },
      });
      return NextResponse.json({ data: expenses, summary: agg });
    }

    if (type === "loans") {
      const loans = await prisma.loan.findMany({
        where:   { businessId },
        include: { repayments: { select: { amount: true, interestAmount: true } } },
        orderBy: { startDate: "desc" },
      });
      const enriched = loans.map((l) => ({
        ...l,
        totalRepaid:    l.repayments.reduce((s, r) => s + r.amount, 0),
        totalInterest:  l.repayments.reduce((s, r) => s + r.interestAmount, 0),
        repaymentCount: l.repayments.length,
      }));
      return NextResponse.json({ data: enriched, summary: { total: loans.length } });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (err) {
    console.error("[reports] GET error:", err);
    return NextResponse.json({ data: [], summary: null }, { status: 500 });
  }
}
