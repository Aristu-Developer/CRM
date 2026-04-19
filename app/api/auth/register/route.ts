import { NextResponse }                                    from "next/server";
import { randomBytes }                                    from "crypto";
import bcrypt                                             from "bcryptjs";
import { prisma }                                         from "@/lib/prisma";
import { isSmtpConfigured, sendVerificationEmail }        from "@/lib/email";
import { z }                                              from "zod";

const schema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(data.password, 12);

    // When SMTP is configured require email verification; otherwise (local dev)
    // auto-verify so the developer isn't blocked by a missing mail server.
    const smtpReady   = isSmtpConfigured();
    const verifyToken = smtpReady ? randomBytes(32).toString("hex") : null;
    const isVerified  = !smtpReady;

    // Check for a pending invite to an existing business
    const pendingInvite = await prisma.teamInvite.findFirst({
      where: { email, status: "PENDING" },
    });

    let user;
    if (pendingInvite) {
      // Invited user: join the inviting business with the assigned role
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { name: data.name, email, password: hashed, verifyToken, isVerified },
        });
        await tx.membership.create({
          data: {
            userId:     created.id,
            businessId: pendingInvite.businessId,
            role:       pendingInvite.role,
          },
        });
        await tx.teamInvite.update({
          where: { id: pendingInvite.id },
          data:  { status: "ACCEPTED", acceptedById: created.id, acceptedAt: new Date() },
        });
        return created;
      });
    } else {
      // New owner: create their own business and become ADMIN
      user = await prisma.$transaction(async (tx) => {
        const business = await tx.business.create({
          data: { businessName: `${data.name}'s Business`, onboardingDone: false },
        });
        const created = await tx.user.create({
          data: { name: data.name, email, password: hashed, verifyToken, isVerified },
        });
        await tx.membership.create({
          data: { userId: created.id, businessId: business.id, role: "ADMIN" },
        });
        return created;
      });
    }

    // Send verification email outside the transaction so a mail failure never
    // rolls back the account. The token is stored — a resend flow can be added
    // later if needed.
    if (smtpReady && verifyToken) {
      const appUrl    = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const verifyUrl = `${appUrl}/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, data.name, verifyUrl);
    }

    return NextResponse.json(
      { id: user.id, requiresVerification: smtpReady },
      { status: 201 },
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
