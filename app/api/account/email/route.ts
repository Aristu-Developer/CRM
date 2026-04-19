import { NextResponse } from "next/server";

// Force dynamic so Next.js never attempts to statically render this route.
export const dynamic = "force-dynamic";

/**
 * PATCH /api/account/email
 * Body: { newEmail: string; currentPassword: string }
 *
 * All imports that touch Prisma, NextAuth, or env vars are done inside
 * the handler so nothing can throw at module initialisation time during
 * the Vercel build.
 */
export async function PATCH(req: Request) {
  try {
    // Lazy imports — nothing runs at module load time.
    const { getServerSession }    = await import("next-auth");
    const { authOptions }         = await import("@/lib/auth");
    const { prisma }              = await import("@/lib/prisma");
    const { default: bcrypt }     = await import("bcryptjs");

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let newEmail: string;
    let currentPassword: string;
    try {
      const body      = await req.json();
      newEmail        = (body?.newEmail        ?? "").toString().toLowerCase().trim();
      currentPassword = (body?.currentPassword ?? "").toString();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!newEmail) {
      return NextResponse.json({ error: "New email is required." }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, email: true, password: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password);
    if (!passwordOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    if (newEmail === user.email) {
      return NextResponse.json(
        { error: "The new email is the same as your current email." },
        { status: 400 },
      );
    }

    const taken = await prisma.user.findUnique({
      where:  { email: newEmail },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { email: newEmail },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[PATCH /api/account/email]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
