"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { StatusBadge }  from "@/components/ui/Badge";
import { EmptyState }   from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const STATUS_OPTIONS = ["", "PAID", "PARTIAL", "UNPAID", "OVERDUE"];

export default function SalesPage() {
  const { data: session } = useSession();
  const [data,     setData]     = useState<any>({ sales: [], total: 0 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [from,     setFrom]     = useState("");
  const [to,       setTo]       = useState("");
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, from, to, page: String(page), limit: "20" });
    const res    = await fetch(`/api/sales?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [search, status, from, to, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/sales/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    fetch_();
  };

  const { sales, total } = data;
  const totalPages = Math.ceil(total / 20);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="Sales"
        description={`${total} sale records`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/sales/quick">
              <Button variant="outline" leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }>
                Quick Sale
              </Button>
            </Link>
            <Link href="/sales/new">
              <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
                New Sale
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white" />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales found"
            description="Record your first sale to start tracking."
            action={<Link href="/sales/new"><Button>New Sale</Button></Link>}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Paid</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <Link href={`/sales/${s.id}`} className="font-mono text-primary-600 hover:underline font-medium">
                        {s.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/customers/${s.customer.id}`} className="text-gray-900 hover:text-primary-600">
                        {s.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{formatDate(s.saleDate)}</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(s.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-right text-green-600 hidden md:table-cell">{formatCurrency(s.paidAmount)}</td>
                    <td className="px-4 py-3.5 text-right text-red-600 hidden md:table-cell">{formatCurrency(s.dueAmount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={s.paymentStatus} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 justify-end">
                        <Link href={`/sales/${s.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteId(s.id)}>
                            Del
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Sale"
        message="This will permanently delete the sale and restore stock. This cannot be undone."
      />
    </div>
  );
}
