"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

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
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-1/5" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-16" />
          <div className="flex-1" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.primaryBusiness?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description={`${users.length} registered users across all businesses`}
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">{filtered.length} shown</span>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">Failed to load users.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-2.5">Name</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Email</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Business</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase px-3 py-2.5">Role</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase px-3 py-2.5">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase px-4 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.primaryBusinessId ? (
                        <Link
                          href={`/admin/businesses/${u.primaryBusinessId}`}
                          className="text-gray-700 hover:text-blue-600 text-xs transition"
                        >
                          {u.primaryBusiness}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">{u.primaryBusiness}</span>
                      )}
                      {u.businesses.length > 1 && (
                        <span className="ml-1.5 text-xs text-gray-400">+{u.businesses.length - 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        u.primaryRole === "ADMIN"
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}>
                        {u.primaryRole}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {u.isActive
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
