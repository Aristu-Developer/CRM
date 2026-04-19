/**
 * Super Admin access control.
 *
 * Allowed emails are read from two sources (combined, deduped):
 *  1. SUPER_ADMIN_EMAILS environment variable — comma-separated list.
 *     Add more admins without touching code:
 *       SUPER_ADMIN_EMAILS=a@b.com,c@d.com
 *  2. The hardcoded list below — always allowed even without the env var.
 *
 * All comparisons are case-insensitive.
 */

const HARDCODED_ADMIN_EMAILS = [
  "sangharsh.thecreator@gmail.com",
];

export function getSuperAdminEmails(): string[] {
  const fromEnv =
    process.env.SUPER_ADMIN_EMAILS
      ?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return [
    ...new Set([
      ...HARDCODED_ADMIN_EMAILS.map((e) => e.toLowerCase()),
      ...fromEnv,
    ]),
  ];
}

/**
 * Returns true if the session belongs to a platform super-admin.
 * Use this in server-side API routes and server components.
 */
export function isPlatformAdmin(session: any): boolean {
  const email = session?.user?.email;
  if (!email) return false;
  return getSuperAdminEmails().includes(email.toLowerCase());
}

/**
 * Simple email-only check (no full session needed).
 * Safe with null / undefined.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.toLowerCase());
}
