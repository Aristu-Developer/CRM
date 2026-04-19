import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import bcrypt               from "bcryptjs";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/account/email
 * Body: { newEmail: string; currentPassword: string }
 *
 * Lets a signed-in user change their own email address.
 * Requires the current password as a second factor to prevent hijacking.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let newEmail: string;
  let currentPassword: string;
  try {
    const body    = await req.json();
    newEmail      = (body?.newEmail      ?? "").toString().toLowerCase().trim();
    currentPassword = (body?.currentPassword ?? "").toString();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!newEmail)        return NextResponse.json({ error: "New email is required."      }, { status: 400 });
  if (!currentPassword) return NextResponse.json({ error: "Current password is required." }, { status: 400 });

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, email: true, password: true },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const passwordOk = await bcrypt.compare(currentPassword, user.password);
  if (!passwordOk) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  if (newEmail === user.email) {
    return NextResponse.json({ error: "The new email is the same as your current email." }, { status: 400 });
  }

  // Make sure the new email isn't taken by another account
  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (taken) return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });

  await prisma.user.update({
    where: { id: user.id },
    data:  { email: newEmail },
  });

  return NextResponse.json({ success: true });
}
