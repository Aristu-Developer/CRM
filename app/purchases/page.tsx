"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { EmptyState }     from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PAID:    "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  UNPAID:  "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PAID:    "Paid",
  PARTIAL: "Partial",
  UNPAID:  "Unpaid",
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const limit = 20;

  const load = (p = 1) => {
    setLoading(true);
    fetch(`/api/purchases?page=${p}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setPurchases(d.purchases ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description={`${total} total purchases`}
        action={
          <Link href="/purchases/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              New Purchase
            </Button>
          </Link>
        }
      />

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : purchases.length === 0 ? (
          <EmptyState
            title="No purchases found"
            description="Record your first stock purchase to start tracking inventory and supplier payables."
            action={<Link href="/purchases/new"><Button>New Purchase</Button></Link>}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Ref #</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Paid</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                        {new Date(p.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.supplier ? (
                          <Link href={`/suppliers/${p.supplier.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {p.supplier.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs hidden md:table-cell">{p.referenceNo || "—"}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-900">{formatCurrency(p.totalAmount)}</td>
                      <td className="px-4 py-3.5 text-right text-gray-600 hidden sm:table-cell">{formatCurrency(p.paidAmount)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={p.dueAmount > 0 ? "font-medium text-red-600" : "text-gray-400"}>
                          {p.dueAmount > 0 ? formatCurrency(p.dueAmount) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[p.paymentStatus] ?? ""}`}>
                          {STATUS_LABELS[p.paymentStatus] ?? p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Link href={`/purchases/${p.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
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
