import { NextResponse }                                        from "next/server";
import { randomBytes }                                        from "crypto";
import { prisma }                                             from "@/lib/prisma";
import { isSmtpConfigured, sendPasswordResetEmail }          from "@/lib/email";

// Generic response used whether or not the email is registered.
// Never reveal account existence.
const OK = NextResponse.json({ success: true });

export async function POST(req: Request) {
  let email: string;
  try {
    const body = await req.json();
    email = (body?.email ?? "").toString().toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !email.includes("@")) return OK;

  if (!isSmtpConfigured()) {
    // SMTP not set up — still return success so the response is consistent,
    // but the email obviously won't arrive.
    return OK;
  }

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, name: true, isActive: true },
  });

  // No user, inactive account, or any other mismatch — silent success
  if (!user || !user.isActive) return OK;

  const resetToken        = randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data:  { resetToken, resetTokenExpires },
  });

  const appUrl   = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail(email, user.name, resetUrl);

  return OK;
}
