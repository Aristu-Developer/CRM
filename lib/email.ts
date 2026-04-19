import nodemailer from "nodemailer";

export interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port   = parseInt(process.env.SMTP_PORT ?? "587");
  const secure = port === 465;

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const businessName = process.env.APP_NAME ?? "Nepal CRM";
  return sendEmail({
    to,
    subject: `Verify your ${businessName} account`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 32px">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700">${businessName}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
              Thanks for signing up. Please verify your email address to activate your account.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:#2563eb">
                  <a href="${verifyUrl}"
                     style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all">${verifyUrl}</a>
            </p>
            <p style="margin:20px 0 0;font-size:13px;color:#9ca3af">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center">${businessName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const businessName = process.env.APP_NAME ?? "Nepal CRM";
  return sendEmail({
    to,
    subject: `Reset your ${businessName} password`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <tr>
          <td style="background:#2563eb;padding:28px 32px">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700">${businessName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
              We received a request to reset your password. Click the button below to choose a new one.
              This link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:#2563eb">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
              If the button doesn't work, paste this link into your browser:<br>
              <a href="${resetUrl}" style="color:#2563eb;word-break:break-all">${resetUrl}</a>
            </p>
            <p style="margin:20px 0 0;font-size:13px;color:#9ca3af">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center">${businessName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendEmail(
  opts: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    await transporter.sendMail({
      from:    process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to send email" };
  }
}
