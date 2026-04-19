import { NextResponse } from "next/server";
import bcrypt           from "bcryptjs";
import { prisma }       from "@/lib/prisma";
import { z }            from "zod";

// ── GET ?token= ──────────────────────────────────────────────────────────────
// Used by the reset-password page on load to validate the token before showing
// the form. Returns { valid: bool } — never exposes user data.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();

  if (!token) return NextResponse.json({ valid: false });

  const user = await prisma.user.findFirst({
    where: {
      resetToken:        token,
      resetTokenExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  return NextResponse.json({ valid: !!user });
}

// ── POST { token, password } ─────────────────────────────────────────────────
// Validates the token, hashes and saves the new password, then clears the token.
const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      resetToken:        token,
      resetTokenExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password:          hashed,
      resetToken:        null,
      resetTokenExpires: null,
    },
  });

  return NextResponse.json({ success: true });
}
