import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import bcrypt               from "bcryptjs";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/account/password
 * Body: { currentPassword: string; newPassword: string }
 *
 * Lets a signed-in user change their own password.
 * Requires the current password to prevent abuse of unattended sessions.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let currentPassword: string;
  let newPassword: string;
  try {
    const body    = await req.json();
    currentPassword = (body?.currentPassword ?? "").toString();
    newPassword     = (body?.newPassword     ?? "").toString();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!currentPassword) return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  if (!newPassword)     return NextResponse.json({ error: "New password is required."     }, { status: 400 });
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, password: true },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const passwordOk = await bcrypt.compare(currentPassword, user.password);
  if (!passwordOk) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data:  { password: hashed },
  });

  return NextResponse.json({ success: true });
}
