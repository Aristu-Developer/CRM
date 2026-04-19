import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        // Block sign-in until the email address has been verified.
        // Throwing (rather than returning null) lets the login page distinguish
        // this case from a wrong password and show a targeted message.
        if (!user.isVerified) throw new Error("email_not_verified");

        // Look up the user's membership to get their businessId and scoped role.
        // Exclude memberships for soft-deleted businesses so deleted accounts
        // can no longer sign in.
        const membership = await prisma.membership.findFirst({
          where:   { userId: user.id, business: { deletedAt: null } },
          orderBy: { joinedAt: "asc" },
          select:  {
            businessId: true,
            role:       true,
            business:   { select: { onboardingDone: true } },
          },
        });

        // No active workspace means this account is deleted — block sign-in
        if (!membership) return null;

        return {
          id:             user.id,
          email:          user.email,
          name:           user.name,
          businessId:     membership.businessId,
          role:           membership.role,
          onboardingDone: membership.business.onboardingDone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user) {
        // Initial sign-in: populate token from the authorize() return value
        token.id             = user.id;
        token.businessId     = (user as any).businessId;
        token.role           = (user as any).role;
        token.onboardingDone = (user as any).onboardingDone;
      }
      if (trigger === "update" && sessionUpdate?.onboardingDone !== undefined) {
        // After onboarding completes the client calls update({ onboardingDone: true })
        token.onboardingDone = sessionUpdate.onboardingDone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id             = token.id             as string;
        session.user.businessId     = token.businessId     as string;
        session.user.role           = token.role           as string;
        session.user.onboardingDone = token.onboardingDone as boolean;
      }
      return session;
    },
  },
};
