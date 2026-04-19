import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q") ?? "";
  const limit  = parseInt(searchParams.get("limit") ?? "50");

  const where: any = {
    businessId,
    isActive: true,
    ...(q && { name: { contains: q } }),
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      include: {
        _count: { select: { purchases: true } },
      },
    }),
    prisma.supplier.count({ where }),
  ]);

  // Compute totalDue per supplier
  const supplierIds = suppliers.map((s) => s.id);
  const dueAggs = await prisma.purchase.groupBy({
    by:     ["supplierId"],
    where:  { businessId, supplierId: { in: supplierIds } },
    _sum:   { dueAmount: true },
  });
  const dueMap = Object.fromEntries(dueAggs.map((a) => [a.supplierId, a._sum.dueAmount ?? 0]));

  const result = suppliers.map((s) => ({
    ...s,
    totalPurchases: s._count.purchases,
    totalDue:       dueMap[s.id] ?? 0,
    _count:         undefined,
  }));

  return NextResponse.json({ suppliers: result, total });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, id: userId } = session.user;
  const body = await req.json();

  const { name, phone, email, address, contactPerson, notes } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      businessId,
      name:          name.trim(),
      phone:         phone    || null,
      email:         email    || null,
      address:       address  || null,
      contactPerson: contactPerson || null,
      notes:         notes    || null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
