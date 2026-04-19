import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { isPlatformAdmin }  from "@/lib/admin";
import { prisma }           from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [businesses, salesByBiz, purchasesByBiz, expensesByBiz] = await Promise.all([
    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { customers: true, products: true, memberships: true } },
        memberships: {
          where:   { role: "ADMIN" },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { joinedAt: "asc" },
          take: 1,
        },
      },
    }),
    prisma.sale.groupBy({
      by:   ["businessId"],
      _sum: { totalAmount: true, dueAmount: true },
      _count: { _all: true },
    }),
    prisma.purchase.groupBy({
      by:   ["businessId"],
      _sum: { totalAmount: true },
    }),
    prisma.expense.groupBy({
      by:   ["businessId"],
      _sum: { amount: true },
    }),
  ]);

  const salesMap     = Object.fromEntries(salesByBiz.map((s) => [s.businessId, s]));
  const purchasesMap = Object.fromEntries(purchasesByBiz.map((p) => [p.businessId, p]));
  const expensesMap  = Object.fromEntries(expensesByBiz.map((e) => [e.businessId, e]));

  return NextResponse.json(
    businesses.map((biz) => {
      const s = salesMap[biz.id];
      const p = purchasesMap[biz.id];
      const e = expensesMap[biz.id];
      const salesTotal     = s?._sum.totalAmount ?? 0;
      const purchasesTotal = p?._sum.totalAmount ?? 0;
      const expensesTotal  = e?._sum.amount      ?? 0;
      return {
        id:             biz.id,
        businessName:   biz.businessName,
        businessType:   biz.businessType,
        createdAt:      biz.createdAt,
        deletedAt:      biz.deletedAt,
        admin:          biz.memberships[0]?.user ?? null,
        usersCount:     biz._count.memberships,
        customersCount: biz._count.customers,
        productsCount:  biz._count.products,
        salesCount:     s?._count._all ?? 0,
        salesTotal,
        purchasesTotal,
        expensesTotal,
        openDues:       s?._sum.dueAmount ?? 0,
        estProfit:      salesTotal - purchasesTotal - expensesTotal,
      };
    })
  );
}
