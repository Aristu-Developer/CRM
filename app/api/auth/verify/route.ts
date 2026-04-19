import { NextResponse } from "next/server";
import { prisma }        from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!token) {
    return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { verifyToken: token } });

  if (!user) {
    // Token not found — it was either already consumed or is fabricated.
    // When the email is available in the URL we can check whether the account
    // is already verified and return a distinct, friendlier response.
    if (email) {
      const existing = await prisma.user.findUnique({
        where:  { email },
        select: { isVerified: true },
      });
      if (existing?.isVerified) {
        return NextResponse.json({ alreadyVerified: true });
      }
    }
    return NextResponse.json(
      { error: "This verification link is invalid or has already been used." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { isVerified: true, verifyToken: null },
  });

  return NextResponse.json({ success: true });
}
