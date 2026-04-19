import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const invite = await prisma.teamInvite.findFirst({ where: { id: params.id, businessId } });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending invites can be canceled" }, { status: 400 });
  }

  const updated = await prisma.teamInvite.update({
    where: { id: params.id },
    data:  { status: "CANCELED", canceledAt: new Date() },
  });

  return NextResponse.json(updated);
}
