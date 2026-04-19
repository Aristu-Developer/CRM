"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "gray",
}: {
  label: string; value: string; sub?: string;
  color?: "gray" | "green" | "red" | "blue" | "amber";
}) {
  const colorMap: Record<string, string> = {
    gray: "text-gray-900", green: "text-emerald-700",
    red: "text-red-600", blue: "text-blue-700", amber: "text-amber-700",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTable({
  title, headers, rows, emptyMsg,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
  emptyMsg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">{emptyMsg}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {headers.map((h, i) => (
                <th key={i} className={`text-xs font-medium text-gray-400 uppercase px-4 py-2.5 ${i === 0 ? "text-left" : "text-right"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 transition">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-3 text-sm ${ci === 0 ? "text-gray-900" : "text-right text-gray-700"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="bg-gray-100 rounded-xl h-24" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20" />)}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 h-48" />
    </div>
  );
}

const STATUS_BADGES: Record<string, string> = {
  PAID:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-100",
  UNPAID:  "bg-red-50 text-red-700 border-red-100",
  OVERDUE: "bg-red-100 text-red-800 border-red-200",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const id     = params.id;

  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [actioning, setActioning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/businesses/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    const isActive = !data.business.deletedAt;
    const action   = isActive ? "deactivate" : "reactivate";
    const label    = isActive ? "deactivate" : "reactivate";

    if (!confirm(`Are you sure you want to ${label} "${data.business.businessName}"?`)) return;

    setActioning(true);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) { load(); }
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error) return <p className="py-16 text-center text-sm text-red-600">Failed to load business details.</p>;
  if (!data)  return null;

  const { business, team, stats, recentSales, recentPurchases, recentExpenses } = data;
  const isActive = !business.deletedAt;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/businesses" className="text-xs text-gray-400 hover:text-gray-600 transition">
              ← Businesses
            </Link>
          </div>
          <PageHeader
            title={business.businessName}
            description={`${business.businessType} · Created ${fmtDate(business.createdAt)}`}
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}>
            {isActive ? "Active" : "Deactivated"}
          </span>
          <Button
            variant="outline"
            onClick={toggleStatus}
            loading={actioning}
            className={isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>

      {/* ── Business info strip ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Phone</p>
            <p className="text-gray-700">{business.businessPhone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-gray-700">{business.businessEmail || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">City</p>
            <p className="text-gray-700">{business.businessCity || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Currency</p>
            <p className="text-gray-700">{business.currency} ({business.currencySymbol})</p>
          </div>
        </div>
        {business.deletedAt && (
          <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-red-600">
            Deactivated on {fmtDate(business.deletedAt)}
          </p>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Financial Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Sales"   value={fmt(stats.salesTotal)}
            sub={`${stats.salesCount} invoices`} color="blue" />
          <StatCard label="Cash Collected" value={fmt(stats.salesPaid)} color="green" />
          <StatCard label="Open Dues"      value={fmt(stats.salesDue)}
            sub="unpaid invoices" color="red" />
          <StatCard label="Purchases"      value={fmt(stats.purchasesTotal)}
            sub={`${stats.purchasesCount} orders`} color="amber" />
          <StatCard label="Expenses"       value={fmt(stats.expensesTotal)}
            sub={`${stats.expensesCount} items`} color="amber" />
          <StatCard label="Loans"          value={fmt(stats.loansPrincipal)}
            sub={`${stats.loansCount} loans`} color="gray" />
          <StatCard label="Interest Paid"  value={fmt(stats.interestPaid)} color="gray" />
          <StatCard
            label="Est. Profit"
            value={`${stats.estProfit < 0 ? "(" : ""}${fmt(Math.abs(stats.estProfit))}${stats.estProfit < 0 ? ")" : ""}`}
            sub="estimate only"
            color={stats.estProfit >= 0 ? "green" : "red"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Customers" value={String(stats.customerCount)} color="blue" />
        <StatCard label="Products"  value={String(stats.productCount)}  color="gray" />
        <StatCard label="Team"      value={String(team.length)}         color="gray" />
        <StatCard label="Supplier Payables" value={fmt(stats.purchasesDue)} color="red" />
      </div>

      {/* ── Team ── */}
      <SectionTable
        title="Team Members"
        headers={["Name", "Email", "Role", "Joined"]}
        emptyMsg="No team members found."
        rows={team.map((m: any) => [
          <span key="n" className="font-medium">{m.name}</span>,
          <span key="e" className="text-xs">{m.email}</span>,
          <span key="r" className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
            m.role === "ADMIN"
              ? "bg-purple-50 text-purple-700 border-purple-100"
              : "bg-gray-50 text-gray-600 border-gray-100"
          }`}>{m.role}</span>,
          <span key="j" className="text-xs">{fmtDate(m.joinedAt)}</span>,
        ])}
      />

      {/* ── Recent Sales ── */}
      <SectionTable
        title="Recent Sales (last 5)"
        headers={["Invoice", "Customer", "Date", "Amount", "Status"]}
        emptyMsg="No sales recorded."
        rows={recentSales.map((s: any) => [
          <span key="i" className="font-mono text-xs">{s.invoiceNumber}</span>,
          <span key="c">{s.customer?.name ?? "—"}</span>,
          <span key="d" className="text-xs">{fmtDate(s.saleDate)}</span>,
          <span key="a">Rs. {s.totalAmount.toLocaleString("en-IN")}</span>,
          <span key="st" className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGES[s.paymentStatus] ?? STATUS_BADGES.UNPAID}`}>
            {s.paymentStatus}
          </span>,
        ])}
      />

      {/* ── Recent Purchases ── */}
      <SectionTable
        title="Recent Purchases (last 5)"
        headers={["Ref", "Supplier", "Date", "Amount", "Status"]}
        emptyMsg="No purchases recorded."
        rows={recentPurchases.map((p: any) => [
          <span key="r" className="font-mono text-xs">{p.referenceNo ?? "—"}</span>,
          <span key="s">{p.supplier?.name ?? "—"}</span>,
          <span key="d" className="text-xs">{fmtDate(p.purchaseDate)}</span>,
          <span key="a">Rs. {p.totalAmount.toLocaleString("en-IN")}</span>,
          <span key="st" className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGES[p.paymentStatus] ?? STATUS_BADGES.UNPAID}`}>
            {p.paymentStatus}
          </span>,
        ])}
      />

      {/* ── Recent Expenses ── */}
      <SectionTable
        title="Recent Expenses (last 5)"
        headers={["Title", "Category", "Date", "Amount"]}
        emptyMsg="No expenses recorded."
        rows={recentExpenses.map((e: any) => [
          <span key="t">{e.title}</span>,
          <span key="c" className="text-xs text-gray-500">{e.category}</span>,
          <span key="d" className="text-xs">{fmtDate(e.expenseDate)}</span>,
          <span key="a">Rs. {e.amount.toLocaleString("en-IN")}</span>,
        ])}
      />
    </div>
  );
}
