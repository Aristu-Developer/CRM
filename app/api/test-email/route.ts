import { NextResponse } from "next/server";
import { sendEmail, isSmtpConfigured } from "@/lib/email";

/**
 * POST /api/test-email
 * Body: { to?: string }
 *
 * Sends a test email to verify that the SMTP configuration is working.
 * Falls back to SMTP_USER if no "to" address is provided.
 *
 * Remove or protect this route before going to production.
 */
export async function POST(req: Request) {
  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:   "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file.",
      },
      { status: 503 },
    );
  }

  let to: string | undefined;
  try {
    const body = await req.json();
    to = typeof body?.to === "string" ? body.to.trim() : undefined;
  } catch {
    // body is optional — fall through to the default below
  }

  // Default to the sender address if no recipient was provided
  if (!to) {
    to = process.env.SMTP_USER ?? "";
  }

  if (!to) {
    return NextResponse.json(
      { success: false, error: "No recipient address. Pass { \"to\": \"you@example.com\" } in the request body." },
      { status: 400 },
    );
  }

  const result = await sendEmail({
    to,
    subject: "Nepal CRM — SMTP test email",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px;font-family:Arial,Helvetica,sans-serif;background:#f9fafb">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">
    <h2 style="margin:0 0 12px;font-size:20px;color:#111827">SMTP test successful</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#6b7280">
      If you received this message, your SMTP configuration is working correctly.
    </p>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0">
    <p style="margin:0;font-size:12px;color:#d1d5db">Sent from Nepal CRM · ${new Date().toISOString()}</p>
  </div>
</body>
</html>`,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, sentTo: to });
}
