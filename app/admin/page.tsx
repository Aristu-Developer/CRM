"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = "gray",
}: {
  label: string; value: string; sub?: string;
  color?: "gray" | "green" | "red" | "blue" | "amber" | "purple";
}) {
  const colorMap: Record<string, string> = {
    gray:   "text-gray-900",
    green:  "text-emerald-700",
    red:    "text-red-600",
    blue:   "text-blue-700",
    amber:  "text-amber-700",
    purple: "text-purple-700",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20">
            <div className="h-2.5 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-5 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-64">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-3">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <div className="py-16 text-center text-sm text-red-600">
        Failed to load platform stats.
      </div>
    );
  }

  const { businesses, users, platform, recentBusinesses, recentUsers } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Aggregated view across all businesses on this CRM instance"
      />

      {/* ── Account Stats ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Accounts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Businesses" value={String(businesses.total)}  color="blue" />
          <StatCard label="Active"           value={String(businesses.active)} color="green" />
          <StatCard label="Deactivated"      value={String(businesses.deleted)} color="red" />
          <StatCard label="Total Users"      value={String(users.total)}       color="gray" />
        </div>
      </div>

      {/* ── Platform Financials ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Platform Financials</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Sales"        value={fmt(platform.salesTotal)}
            sub={`${platform.salesCount} invoices`} color="blue" />
          <StatCard label="Payments Collected" value={fmt(platform.paymentsCollected)} color="green" />
          <StatCard label="Total Purchases"    value={fmt(platform.purchasesTotal)}    color="amber" />
          <StatCard label="Total Expenses"     value={fmt(platform.expensesTotal)}     color="amber" />
          <StatCard label="Open Customer Dues" value={fmt(platform.openDues)}
            sub={`${platform.openDuesCount} invoices`} color="red" />
          <StatCard label="Loan Interest Paid" value={fmt(platform.interestPaid)} color="gray" />
          <StatCard
            label="Est. Platform Profit"
            value={fmt(Math.abs(platform.estProfit))}
            sub={platform.estProfit < 0 ? "net loss" : "estimate only"}
            color={platform.estProfit >= 0 ? "green" : "red"}
          />
        </div>
      </div>

      {/* ── Recent Businesses ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recently Created Businesses</h3>
          <Link href="/admin/businesses" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-2.5">Business</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Type</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Admin</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Members</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Created</th>
              <th className="text-center text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentBusinesses.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3">
                  <Link href={`/admin/businesses/${b.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
                    {b.businessName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize text-xs">{b.businessType}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-700 text-xs">{b.admin?.name ?? "—"}</p>
                  <p className="text-gray-400 text-xs">{b.admin?.email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{b.membersCount}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">{fmtDate(b.createdAt)}</td>
                <td className="px-4 py-3 text-center">
                  {b.deletedAt
                    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">Deactivated</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Recent Users ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recently Registered Users</h3>
          <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-2.5">Name</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Email</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Business</th>
              <th className="text-center text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Role</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">{u.business}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                    u.role === "ADMIN"
                      ? "bg-purple-50 text-purple-700 border-purple-100"
                      : "bg-gray-50 text-gray-600 border-gray-100"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
