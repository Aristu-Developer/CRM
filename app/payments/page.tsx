"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { EmptyState }   from "@/components/ui/EmptyState";
import { Button }       from "@/components/ui/Button";
import { formatCurrency, formatDate, getPaymentMethodLabel } from "@/lib/utils";

export default function PaymentsPage() {
  const [data,    setData]    = useState<any>({ payments: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [page,    setPage]    = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, from, to, page: String(page), limit: "20" });
    const res    = await fetch(`/api/payments?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [search, from, to, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const { payments, total } = data;
  const totalPages = Math.ceil(total / 20);

  // Sum total for current filtered result
  const totalAmount = payments.reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`${total} payment records`}
      />

      {/* Summary card */}
      {payments.length > 0 && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-800">
            Total collected (this view): <strong>{formatCurrency(totalAmount)}</strong>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
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
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Payments are recorded when a sale is created or updated."
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Received By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <Link href={`/sales/${p.saleId}`} className="font-mono text-primary-600 hover:underline">
                        {p.sale?.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-gray-800">{p.sale?.customer?.name}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{getPaymentMethodLabel(p.paymentMethod)}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{p.receivedBy?.name}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">{p.referenceNote ?? "—"}</td>
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
    </div>
  );
}
