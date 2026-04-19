"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EXP_CATS: { key: string; label: string }[] = [
  { key: "RENT",        label: "Rent" },
  { key: "UTILITIES",   label: "Utilities" },
  { key: "SALARIES",    label: "Salaries / Wages" },
  { key: "TRANSPORT",   label: "Transport & Logistics" },
  { key: "MAINTENANCE", label: "Repairs & Maintenance" },
  { key: "OTHER",       label: "Other Expenses" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PnLRow =
  | { kind: "section";  label: string }
  | { kind: "line";     label: string; amount: number; note?: string; indent?: boolean }
  | { kind: "subtotal"; label: string; amount: number; note?: string }
  | { kind: "total";    label: string; amount: number; note?: string; variant?: "profit" | "loss" | "neutral" }
  | { kind: "spacer" };

// ─── Fallback shapes ──────────────────────────────────────────────────────────

const ZERO_MONTHLY = {
  year: 0, month: 1, period: "",
  salesCount: 0, salesTotal: 0,
  paymentsReceived: 0,
  purchasesCount: 0, purchasesTotal: 0, purchasesPaid: 0, purchasesDue: 0,
  expensesCount: 0, expensesTotal: 0,
  expensesByCategory: { RENT: 0, UTILITIES: 0, SALARIES: 0, TRANSPORT: 0, MAINTENANCE: 0, OTHER: 0 },
  repaymentCount: 0, repaymentTotal: 0, interestPaid: 0,
  grossProfit: 0, netProfit: 0,
  cashIn: 0, cashOut: 0, netCash: 0,
  outstandingCustomerDue: 0, outstandingCustomerDueCount: 0,
  outstandingSupplierPayable: 0, outstandingSupplierPayableCount: 0,
};

const ZERO_TOTALS = {
  salesTotal: 0, paymentsReceived: 0, purchasesTotal: 0, purchasesPaid: 0,
  expensesTotal: 0, repaymentTotal: 0, interestPaid: 0,
  grossProfit: 0, netProfit: 0,
  cashIn: 0, cashOut: 0, netCash: 0,
  outstandingCustomerDue: 0, outstandingCustomerDueCount: 0,
  outstandingSupplierPayable: 0, outstandingSupplierPayableCount: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPnL(n: number): string {
  if (n === 0 || Object.is(n, -0)) return "Rs. 0.00";
  const abs = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(Rs.\u00a0${abs})` : `Rs.\u00a0${abs}`;
}

function pctStr(n: number, base: number): string {
  if (base === 0) return "";
  const p = (n / base) * 100;
  return `${p.toFixed(1)}%`;
}

// ─── P&L Row Builder ──────────────────────────────────────────────────────────

function buildMonthlyRows(d: any): PnLRow[] {
  const purchasesPaid  = d.purchasesPaid  ?? 0;
  const repaymentTotal = d.repaymentTotal ?? 0;
  const cashIn         = d.cashIn  ?? d.paymentsReceived ?? 0;
  const netCash        = d.netCash ?? (cashIn - (d.cashOut ?? 0));

  const catRows: PnLRow[] = EXP_CATS
    .map(c => ({
      kind: "line" as const,
      label: c.label,
      amount: (d.expensesByCategory?.[c.key] ?? 0) as number,
      indent: true,
    }))
    .filter(r => r.amount > 0);

  const expRows: PnLRow[] = catRows.length > 0
    ? catRows
    : [{ kind: "line", label: "Operating Expenses", amount: d.expensesTotal, indent: true }];

  const financeRows: PnLRow[] = d.interestPaid > 0 ? [
    { kind: "section",  label: "Finance Costs" },
    { kind: "line",     label: "Loan Interest Paid", amount: d.interestPaid, indent: true },
    { kind: "subtotal", label: "Total Finance Costs", amount: d.interestPaid },
    { kind: "spacer" },
  ] : [];

  const repaymentRows: PnLRow[] = repaymentTotal > 0 ? [
    { kind: "line", label: "(Less) Loan Repayments Made", amount: -repaymentTotal, indent: true },
  ] : [];

  return [
    { kind: "section",  label: "Income" },
    { kind: "line",     label: "Sales Revenue", amount: d.salesTotal, indent: true },
    { kind: "subtotal", label: "Total Income",  amount: d.salesTotal },
    { kind: "spacer" },

    { kind: "section",  label: "Cost of Goods Sold (COGS)" },
    { kind: "line",     label: "Purchases / Materials", amount: d.purchasesTotal, indent: true },
    { kind: "subtotal", label: "Total COGS", amount: d.purchasesTotal },
    { kind: "spacer" },

    {
      kind: "total", label: "Gross Profit / (Loss)",
      amount: d.grossProfit,
      note:    d.salesTotal > 0 ? pctStr(d.grossProfit, d.salesTotal) : "",
      variant: d.grossProfit >= 0 ? "profit" : "loss",
    },
    { kind: "spacer" },

    { kind: "section", label: "Operating Expenses" },
    ...expRows,
    { kind: "subtotal", label: "Total Operating Expenses", amount: d.expensesTotal },
    { kind: "spacer" },

    ...financeRows,

    {
      kind: "total", label: "Est. Net Profit / (Loss)",
      amount: d.netProfit,
      note:    d.salesTotal > 0 ? pctStr(d.netProfit, d.salesTotal) : "",
      variant: d.netProfit >= 0 ? "profit" : "loss",
    },
    { kind: "spacer" },
    { kind: "spacer" },

    { kind: "section", label: "Cash Receipts & Payments" },
    { kind: "line", label: "Cash Received from Customers",  amount: cashIn,           indent: true },
    { kind: "line", label: "(Less) Cash Paid for Purchases", amount: -purchasesPaid,   indent: true },
    { kind: "line", label: "(Less) Cash Paid for Expenses",  amount: -d.expensesTotal, indent: true },
    ...repaymentRows,
    {
      kind: "subtotal", label: "Net Cash Movement",
      amount: netCash,
      note: netCash >= 0 ? "surplus" : "deficit",
    },
    { kind: "spacer" },

    { kind: "section", label: "Outstanding Balances (All-Time)" },
    {
      kind: "line",
      label: `Customer Dues Receivable  (${d.outstandingCustomerDueCount ?? 0} open)`,
      amount: d.outstandingCustomerDue ?? 0,
      indent: true,
    },
    {
      kind: "line",
      label: `Supplier Payables Outstanding  (${d.outstandingSupplierPayableCount ?? 0} open)`,
      amount: d.outstandingSupplierPayable ?? 0,
      indent: true,
    },
    { kind: "spacer" },
  ];
}

function buildYearlyRows(t: any): PnLRow[] {
  const purchasesPaid  = t.purchasesPaid  ?? 0;
  const repaymentTotal = t.repaymentTotal ?? 0;
  const cashIn         = t.cashIn ?? t.paymentsReceived ?? 0;
  const netCash        = t.netCash ?? 0;

  const financeRows: PnLRow[] = t.interestPaid > 0 ? [
    { kind: "section",  label: "Finance Costs" },
    { kind: "line",     label: "Loan Interest Paid", amount: t.interestPaid, indent: true },
    { kind: "subtotal", label: "Total Finance Costs", amount: t.interestPaid },
    { kind: "spacer" },
  ] : [];

  const repaymentRows: PnLRow[] = repaymentTotal > 0 ? [
    { kind: "line", label: "(Less) Loan Repayments Made", amount: -repaymentTotal, indent: true },
  ] : [];

  return [
    { kind: "section",  label: "Income" },
    { kind: "line",     label: "Sales Revenue", amount: t.salesTotal, indent: true },
    { kind: "subtotal", label: "Total Income",  amount: t.salesTotal },
    { kind: "spacer" },

    { kind: "section",  label: "Cost of Goods Sold (COGS)" },
    { kind: "line",     label: "Purchases / Materials", amount: t.purchasesTotal, indent: true },
    { kind: "subtotal", label: "Total COGS", amount: t.purchasesTotal },
    { kind: "spacer" },

    {
      kind: "total", label: "Gross Profit / (Loss)",
      amount: t.grossProfit,
      note:    t.salesTotal > 0 ? pctStr(t.grossProfit, t.salesTotal) : "",
      variant: t.grossProfit >= 0 ? "profit" : "loss",
    },
    { kind: "spacer" },

    { kind: "section",  label: "Operating Expenses" },
    { kind: "line",     label: "Operating Expenses", amount: t.expensesTotal, indent: true },
    { kind: "subtotal", label: "Total Operating Expenses", amount: t.expensesTotal },
    { kind: "spacer" },

    ...financeRows,

    {
      kind: "total", label: "Est. Net Profit / (Loss)",
      amount: t.netProfit,
      note:    t.salesTotal > 0 ? pctStr(t.netProfit, t.salesTotal) : "",
      variant: t.netProfit >= 0 ? "profit" : "loss",
    },
    { kind: "spacer" },
    { kind: "spacer" },

    { kind: "section", label: "Cash Receipts & Payments" },
    { kind: "line", label: "Cash Received from Customers",   amount: cashIn,          indent: true },
    { kind: "line", label: "(Less) Cash Paid for Purchases", amount: -purchasesPaid,  indent: true },
    { kind: "line", label: "(Less) Cash Paid for Expenses",  amount: -t.expensesTotal, indent: true },
    ...repaymentRows,
    {
      kind: "subtotal", label: "Net Cash Movement",
      amount: netCash,
      note: netCash >= 0 ? "surplus" : "deficit",
    },
    { kind: "spacer" },

    { kind: "section", label: "Outstanding Balances (All-Time)" },
    {
      kind: "line",
      label: `Customer Dues Receivable  (${t.outstandingCustomerDueCount ?? 0} open)`,
      amount: t.outstandingCustomerDue ?? 0,
      indent: true,
    },
    {
      kind: "line",
      label: `Supplier Payables Outstanding  (${t.outstandingSupplierPayableCount ?? 0} open)`,
      amount: t.outstandingSupplierPayable ?? 0,
      indent: true,
    },
    { kind: "spacer" },
  ];
}

// ─── P&L Table Renderer ───────────────────────────────────────────────────────

function PnLTable({ rows }: { rows: PnLRow[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row, i) => {
          if (row.kind === "spacer") {
            return <tr key={i}><td colSpan={3} className="h-2.5" /></tr>;
          }

          if (row.kind === "section") {
            return (
              <tr key={i} className="bg-gray-50">
                <td colSpan={3} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {row.label}
                </td>
              </tr>
            );
          }

          if (row.kind === "line") {
            return (
              <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                <td className={`py-2 pr-4 text-gray-600 ${row.indent ? "pl-9" : "pl-5"}`}>
                  {row.label}
                </td>
                <td className="px-5 py-2 text-right tabular-nums text-gray-900 whitespace-nowrap">
                  {fmtPnL(row.amount)}
                </td>
                <td className="pl-2 pr-5 py-2 text-right text-xs text-gray-400 whitespace-nowrap w-14">
                  {row.note ?? ""}
                </td>
              </tr>
            );
          }

          if (row.kind === "subtotal") {
            return (
              <tr key={i} className="border-t border-gray-200">
                <td className="px-5 py-2.5 font-medium text-gray-700">{row.label}</td>
                <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-gray-900 whitespace-nowrap">
                  {fmtPnL(row.amount)}
                </td>
                <td className="pl-2 pr-5 py-2.5 text-right text-xs text-gray-400 whitespace-nowrap w-14">
                  {row.note ?? ""}
                </td>
              </tr>
            );
          }

          if (row.kind === "total") {
            const color =
              row.variant === "profit" ? "text-emerald-700" :
              row.variant === "loss"   ? "text-red-600" :
              "text-gray-900";
            return (
              <tr key={i} className="border-t-2 border-gray-800 bg-gray-50/60">
                <td className="px-5 py-3 font-bold text-gray-900">{row.label}</td>
                <td className={`px-5 py-3 text-right font-bold tabular-nums whitespace-nowrap ${color}`}>
                  {fmtPnL(row.amount)}
                </td>
                <td className="pl-2 pr-5 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap w-14">
                  {row.note ?? ""}
                </td>
              </tr>
            );
          }

          return null;
        })}
      </tbody>
    </table>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function LoadingSkeletons() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 h-16">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-2.5 border-b border-gray-50">
            <div className={`h-3.5 bg-gray-200 rounded ${i % 3 === 0 ? "w-1/5" : "w-2/5"}`} />
            <div className="flex-1" />
            <div className="h-3.5 bg-gray-100 rounded w-20" />
          </div>
        ))}
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
      <p className="text-sm font-medium text-gray-700 mb-1">Failed to load statement</p>
      <p className="text-xs text-gray-400 mb-4">Check your connection and try again.</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 print:bg-transparent print:border-gray-300 print:text-gray-500">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400 print:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        These figures are based on transactions recorded in this CRM only. Profit estimates may differ from formal
        accounting due to unrecorded adjustments, opening stock, or timing differences. Use as a business overview,
        not a final financial statement. Parentheses (Rs. X) denote negative values.
      </span>
    </div>
  );
}

function EmailRow({ emailTo, setEmailTo, sending, sendEmail, emailStatus, emailMsg }: {
  emailTo: string; setEmailTo: (v: string) => void;
  sending: boolean; sendEmail: () => void;
  emailStatus: "idle" | "ok" | "err"; emailMsg: string;
}) {
  return (
    <div className="print:hidden bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="font-medium text-gray-900">Email this statement</h3>
      </div>
      <p className="text-xs text-gray-400 mb-3">A formatted statement will be delivered to the recipient's inbox.</p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="recipient@example.com"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendEmail()}
          className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button onClick={sendEmail} loading={sending} disabled={!emailTo.trim()}>
          Send Statement
        </Button>
      </div>
      {emailStatus === "ok" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {emailMsg}
        </div>
      )}
      {emailStatus === "err" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {emailMsg}
        </div>
      )}
    </div>
  );
}

// ─── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({ data, year, month, emailTo, setEmailTo, sending, sendEmail, emailStatus, emailMsg }: any) {
  const d = { ...ZERO_MONTHLY, ...(data ?? {}) };
  const isEmpty = d.salesTotal === 0 && d.purchasesTotal === 0 && d.expensesTotal === 0;
  const periodLabel = `${MONTH_NAMES[month] ?? ""} ${year}`;
  const generatedOn = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* Report header — visible on screen and print */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 print:bg-transparent print:rounded-none print:border-0 print:border-b-2 print:border-gray-900 print:px-0 print:pb-4 print:mb-2">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
              Monthly Profit &amp; Loss Statement
            </p>
            <h2 className="text-lg font-bold text-gray-900">{periodLabel}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Generated: {generatedOn}</p>
            <p className="text-xs text-gray-400 mt-0.5">Based on CRM-recorded data only</p>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 print:hidden">
          No transactions recorded for {periodLabel}. All figures show zero.
        </div>
      )}

      {/* P&L table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <PnLTable rows={buildMonthlyRows(d)} />
      </div>

      <Disclaimer />

      <EmailRow emailTo={emailTo} setEmailTo={setEmailTo} sending={sending}
        sendEmail={sendEmail} emailStatus={emailStatus} emailMsg={emailMsg} />
    </div>
  );
}

// ─── Yearly View ──────────────────────────────────────────────────────────────

function YearlyView({ data, year, emailTo, setEmailTo, sending, sendEmail, emailStatus, emailMsg }: any) {
  const totals = { ...ZERO_TOTALS, ...(data?.totals ?? {}) };
  const months: any[] = data?.months ?? [];
  const isEmpty = totals.salesTotal === 0 && totals.purchasesTotal === 0 && totals.expensesTotal === 0;
  const generatedOn = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* Report header */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 print:bg-transparent print:rounded-none print:border-0 print:border-b-2 print:border-gray-900 print:px-0 print:pb-4 print:mb-2">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
              Annual Business Summary
            </p>
            <h2 className="text-lg font-bold text-gray-900">Financial Year {year}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Generated: {generatedOn}</p>
            <p className="text-xs text-gray-400 mt-0.5">Based on CRM-recorded data only</p>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 print:hidden">
          No transactions recorded for {year}. All figures show zero.
        </div>
      )}

      {/* Annual P&L table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <PnLTable rows={buildYearlyRows(totals)} />
      </div>

      {/* Month-by-month breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Month-by-Month Breakdown</h3>
          <p className="text-xs text-gray-400 mt-0.5">All amounts in Rs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left  text-xs font-medium text-gray-400 uppercase px-5 py-2.5">Month</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Sales</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Purchases</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Gross Profit</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Expenses</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map((m: any) => {
                const gp = m.grossProfit ?? 0;
                const np = m.netProfit   ?? 0;
                return (
                  <tr key={m.month} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-900">{SHORT_MONTHS[m.month]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {(m.salesTotal ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {(m.purchasesTotal ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${gp >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {gp < 0 ? "(" : ""}{Math.abs(gp).toLocaleString("en-IN")}{gp < 0 ? ")" : ""}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {(m.expensesTotal ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold ${np >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {np < 0 ? "(" : ""}{Math.abs(np).toLocaleString("en-IN")}{np < 0 ? ")" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                  {totals.salesTotal.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                  {totals.purchasesTotal.toLocaleString("en-IN")}
                </td>
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${totals.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {totals.grossProfit < 0 ? "(" : ""}
                  {Math.abs(totals.grossProfit).toLocaleString("en-IN")}
                  {totals.grossProfit < 0 ? ")" : ""}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                  {totals.expensesTotal.toLocaleString("en-IN")}
                </td>
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${totals.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {totals.netProfit < 0 ? "(" : ""}
                  {Math.abs(totals.netProfit).toLocaleString("en-IN")}
                  {totals.netProfit < 0 ? ")" : ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Disclaimer />

      <EmailRow emailTo={emailTo} setEmailTo={setEmailTo} sending={sending}
        sendEmail={sendEmail} emailStatus={emailStatus} emailMsg={emailMsg} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatementsPage() {
  const now = new Date();
  const [tab,         setTab]         = useState<"monthly" | "yearly">("monthly");
  const [year,        setYear]        = useState(now.getFullYear());
  const [month,       setMonth]       = useState(now.getMonth() + 1);
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [emailTo,     setEmailTo]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok" | "err">("idle");
  const [emailMsg,    setEmailMsg]    = useState("");
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setData(null);
    setError(false);
    try {
      const url = tab === "monthly"
        ? `/api/statements/monthly?year=${year}&month=${month}`
        : `/api/statements/yearly?year=${year}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (res.ok) { setData(json); } else { setError(true); }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, year, month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (emailStatus === "ok") {
      dismissTimer.current = setTimeout(() => setEmailStatus("idle"), 5000);
    }
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [emailStatus]);

  const sendEmail = async () => {
    if (!emailTo.trim()) return;
    setSending(true);
    setEmailStatus("idle");
    setEmailMsg("");
    try {
      const period = tab === "monthly"
        ? `${year}-${String(month).padStart(2, "0")}`
        : String(year);
      const type = tab === "monthly" ? "MONTHLY_STATEMENT" : "YEARLY_SUMMARY";
      const res  = await fetch("/api/statements/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, period, to: emailTo.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmailStatus("ok");
        setEmailMsg(`Statement sent to ${emailTo.trim()}`);
      } else {
        setEmailStatus("err");
        const isSmtp = (json.error ?? "").toLowerCase().includes("smtp");
        setEmailMsg(isSmtp
          ? "Email sending is not configured on this server. Contact your administrator."
          : (json.error ?? "Failed to send — please try again."));
      }
    } catch {
      setEmailStatus("err");
      setEmailMsg("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const yearOptions  = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const periodLabel  = tab === "monthly" ? `${MONTH_NAMES[month]} ${year}` : `Year ${year}`;

  return (
    <div>
      <PageHeader
        title="Statements"
        description="Accounting-style P&L, cash flow, and annual summary reports"
        action={
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        }
      />

      {/* Controls */}
      <div className="print:hidden mb-6 space-y-3">
        {/* Row 1: tab toggle (always full row on mobile, inline on sm+) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => { setTab("monthly"); setData(null); setLoading(true); setError(false); }}
              className={`px-4 py-2 text-sm font-medium transition ${tab === "monthly" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => { setTab("yearly"); setData(null); setLoading(true); setError(false); }}
              className={`px-4 py-2 text-sm font-medium transition ${tab === "yearly" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Yearly
            </button>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="flex-shrink-0 h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {tab === "monthly" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex-shrink-0 h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MONTH_NAMES.slice(1).map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          )}

          <span className="text-sm text-gray-500">{periodLabel}</span>
        </div>
      </div>

      {loading ? (
        <LoadingSkeletons />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : tab === "monthly" ? (
        <MonthlyView
          data={data} year={year} month={month}
          emailTo={emailTo} setEmailTo={setEmailTo}
          sending={sending} sendEmail={sendEmail}
          emailStatus={emailStatus} emailMsg={emailMsg}
        />
      ) : (
        <YearlyView
          data={data} year={year}
          emailTo={emailTo} setEmailTo={setEmailTo}
          sending={sending} sendEmail={sendEmail}
          emailStatus={emailStatus} emailMsg={emailMsg}
        />
      )}
    </div>
  );
}
