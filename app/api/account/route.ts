import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found or already deleted" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Soft-delete the business
    await tx.business.update({
      where: { id: businessId },
      data:  { deletedAt: new Date() },
    });

    // Deactivate all members so future logins are blocked
    const memberships = await tx.membership.findMany({
      where:  { businessId },
      select: { userId: true },
    });
    const userIds = memberships.map((m) => m.userId);
    if (userIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data:  { isActive: false },
      });
    }
  });

  return NextResponse.json({ success: true });
}
