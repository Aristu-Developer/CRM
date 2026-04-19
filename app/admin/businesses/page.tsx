"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function Skeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-16" />
          <div className="flex-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<"all" | "active" | "deleted">("all");

  useEffect(() => {
    fetch("/api/admin/businesses")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setBusinesses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchFilter =
        filter === "all"
          ? true
          : filter === "active"
          ? !b.deletedAt
          : !!b.deletedAt;
      const matchSearch =
        !search ||
        b.businessName.toLowerCase().includes(search.toLowerCase()) ||
        b.admin?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.businessType?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [businesses, filter, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Businesses"
        description={`${businesses.length} total accounts on this platform`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name, email, type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
          {(["all", "active", "deleted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 font-medium transition capitalize ${
                filter === f ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">{filtered.length} shown</span>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">Failed to load businesses.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-2.5">Business</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Admin</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase px-3 py-2.5">Type</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-3 py-2.5">Users</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-3 py-2.5">Customers</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Sales (Rs.)</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Purchases</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Expenses</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Est. Profit</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-12 text-center text-sm text-gray-400">
                      No businesses match your filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b: any) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 max-w-[180px]">
                        <Link
                          href={`/admin/businesses/${b.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition block truncate"
                        >
                          {b.businessName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-gray-700 text-xs truncate">{b.admin?.name ?? "—"}</p>
                        <p className="text-gray-400 text-xs truncate">{b.admin?.email ?? ""}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-gray-500 capitalize">{b.businessType}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700">{b.usersCount}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{b.customersCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900">{fmt(b.salesTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmt(b.purchasesTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmt(b.expensesTotal)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${b.estProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {b.estProfit < 0 ? "(" : ""}{fmt(Math.abs(b.estProfit))}{b.estProfit < 0 ? ")" : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {b.deletedAt
                          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">Deactivated</span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
