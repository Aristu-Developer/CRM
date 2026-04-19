import { NextResponse } from "next/server";
import { randomBytes }   from "crypto";
import { prisma }        from "@/lib/prisma";
import { isSmtpConfigured, sendVerificationEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 * Body: { email: string }
 *
 * Generates a fresh token and re-sends the verification email.
 * Always returns a generic success message to avoid leaking whether
 * an email address is registered.
 */
export async function POST(req: Request) {
  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "Email verification is not enabled on this server." },
      { status: 503 },
    );
  }

  let email: string;
  try {
    const body = await req.json();
    email = (body?.email ?? "").toString().toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email address is required." }, { status: 400 });
  }

  // Look up the user — only resend if they exist and are still unverified
  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, name: true, isVerified: true },
  });

  // Don't reveal whether the address is registered
  if (!user || user.isVerified) {
    return NextResponse.json({ success: true });
  }

  // Rotate the token so old links stop working
  const verifyToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data:  { verifyToken },
  });

  const appUrl    = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const verifyUrl = `${appUrl}/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, user.name, verifyUrl);

  return NextResponse.json({ success: true });
}
