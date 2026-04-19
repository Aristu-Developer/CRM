import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in NPR — safe for undefined, null, and NaN
export function formatCurrency(amount: number | null | undefined): string {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `Rs. ${safe.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date for display
export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

// Format datetime
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

// Generate an invoice number
export function generateInvoiceNumber(prefix: string, count: number): string {
  return `${prefix}-${String(count).padStart(5, "0")}`;
}

// Payment status color
export function getStatusColor(status: string): string {
  switch (status) {
    case "PAID":     return "green";
    case "PARTIAL":  return "yellow";
    case "UNPAID":   return "red";
    case "OVERDUE":  return "red";
    default:         return "gray";
  }
}

// Payment method label
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH:          "Cash",
    BANK_TRANSFER: "Bank Transfer",
    ESEWA:         "eSewa",
    KHALTI:        "Khalti",
    FONEPAY:       "Fonepay",
    CHEQUE:        "Cheque",
    OTHER:         "Other",
  };
  return labels[method] ?? method;
}

export function getCustomerTypeLabel(type: string): string {
  return type === "BUSINESS" ? "Business" : "Individual";
}
