import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSupplier(businessId: string, id: string) {
  return prisma.supplier.findFirst({ where: { id, businessId, isActive: true } });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await getSupplier(session.user.businessId, params.id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const purchases = await prisma.purchase.findMany({
    where:   { supplierId: params.id, businessId: session.user.businessId },
    orderBy: { purchaseDate: "desc" },
    take:    20,
    include: { items: true },
  });

  const totalPurchased = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalDue       = purchases.reduce((s, p) => s + p.dueAmount, 0);

  return NextResponse.json({ ...supplier, purchases, totalPurchased, totalDue });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await getSupplier(session.user.businessId, params.id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, phone, email, address, contactPerson, notes } = await req.json();

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      ...(name          !== undefined && { name: name.trim() }),
      ...(phone         !== undefined && { phone: phone || null }),
      ...(email         !== undefined && { email: email || null }),
      ...(address       !== undefined && { address: address || null }),
      ...(contactPerson !== undefined && { contactPerson: contactPerson || null }),
      ...(notes         !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supplier = await getSupplier(session.user.businessId, params.id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.supplier.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
