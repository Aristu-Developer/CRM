import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

// Safe fallback returned whenever something goes wrong or DB is empty
const EMPTY_RESPONSE = {
  stats: {
    totalSales:     0,
    totalRevenue:   0,
    totalPaid:      0,
    totalDue:       0,
    totalCustomers: 0,
    totalProducts:  0,
    lowStockCount:  0,
    overdueCount:   0,
  },
  todaySummary: {
    salesCount:  0,
    salesAmount: 0,
    collected:   0,
    newDue:      0,
  },
  profitSummary: {
    todayGrossProfit:  0,
    todayNetProfit:    0,
    monthGrossProfit:  0,
    monthNetProfit:    0,
    totalGrossProfit:  0,
    totalNetProfit:    0,
  },
  lowStockProducts: [],
  recentSales:    [],
  recentPayments: [],
  topProducts:    [],
  chartData:      [],
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const chartType   = searchParams.get("chart")  ?? "sales";
  const chartPeriod = searchParams.get("period") ?? "monthly";

  try {
    // ─── Low-stock count ─────────────────────────────────────
    // $queryRaw is required because Prisma cannot compare two columns of the
    // same row in a `where` clause (stock <= reorderLevel).
    // IMPORTANT: Prisma + SQLite keeps camelCase column names (reorderLevel,
    // isActive, businessId) — snake_case aliases like reorder_level do NOT
    // exist and will throw "no such column". SQLite identifiers are
    // case-insensitive, so reorderLevel / REORDERLEVEL both resolve correctly.
    // BigInt: SQLite COUNT(*) returns bigint; convert explicitly to avoid the
    // "Do not know how to serialize a BigInt" JSON serialisation crash.
    let lowStockCount = 0;
    try {
      const lowStockRows = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM products
        WHERE stock <= reorderLevel
          AND isActive = 1
          AND businessId = ${businessId}
      `;
      lowStockCount = Number(lowStockRows[0]?.count ?? 0);
    } catch (rawErr) {
      console.error("[dashboard] lowStockCount raw query failed:", rawErr);
    }

    // ─── Low-stock product list (top 5, ordered by stock ASC) ────
    type LowStockRow = { id: string; name: string; sku: string; stock: number; reorderLevel: number };
    let lowStockProducts: LowStockRow[] = [];
    try {
      lowStockProducts = await prisma.$queryRaw<LowStockRow[]>`
        SELECT id, name, sku, stock, reorderLevel
        FROM products
        WHERE stock <= reorderLevel
          AND isActive = 1
          AND businessId = ${businessId}
        ORDER BY stock ASC
        LIMIT 5
      `;
      // Ensure numeric types (SQLite integers are returned as JS numbers, not BigInt)
      lowStockProducts = lowStockProducts.map((p) => ({
        ...p,
        stock:        Number(p.stock),
        reorderLevel: Number(p.reorderLevel),
      }));
    } catch (rawErr) {
      console.error("[dashboard] lowStockProducts raw query failed:", rawErr);
    }

    // ─── Date ranges ─────────────────────────────────────────
    const todayStart = startOfDay(new Date());
    const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ─── All other stats (safe on empty DB) ──────────────────
    const [
      totalCustomers,
      totalProducts,
      salesAgg,
      paymentsAgg,
      overdueCount,
      recentSales,
      recentPayments,
      topProducts,
      todaySalesAgg,
      todayCollectionAgg,
      // profit queries
      todayPurchasesAgg,
      todayExpensesAgg,
      monthSalesAgg,
      monthPurchasesAgg,
      monthExpensesAgg,
      allPurchasesAgg,
      allExpensesAgg,
      allLoanInterestAgg,
    ] = await Promise.all([
      prisma.customer.count({ where: { businessId, isActive: true } }),

      prisma.product.count({ where: { businessId, isActive: true } }),

      prisma.sale.aggregate({
        where:  { businessId },
        _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      }),

      prisma.payment.aggregate({
        where: { businessId },
        _sum:  { amount: true },
      }),

      prisma.sale.count({ where: { businessId, paymentStatus: "OVERDUE" } }),

      prisma.sale.findMany({
        where:   { businessId },
        take:    8,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),

      prisma.payment.findMany({
        where:   { businessId },
        take:    6,
        orderBy: { createdAt: "desc" },
        include: { sale: { select: { invoiceNumber: true } } },
      }),

      prisma.saleItem.groupBy({
        by:      ["productId", "productName"],
        where:   { sale: { businessId } },
        _sum:    { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take:    5,
      }),

      // Today's sales aggregate
      prisma.sale.aggregate({
        where:  { businessId, createdAt: { gte: todayStart, lt: todayEnd } },
        _sum:   { totalAmount: true, dueAmount: true },
        _count: { id: true },
      }),

      // Today's payments collected
      prisma.payment.aggregate({
        where: { businessId, createdAt: { gte: todayStart, lt: todayEnd } },
        _sum:  { amount: true },
      }),

      // ─── Profit data ─────────────────────────────────────
      // Today
      prisma.purchase.aggregate({
        where: { businessId, purchaseDate: { gte: todayStart, lt: todayEnd } },
        _sum:  { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId, expenseDate: { gte: todayStart, lt: todayEnd } },
        _sum:  { amount: true },
      }),

      // This month
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: monthStart, lt: monthEnd } },
        _sum:  { totalAmount: true },
      }),
      prisma.purchase.aggregate({
        where: { businessId, purchaseDate: { gte: monthStart, lt: monthEnd } },
        _sum:  { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId, expenseDate: { gte: monthStart, lt: monthEnd } },
        _sum:  { amount: true },
      }),

      // All-time
      prisma.purchase.aggregate({
        where: { businessId },
        _sum:  { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId },
        _sum:  { amount: true },
      }),
      prisma.loanRepayment.aggregate({
        where: { loan: { businessId } },
        _sum:  { interestAmount: true },
      }),
    ]);

    // ─── Chart Data ───────────────────────────────────────────
    const chartData: { date: string; value: number }[] = [];

    if (chartPeriod === "daily") {
      for (let i = 13; i >= 0; i--) {
        const day   = startOfDay(subDays(new Date(), i));
        const next  = startOfDay(subDays(new Date(), i - 1));
        const label = format(day, "dd MMM");

        if (chartType === "sales") {
          const agg = await prisma.sale.aggregate({
            where: { businessId, createdAt: { gte: day, lt: next } },
            _sum:  { totalAmount: true },
          });
          chartData.push({ date: label, value: agg._sum.totalAmount ?? 0 });
        } else if (chartType === "payments") {
          const agg = await prisma.payment.aggregate({
            where: { businessId, createdAt: { gte: day, lt: next } },
            _sum:  { amount: true },
          });
          chartData.push({ date: label, value: agg._sum.amount ?? 0 });
        } else {
          chartData.push({ date: label, value: 0 });
        }
      }
    } else if (chartPeriod === "weekly") {
      for (let i = 7; i >= 0; i--) {
        const start = startOfDay(subDays(new Date(), i * 7));
        const end   = startOfDay(subDays(new Date(), (i - 1) * 7));
        const label = format(start, "dd MMM");

        if (chartType === "sales") {
          const agg = await prisma.sale.aggregate({
            where: { businessId, createdAt: { gte: start, lt: end } },
            _sum:  { totalAmount: true },
          });
          chartData.push({ date: label, value: agg._sum.totalAmount ?? 0 });
        } else if (chartType === "payments") {
          const agg = await prisma.payment.aggregate({
            where: { businessId, createdAt: { gte: start, lt: end } },
            _sum:  { amount: true },
          });
          chartData.push({ date: label, value: agg._sum.amount ?? 0 });
        } else {
          chartData.push({ date: label, value: 0 });
        }
      }
    } else {
      // Monthly — last 6 months
      for (let i = 5; i >= 0; i--) {
        const d     = subDays(new Date(), i * 30);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const label = format(start, "MMM yy");

        if (chartType === "sales") {
          const agg = await prisma.sale.aggregate({
            where: { businessId, createdAt: { gte: start, lt: end } },
            _sum:  { totalAmount: true },
          });
          chartData.push({ date: label, value: agg._sum.totalAmount ?? 0 });
        } else if (chartType === "payments") {
          const agg = await prisma.payment.aggregate({
            where: { businessId, createdAt: { gte: start, lt: end } },
            _sum:  { amount: true },
          });
          chartData.push({ date: label, value: agg._sum.amount ?? 0 });
        } else {
          const agg = await prisma.product.aggregate({ where: { businessId }, _sum: { stock: true } });
          chartData.push({ date: label, value: agg._sum.stock ?? 0 });
        }
      }
    }

    // ─── Profit computations ─────────────────────────────────
    const todaySales    = todaySalesAgg._sum.totalAmount      ?? 0;
    const todayPurch    = todayPurchasesAgg._sum.totalAmount  ?? 0;
    const todayExp      = todayExpensesAgg._sum.amount        ?? 0;

    const monthSales    = monthSalesAgg._sum.totalAmount      ?? 0;
    const monthPurch    = monthPurchasesAgg._sum.totalAmount  ?? 0;
    const monthExp      = monthExpensesAgg._sum.amount        ?? 0;

    const totalRevenue  = salesAgg._sum.totalAmount           ?? 0;
    const totalPurch    = allPurchasesAgg._sum.totalAmount    ?? 0;
    const totalExp      = allExpensesAgg._sum.amount          ?? 0;
    const totalInterest = allLoanInterestAgg._sum.interestAmount ?? 0;

    const profitSummary = {
      todayGrossProfit: todaySales - todayPurch,
      todayNetProfit:   todaySales - todayPurch - todayExp,
      monthGrossProfit: monthSales - monthPurch,
      monthNetProfit:   monthSales - monthPurch - monthExp,
      totalGrossProfit: totalRevenue - totalPurch,
      totalNetProfit:   totalRevenue - totalPurch - totalExp - totalInterest,
    };

    return NextResponse.json({
      stats: {
        totalSales:     salesAgg._count.id       ?? 0,
        totalRevenue,
        totalPaid:      paymentsAgg._sum.amount   ?? 0,
        totalDue:       salesAgg._sum.dueAmount   ?? 0,
        totalCustomers,
        totalProducts,
        lowStockCount,
        overdueCount,
      },
      todaySummary: {
        salesCount:  todaySalesAgg._count.id       ?? 0,
        salesAmount: todaySales,
        collected:   todayCollectionAgg._sum.amount ?? 0,
        newDue:      todaySalesAgg._sum.dueAmount   ?? 0,
      },
      profitSummary,
      lowStockProducts,
      recentSales,
      recentPayments,
      topProducts,
      chartData,
    });
  } catch (err) {
    // Log server-side for debugging, but always return 200 + valid JSON so the
    // frontend shows empty fallback values rather than the error banner.
    console.error("[dashboard] GET error:", err);
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
