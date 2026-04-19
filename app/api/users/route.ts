import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns members of the current user's business.
// Response shape matches the old GET /api/users so the Team page needs no changes.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  if (!businessId) return NextResponse.json({ error: "No active business" }, { status: 403 });

  const memberships = await prisma.membership.findMany({
    where:   { businessId },
    orderBy: { joinedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
  });

  const members = memberships.map((m) => ({
    id:        m.user.id,
    name:      m.user.name,
    email:     m.user.email,
    role:      m.role,
    isActive:  m.user.isActive,
    createdAt: m.joinedAt,
  }));

  return NextResponse.json(members);
}
