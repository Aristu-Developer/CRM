"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  RENT:        "Rent",
  UTILITIES:   "Utilities",
  SALARIES:    "Salaries / Wages",
  TRANSPORT:   "Transport & Logistics",
  MAINTENANCE: "Repairs & Maintenance",
  OTHER:       "Other Expenses",
};

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  SALE:      { label: "Sale",     cls: "bg-blue-50 text-blue-700 border border-blue-100" },
  PAYMENT:   { label: "Receipt",  cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  PURCHASE:  { label: "Purchase", cls: "bg-amber-50 text-amber-700 border border-amber-100" },
  EXPENSE:   { label: "Expense",  cls: "bg-red-50 text-red-700 border border-red-100" },
  REPAYMENT: { label: "Loan",     cls: "bg-purple-50 text-purple-700 border border-purple-100" },
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Paid", PARTIAL: "Partial", UNPAID: "Unpaid", OVERDUE: "Overdue",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType = keyof typeof TYPE_BADGES;

type JournalEntry = {
  id: string;
  idx: number;
  type: EntryType;
  main: string;
  sub: string;
  dr: number | null;
  cr: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtAmt(n: number) {
  return `Rs.\u00a0${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildEntries(tx: any): JournalEntry[] {
  const entries: JournalEntry[] = [];
  let idx = 1;

  for (const s of tx.sales ?? []) {
    entries.push({
      id:   `s-${s.id}`,
      idx:  idx++,
      type: "SALE",
      main: s.customer?.name ?? "Customer (Walk-in)",
      sub:  `Invoice #${s.invoiceNumber} · ${STATUS_LABEL[s.paymentStatus] ?? s.paymentStatus}`,
      dr:   s.totalAmount,
      cr:   null,
    });
  }
  for (const p of tx.payments ?? []) {
    entries.push({
      id:   `p-${p.id}`,
      idx:  idx++,
      type: "PAYMENT",
      main: "Cash / Bank A/c",
      sub:  `Against Inv #${p.sale?.invoiceNumber ?? "—"} · ${p.paymentMethod}`,
      dr:   p.amount,
      cr:   null,
    });
  }
  for (const p of tx.purchases ?? []) {
    entries.push({
      id:   `pu-${p.id}`,
      idx:  idx++,
      type: "PURCHASE",
      main: p.supplier?.name ?? "Supplier",
      sub:  p.referenceNo ? `Ref: ${p.referenceNo}` : "Purchase Invoice",
      dr:   null,
      cr:   p.totalAmount,
    });
  }
  for (const e of tx.expenses ?? []) {
    entries.push({
      id:   `e-${e.id}`,
      idx:  idx++,
      type: "EXPENSE",
      main: e.title,
      sub:  `${CATEGORY_LABELS[e.category] ?? e.category}${e.paymentMethod ? ` · ${e.paymentMethod}` : ""}`,
      dr:   null,
      cr:   e.amount,
    });
  }
  for (const r of tx.repayments ?? []) {
    entries.push({
      id:   `r-${r.id}`,
      idx:  idx++,
      type: "REPAYMENT",
      main: r.loan?.partyName ?? "Loan Account",
      sub:  `Loan Repayment · ${r.paymentMethod}`,
      dr:   null,
      cr:   r.amount,
    });
  }
  return entries;
}

// ─── UI Components ────────────────────────────────────────────────────────────

function LoadingSkeletons() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-4" />
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-28">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">Failed to load day book</p>
      <p className="text-xs text-gray-400 mb-4">Check your connection and try again.</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
      <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm font-medium text-gray-500">No transactions on this day</p>
      <p className="text-xs text-gray-400 mt-1">Pick a different date or start recording transactions.</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [date,    setDate]    = useState(todayStr());
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(false);
    try {
      const res  = await fetch(`/api/journal?date=${d}`);
      const json = await res.json();
      if (res.ok) { setData(json); } else { setData(null); setError(true); }
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const s  = data?.summary;
  const tx = data?.transactions;
  const isEmpty = s
    && s.salesCount === 0 && s.paymentsCount === 0
    && s.purchasesCount === 0 && s.expensesCount === 0
    && s.repaymentCount === 0;

  const entries = !isEmpty && tx ? buildEntries(tx) : [];
  const totalDr = entries.reduce((sum, e) => sum + (e.dr ?? 0), 0);
  const totalCr = entries.reduce((sum, e) => sum + (e.cr ?? 0), 0);

  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div>
      {/* Print-only report header */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-900">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Day Book</p>
        <h1 className="text-xl font-bold text-gray-900">{date ? formatDateLong(date) : date}</h1>
        <p className="text-xs text-gray-400 mt-1">
          Generated: {generatedOn} · Based on CRM-recorded transactions only
        </p>
      </div>

      <PageHeader
        title="Day Book"
        description="Daily transaction ledger — Debit & Credit journal entries"
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="print:hidden h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        }
      />

      {date && !loading && !error && (
        <p className="text-sm font-medium text-gray-600 -mt-2 mb-5 print:hidden">
          {formatDateLong(date)}
        </p>
      )}

      {loading ? (
        <LoadingSkeletons />
      ) : error ? (
        <ErrorState onRetry={() => load(date)} />
      ) : isEmpty ? (
        <EmptyDay />
      ) : (
        <div className="space-y-5">

          {/* ── Day Book Table ── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Day Book — Journal Entries</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {entries.length} entr{entries.length !== 1 ? "ies" : "y"} recorded this day
                </p>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                Dr. = Debit &nbsp;·&nbsp; Cr. = Credit
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-center text-xs font-medium text-gray-400 uppercase px-3 py-2.5 w-10">
                      Sr.
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">
                      Particulars
                    </th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase px-3 py-2.5">
                      Type
                    </th>
                    <th className="text-right text-xs font-medium text-blue-500 uppercase px-4 py-2.5">
                      Debit (Dr.)
                    </th>
                    <th className="text-right text-xs font-medium text-red-400 uppercase px-4 py-2.5">
                      Credit (Cr.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => {
                    const badge = TYPE_BADGES[entry.type];
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-3 py-3.5 text-center text-xs text-gray-400 font-medium align-top">
                          {entry.idx}
                        </td>
                        <td className="px-4 py-3.5 align-top max-w-xs">
                          <p className="font-medium text-gray-900 leading-tight">{entry.main}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-tight">{entry.sub}</p>
                        </td>
                        <td className="px-3 py-3.5 text-center align-top">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums align-top">
                          {entry.dr !== null
                            ? <span className="font-medium text-gray-900">{fmtAmt(entry.dr)}</span>
                            : <span className="text-gray-300 text-xs select-none">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums align-top">
                          {entry.cr !== null
                            ? <span className="font-medium text-gray-900">{fmtAmt(entry.cr)}</span>
                            : <span className="text-gray-300 text-xs select-none">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="px-3 py-3" />
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" colSpan={2}>
                      Day Totals
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                      {fmtAmt(totalDr)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                      {fmtAmt(totalCr)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Day Closing Summary ── */}
          {(() => {
            const estProfit = s.salesTotal - s.purchasesTotal - s.expensesTotal - s.interestPaid;
            return (
              <div className="bg-white rounded-xl border border-gray-200 p-5 print:break-inside-avoid">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Day Closing Summary</h3>
                    <p className="text-xs text-gray-400 mt-0.5">End-of-day snapshot · {date ? formatDateLong(date) : ""}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="print:hidden inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>

                {/* Row 1: Sales · Purchases · Expenses */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Sales</p>
                    <p className="text-base font-bold text-blue-900">{fmtAmt(s.salesTotal)}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{s.salesCount} invoice{s.salesCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">Purchases</p>
                    <p className="text-base font-bold text-amber-900">{fmtAmt(s.purchasesTotal)}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{s.purchasesCount} order{s.purchasesCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Expenses</p>
                    <p className="text-base font-bold text-red-900">{fmtAmt(s.expensesTotal)}</p>
                    <p className="text-xs text-red-600 mt-0.5">{s.expensesCount} item{s.expensesCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Row 2: Collected · New Dues · Loan Repayments */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Cash Collected</p>
                    <p className="text-base font-bold text-emerald-900">{fmtAmt(s.cashIn)}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{s.paymentsCount} payment{s.paymentsCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-orange-700 mb-1">New Dues Added</p>
                    <p className="text-base font-bold text-orange-900">{fmtAmt(s.salesDue)}</p>
                    <p className="text-xs text-orange-600 mt-0.5">outstanding balance</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-purple-700 mb-1">Loan Repayments</p>
                    <p className="text-base font-bold text-purple-900">{fmtAmt(s.repaymentTotal)}</p>
                    <p className="text-xs text-purple-600 mt-0.5">{s.repaymentCount} repayment{s.repaymentCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Bottom: Est. Profit + Net Cash */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Est. Profit</p>
                      <p className="text-xs text-gray-400">Sales − Purchases − Expenses − Interest</p>
                    </div>
                    <p className={`text-lg font-bold ml-3 ${estProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {estProfit < 0 ? "−" : ""}{fmtAmt(Math.abs(estProfit))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Net Cash Flow</p>
                      <p className="text-xs text-gray-400">Collected − Paid Out</p>
                    </div>
                    <p className={`text-lg font-bold ml-3 ${s.netCash >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {s.netCash < 0 ? "−" : ""}{fmtAmt(Math.abs(s.netCash))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Disclaimer ── */}
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 print:bg-transparent print:border-gray-300 print:text-gray-500">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400 print:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Debit entries include sales invoiced and payments received. Credit entries include purchases, expenses,
              and loan repayments. Cash In / Out reflect actual money movement only — Sales Invoiced may include
              uncollected amounts. Figures are based on CRM-recorded transactions only.
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
