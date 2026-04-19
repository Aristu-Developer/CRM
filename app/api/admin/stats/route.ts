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

  const [
    totalBusinesses,
    activeBusinesses,
    deletedBusinesses,
    totalUsers,
    recentBusinesses,
    recentUsers,
    salesAgg,
    paymentsAgg,
    purchasesAgg,
    expensesAgg,
    interestAgg,
    openDues,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { deletedAt: { not: null } } }),
    prisma.user.count(),

    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, businessName: true, businessType: true, createdAt: true, deletedAt: true,
        memberships: {
          where:   { role: "ADMIN" },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { joinedAt: "asc" },
          take: 1,
        },
        _count: { select: { memberships: true } },
      },
    }),

    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, email: true, isActive: true, createdAt: true,
        memberships: {
          include: { business: { select: { businessName: true } } },
          orderBy: { joinedAt: "asc" },
          take: 1,
        },
      },
    }),

    prisma.sale.aggregate({ _sum: { totalAmount: true, paidAmount: true }, _count: { _all: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
    prisma.purchase.aggregate({ _sum: { totalAmount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
    prisma.loanRepayment.aggregate({ _sum: { interestAmount: true } }),
    prisma.sale.aggregate({
      where: { dueAmount: { gt: 0 } },
      _sum:  { dueAmount: true },
      _count: { _all: true },
    }),
  ]);

  const salesTotal     = salesAgg._sum.totalAmount    ?? 0;
  const purchasesTotal = purchasesAgg._sum.totalAmount ?? 0;
  const expensesTotal  = expensesAgg._sum.amount       ?? 0;
  const interestPaid   = interestAgg._sum.interestAmount ?? 0;

  return NextResponse.json({
    businesses: {
      total:   totalBusinesses,
      active:  activeBusinesses,
      deleted: deletedBusinesses,
    },
    users: { total: totalUsers },
    platform: {
      salesTotal,
      salesCount:         salesAgg._count._all,
      paymentsCollected:  paymentsAgg._sum.amount ?? 0,
      paymentsCount:      paymentsAgg._count._all,
      purchasesTotal,
      purchasesCount:     purchasesAgg._count._all,
      expensesTotal,
      expensesCount:      expensesAgg._count._all,
      interestPaid,
      estProfit:          salesTotal - purchasesTotal - expensesTotal - interestPaid,
      openDues:           openDues._sum.dueAmount ?? 0,
      openDuesCount:      openDues._count._all,
    },
    recentBusinesses: recentBusinesses.map((b) => ({
      id:           b.id,
      businessName: b.businessName,
      businessType: b.businessType,
      createdAt:    b.createdAt,
      deletedAt:    b.deletedAt,
      admin:        b.memberships[0]?.user ?? null,
      membersCount: b._count.memberships,
    })),
    recentUsers: recentUsers.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      isActive:  u.isActive,
      createdAt: u.createdAt,
      business:  u.memberships[0]?.business?.businessName ?? "—",
      role:      u.memberships[0]?.role ?? "—",
    })),
  });
}
