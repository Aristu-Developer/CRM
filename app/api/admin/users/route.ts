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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, isActive: true, createdAt: true,
      memberships: {
        include: {
          business: { select: { id: true, businessName: true, deletedAt: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      isActive:  u.isActive,
      createdAt: u.createdAt,
      primaryBusiness: u.memberships[0]?.business?.businessName ?? "—",
      primaryRole:     u.memberships[0]?.role ?? "—",
      primaryBusinessId: u.memberships[0]?.business?.id ?? null,
      businesses: u.memberships.map((m) => ({
        businessId:   m.business.id,
        businessName: m.business.businessName,
        role:         m.role,
        joinedAt:     m.joinedAt,
        deleted:      !!m.business.deletedAt,
      })),
    }))
  );
}
