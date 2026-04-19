/**
 * WhatsApp & SMS reminder utilities.
 *
 * ─── Architecture for future SMS provider integration ────────────────────────
 * To add SMS sending (e.g. Sparrow SMS Nepal, Twilio):
 *
 * 1. Add provider credentials to .env:
 *      SMS_PROVIDER="sparrow"          # or "twilio"
 *      SMS_API_KEY="..."
 *      SMS_SENDER_ID="YourShopName"
 *
 * 2. Create app/api/reminders/route.ts  (POST handler):
 *      - Validate session + businessId
 *      - Look up sale + customer from DB
 *      - Build message via buildReminderMessage()
 *      - Call your SMS provider API
 *      - Log to NotificationLog (type: "SMS_REMINDER", sentTo: phone, period: saleId)
 *      - Return { success: boolean, messageId?: string }
 *
 * 3. In the UI, call POST /api/reminders with { saleId } instead of opening the
 *    WhatsApp link.  Track a "sent" state per row to show confirmation.
 *
 * Current status: WhatsApp deep-link approach (zero-backend, instant to use).
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface ReminderParams {
  customerName:   string;
  businessName?:  string;
  invoiceNumber:  string;
  dueAmount:      number;
  currencySymbol?: string;
  repayDate?:     string | null;
  promiseNote?:   string | null;
}

/**
 * Normalise a phone number to international format for WhatsApp.
 * Defaults to Nepal country code (977) when no prefix is present.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("977")) return digits;
  if (digits.startsWith("0"))   return "977" + digits.slice(1);
  if (digits.length === 10)     return "977" + digits;
  return digits; // unknown format — pass through
}

/** Build the payment reminder message text. */
export function buildReminderMessage({
  customerName,
  businessName,
  invoiceNumber,
  dueAmount,
  currencySymbol = "Rs.",
  repayDate,
  promiseNote,
}: ReminderParams): string {
  const amount = `${currencySymbol} ${dueAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const greeting = businessName
    ? `This is a reminder from *${businessName}*.`
    : "This is a payment reminder.";

  let msg =
    `Hello ${customerName},\n\n` +
    `${greeting}\n\n` +
    `*Invoice:* #${invoiceNumber}\n` +
    `*Outstanding Amount:* ${amount}`;

  if (repayDate) msg += `\n*Due Date:* ${repayDate}`;
  if (promiseNote) msg += `\n*Note:* ${promiseNote}`;

  msg += `\n\nPlease settle the payment at your earliest convenience. Thank you!`;

  return msg;
}

/** Build a WhatsApp wa.me deep-link URL. */
export function buildWhatsAppLink(phone: string, message: string): string {
  const e164 = formatPhoneForWhatsApp(phone);
  if (!e164) return "";
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}
