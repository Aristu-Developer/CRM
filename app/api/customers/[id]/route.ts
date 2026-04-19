import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validations/customer";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const customer = await prisma.customer.findFirst({
    where:   { id: params.id, businessId },
    include: {
      sales: {
        orderBy: { saleDate: "desc" },
        take: 20,
        include: { items: { include: { product: true } }, payments: true },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const salesAgg = await prisma.sale.aggregate({
    where:  { customerId: params.id, businessId },
    _sum:   { totalAmount: true, paidAmount: true, dueAmount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    ...customer,
    stats: {
      totalSales:  salesAgg._count.id,
      totalAmount: salesAgg._sum.totalAmount ?? 0,
      totalPaid:   salesAgg._sum.paidAmount  ?? 0,
      totalDue:    salesAgg._sum.dueAmount   ?? 0,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body    = await req.json();
    const data    = customerSchema.partial().parse(body);
    const updated = await prisma.customer.updateMany({
      where: { id: params.id, businessId },
      data,
    });
    if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const salesCount = await prisma.sale.count({ where: { customerId: params.id, businessId } });
  if (salesCount > 0) {
    await prisma.customer.updateMany({ where: { id: params.id, businessId }, data: { isActive: false } });
    return NextResponse.json({ message: "Customer deactivated (has sales)" });
  }

  await prisma.customer.deleteMany({ where: { id: params.id, businessId } });
  return NextResponse.json({ message: "Deleted" });
}
