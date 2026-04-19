"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/utils";

// Inline currency formatter — avoids pulling in the full utils bundle and
// keeps the "Rs." prefix consistent whether on screen or printed.
function fmt(n: number | null | undefined) {
  const v = Number(n ?? 0);
  const safe = Number.isFinite(v) ? v : 0;
  return `Rs. ${safe.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const METHOD_LABELS: Record<string, string> = {
  CASH:          "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ESEWA:         "eSewa",
  KHALTI:        "Khalti",
  FONEPAY:       "Fonepay",
  CHEQUE:        "Cheque",
  OTHER:         "Other",
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [data,    setData]    = useState<{ sale: any; business: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`/api/sales/${id}/invoice`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load invoice"); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !data) return (
    <div className="py-8 text-center text-red-500">{error || "Invoice not found."}</div>
  );

  const { sale, business } = data;

  const hasDiscountCol = sale.items.some((i: any) => Number(i.discount) > 0);

  // QR payload: compact key data for scanning
  const qrValue = [
    sale.invoiceNumber,
    business.businessName,
    `Total:${Number(sale.totalAmount).toFixed(2)}`,
    `Due:${Number(sale.dueAmount).toFixed(2)}`,
  ].join(" | ");

  const isPaid = sale.paymentStatus === "PAID";

  return (
    <div className="invoice-page-wrap max-w-3xl mx-auto">
      {/* ── Action bar (hidden when printing) ───────────────────── */}
      <div className="print-hidden flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href={`/sales/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sale
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>
      </div>

      {/* ── Invoice card ─────────────────────────────────────────── */}
      <div className="invoice-card relative bg-white rounded-xl border border-gray-200 shadow-sm p-10">

        {/* PAID stamp overlay */}
        {isPaid && (
          <div className="print-hidden absolute top-8 right-8 rotate-[-12deg] border-[3px] border-green-400 text-green-400 px-4 py-1 rounded text-2xl font-black tracking-[0.2em] opacity-25 select-none pointer-events-none">
            PAID
          </div>
        )}

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex justify-between items-start gap-6 mb-8">
          {/* Business info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {business.businessName || "Your Business"}
            </h1>
            {(business.businessAddress || business.businessCity) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[business.businessAddress, business.businessCity].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-400 mt-1">
              {business.businessPhone && <span>Tel: {business.businessPhone}</span>}
              {business.businessEmail && <span>{business.businessEmail}</span>}
            </div>
          </div>

          {/* Invoice label + number */}
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-primary-600 tracking-tight leading-none">
              INVOICE
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1.5">{sale.invoiceNumber}</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {formatDate(sale.saleDate)}
            </div>
            <div className="mt-1.5">
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPaid
                  ? "bg-green-100 text-green-700"
                  : sale.paymentStatus === "OVERDUE"
                  ? "bg-red-100 text-red-700"
                  : sale.paymentStatus === "PARTIAL"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {sale.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mb-6" />

        {/* ── Bill To ─────────────────────────────────── */}
        <div className="mb-7">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Bill To
          </p>
          <p className="font-semibold text-gray-900">{sale.customer?.name}</p>
          {sale.customer?.businessName && (
            <p className="text-sm text-gray-500">{sale.customer.businessName}</p>
          )}
          {sale.customer?.phone && (
            <p className="text-sm text-gray-400">Tel: {sale.customer.phone}</p>
          )}
          {sale.customer?.address && (
            <p className="text-sm text-gray-400">{sale.customer.address}</p>
          )}
        </div>

        {/* ── Items table ─────────────────────────────── */}
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-6">#</th>
              <th className="text-left pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="text-right pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="text-right pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price</th>
              {hasDiscountCol && (
                <th className="text-right pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount</th>
              )}
              <th className="text-right pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item: any, idx: number) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-gray-900">{item.productName}</span>
                  {item.product?.sku && (
                    <span className="text-xs text-gray-400 ml-1.5">({item.product.sku})</span>
                  )}
                </td>
                <td className="py-2.5 text-right text-gray-700">
                  {item.quantity}{item.product?.unit ? ` ${item.product.unit}` : ""}
                </td>
                <td className="py-2.5 text-right text-gray-700">{fmt(item.unitPrice)}</td>
                {hasDiscountCol && (
                  <td className="py-2.5 text-right text-red-500 text-xs">
                    {Number(item.discount) > 0 ? `-${fmt(item.discount)}` : "—"}
                  </td>
                )}
                <td className="py-2.5 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ──────────────────────────────────── */}
        <div className="flex justify-end mb-7">
          <div className="w-60 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(sale.subtotal)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>−{fmt(sale.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-base text-gray-900">
              <span>Total</span>
              <span>{fmt(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid  <span className="text-xs font-normal text-gray-400">({METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod})</span></span>
              <span>{fmt(sale.paidAmount)}</span>
            </div>
            {Number(sale.dueAmount) > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Balance Due</span>
                <span>{fmt(sale.dueAmount)}</span>
              </div>
            )}
            {sale.nextRepayDate && Number(sale.dueAmount) > 0 && (
              <div className="text-xs text-gray-400 text-right">
                Due by: {formatDate(sale.nextRepayDate)}
              </div>
            )}
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────── */}
        {sale.saleNote && (
          <div className="mb-6 p-3.5 bg-gray-50 rounded-lg text-sm text-gray-600">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Note</span>
            {sale.saleNote}
          </div>
        )}

        {/* ── Footer: thank-you + QR ───────────────────── */}
        <div className="border-t border-gray-100 pt-6 flex items-end justify-between gap-6">
          <div className="text-sm text-gray-400 space-y-0.5">
            <p className="italic">Thank you for your business!</p>
            <p className="text-xs">{business.businessName}</p>
            {business.businessPhone && (
              <p className="text-xs">{business.businessPhone}</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <QRCodeSVG
              value={qrValue}
              size={80}
              level="M"
              bgColor="#ffffff"
              fgColor="#111827"
            />
            <p className="text-[10px] text-gray-400 text-center leading-tight">
              Scan to verify<br />invoice details
            </p>
          </div>
        </div>

        {/* Generated-by line */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-300">
            Generated by Nepal CRM · {sale.invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
