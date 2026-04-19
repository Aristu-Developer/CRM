import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const [sale, business] = await Promise.all([
    prisma.sale.findFirst({
      where:   { id: params.id, businessId },
      include: {
        customer:  true,
        items:     { include: { product: { select: { sku: true, unit: true } } } },
        payments:  {
          orderBy: { paymentDate: "desc" },
          include: { receivedBy: { select: { name: true } } },
        },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.business.findFirst({ where: { id: businessId, deletedAt: null } }),
  ]);

  if (!sale)     return NextResponse.json({ error: "Sale not found" },     { status: 404 });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  return NextResponse.json({ sale, business });
}
