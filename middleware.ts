import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Inlined here so this file stays Edge-runtime safe (no Node-only imports).
// Keep in sync with lib/admin.ts.
const HARDCODED_ADMIN_EMAILS = ["sangharsh.thecreator@gmail.com"];

function isSuperAdminToken(email: string | null | undefined): boolean {
  if (!email) return false;
  const fromEnv =
    process.env.SUPER_ADMIN_EMAILS
      ?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];
  const allowed = [...new Set([...HARDCODED_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])];
  return allowed.includes(email.toLowerCase());
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;

    // ── Super admin panel (/admin/*) ────────────────────────────────────────
    if (path.startsWith("/admin")) {
      if (!isSuperAdminToken(token?.email as string | undefined)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // ── Incomplete onboarding ────────────────────────────────────────────────
    if (token?.onboardingDone === false && !path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // ── Business-admin-only routes ───────────────────────────────────────────
    const adminRoutes = ["/users"];
    if (adminRoutes.some((r) => path.startsWith(r)) && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/payments/:path*",
    "/dues/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/suppliers/:path*",
    "/purchases/:path*",
    "/expenses/:path*",
    "/loans/:path*",
    "/journal/:path*",
    "/statements/:path*",
  ],
};
