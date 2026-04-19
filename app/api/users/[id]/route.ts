import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  role:     z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
});

// params.id is the target user's userId
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      if (data.role !== undefined) {
        await tx.membership.updateMany({
          where: { userId: params.id, businessId },
          data:  { role: data.role },
        });
      }
      if (data.isActive !== undefined) {
        await tx.user.update({ where: { id: params.id }, data: { isActive: data.isActive } });
      }
    });

    const membership = await prisma.membership.findFirst({
      where:   { userId: params.id, businessId },
      include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
    });

    return NextResponse.json({
      id:       membership!.user.id,
      name:     membership!.user.name,
      email:    membership!.user.email,
      role:     membership!.role,
      isActive: membership!.user.isActive,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
