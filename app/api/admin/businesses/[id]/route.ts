import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { isPlatformAdmin }  from "@/lib/admin";
import { prisma }           from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const [
    business,
    team,
    salesAgg,
    purchasesAgg,
    expensesAgg,
    loansAgg,
    repayAgg,
    customerCount,
    productCount,
    recentSales,
    recentPurchases,
    recentExpenses,
  ] = await Promise.all([
    prisma.business.findUnique({ where: { id } }),

    prisma.membership.findMany({
      where:   { businessId: id },
      include: {
        user: { select: { name: true, email: true, isActive: true, createdAt: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),

    prisma.sale.aggregate({
      where: { businessId: id },
      _sum:  { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: { _all: true },
    }),
    prisma.purchase.aggregate({
      where: { businessId: id },
      _sum:  { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: { _all: true },
    }),
    prisma.expense.aggregate({
      where: { businessId: id },
      _sum:  { amount: true },
      _count: { _all: true },
    }),
    prisma.loan.aggregate({
      where: { businessId: id },
      _sum:  { principalAmount: true },
      _count: { _all: true },
    }),
    prisma.loanRepayment.aggregate({
      where: { loan: { businessId: id } },
      _sum:  { amount: true, interestAmount: true },
      _count: { _all: true },
    }),

    prisma.customer.count({ where: { businessId: id } }),
    prisma.product.count({ where: { businessId: id } }),

    prisma.sale.findMany({
      where:   { businessId: id },
      orderBy: { saleDate: "desc" },
      take: 5,
      select: {
        id: true, invoiceNumber: true, saleDate: true,
        totalAmount: true, paymentStatus: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.purchase.findMany({
      where:   { businessId: id },
      orderBy: { purchaseDate: "desc" },
      take: 5,
      select: {
        id: true, referenceNo: true, purchaseDate: true,
        totalAmount: true, paymentStatus: true,
        supplier: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      where:   { businessId: id },
      orderBy: { expenseDate: "desc" },
      take: 5,
      select: { id: true, title: true, category: true, expenseDate: true, amount: true },
    }),
  ]);

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const salesTotal     = salesAgg._sum.totalAmount    ?? 0;
  const purchasesTotal = purchasesAgg._sum.totalAmount ?? 0;
  const expensesTotal  = expensesAgg._sum.amount       ?? 0;
  const interestPaid   = repayAgg._sum.interestAmount  ?? 0;

  return NextResponse.json({
    business,
    team: team.map((m) => ({
      name:         m.user.name,
      email:        m.user.email,
      isActive:     m.user.isActive,
      userCreatedAt: m.user.createdAt,
      role:         m.role,
      joinedAt:     m.joinedAt,
      membershipId: m.id,
    })),
    stats: {
      salesTotal,       salesCount:    salesAgg._count._all,
      salesPaid:        salesAgg._sum.paidAmount    ?? 0,
      salesDue:         salesAgg._sum.dueAmount     ?? 0,
      purchasesTotal,   purchasesCount: purchasesAgg._count._all,
      purchasesPaid:    purchasesAgg._sum.paidAmount  ?? 0,
      purchasesDue:     purchasesAgg._sum.dueAmount   ?? 0,
      expensesTotal,    expensesCount: expensesAgg._count._all,
      loansCount:       loansAgg._count._all,
      loansPrincipal:   loansAgg._sum.principalAmount ?? 0,
      repaymentTotal:   repayAgg._sum.amount         ?? 0,
      interestPaid,
      customerCount,
      productCount,
      estProfit: salesTotal - purchasesTotal - expensesTotal - interestPaid,
    },
    recentSales,
    recentPurchases,
    recentExpenses,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { action } = await req.json();

  if (action === "deactivate") {
    const updated = await prisma.business.update({
      where: { id },
      data:  { deletedAt: new Date() },
      select: { id: true, businessName: true, deletedAt: true },
    });
    return NextResponse.json({ success: true, business: updated });
  }

  if (action === "reactivate") {
    const updated = await prisma.business.update({
      where: { id },
      data:  { deletedAt: null },
      select: { id: true, businessName: true, deletedAt: true },
    });
    return NextResponse.json({ success: true, business: updated });
  }

  return NextResponse.json({ error: "Invalid action. Use 'deactivate' or 'reactivate'." }, { status: 400 });
}
