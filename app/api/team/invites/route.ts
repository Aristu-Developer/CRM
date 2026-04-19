import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email:   z.string().email("Invalid email address"),
  role:    z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  message: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  const invites = await prisma.teamInvite.findMany({
    where:   { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy:  { select: { id: true, name: true, email: true } },
      acceptedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = inviteSchema.parse(body);
    const email = data.email.toLowerCase();

    // Check not already a member of this business
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const isMember = await prisma.membership.findFirst({
        where: { userId: existingUser.id, businessId },
      });
      if (isMember) {
        return NextResponse.json({ error: "This email is already a team member" }, { status: 409 });
      }
    }

    // Check no active pending invite for this email in this business
    const pending = await prisma.teamInvite.findFirst({
      where: { email, businessId, status: "PENDING" },
    });
    if (pending) {
      return NextResponse.json({ error: "A pending invite already exists for this email" }, { status: 409 });
    }

    const invite = await prisma.teamInvite.create({
      data: {
        businessId,
        email,
        role:        data.role,
        message:     data.message ?? null,
        invitedById: session.user.id,
      },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
