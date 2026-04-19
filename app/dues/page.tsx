"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader }  from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState }  from "@/components/ui/EmptyState";
import { Button }      from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildWhatsAppLink, buildReminderMessage } from "@/lib/reminders";
import { isAfter }     from "date-fns";

export default function DuesPage() {
  const [sales,   setSales]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState<"all" | "overdue">("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: tab === "overdue" ? "OVERDUE" : "",
        search,
        limit:  "100",
      });
      const res         = await fetch(`/api/sales?${params}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("application/json")) {
        setSales([]); return;
      }
      const data     = await res.json();
      const allSales = data.sales ?? [];
      // Filter to only dues
      const dues = tab === "overdue"
        ? allSales
        : allSales.filter((s: any) => (s.dueAmount ?? 0) > 0);
      setSales(dues);
    } catch (err) {
      console.error("[dues] fetch error:", err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  // Compute totals
  const totalDue     = sales.reduce((s: number, x: any) => s + (x.dueAmount ?? 0), 0);
  const overdueCount = sales.filter((s: any) => {
    if (s.paymentStatus === "OVERDUE") return true;
    if (s.nextRepayDate && isAfter(new Date(), new Date(s.nextRepayDate))) return true;
    return false;
  }).length;

  return (
    <div>
      <PageHeader
        title="Outstanding Dues"
        description="All sales with unpaid balances"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Total Due</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Records</p>
          <p className="text-xl font-bold text-gray-900">{sales.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Overdue</p>
          <p className="text-xl font-bold text-orange-600">{overdueCount}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[
            { key: "all",     label: "All Dues" },
            { key: "overdue", label: "Overdue Only" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            title="No outstanding dues"
            description="All sales are fully paid!"
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Sale Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase text-red-600">Due</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Repay Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Remind</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((s: any) => {
                const isOverdue = s.paymentStatus === "OVERDUE" ||
                  (s.nextRepayDate && isAfter(new Date(), new Date(s.nextRepayDate)));
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${isOverdue ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-3.5">
                      <Link href={`/sales/${s.id}`} className="font-mono text-primary-600 hover:underline font-medium">
                        {s.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-gray-900">{s.customer?.name}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{formatDate(s.saleDate)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(s.totalAmount ?? 0)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600">{formatCurrency(s.dueAmount ?? 0)}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {s.nextRepayDate ? (
                        <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                          {formatDate(s.nextRepayDate)}
                          {isOverdue && " ⚠"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={s.paymentStatus} /></td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {s.customer?.phone ? (() => {
                        const msg  = buildReminderMessage({
                          customerName:  s.customer.name,
                          invoiceNumber: s.invoiceNumber,
                          dueAmount:     s.dueAmount ?? 0,
                          repayDate:     s.nextRepayDate ? formatDate(s.nextRepayDate) : null,
                          promiseNote:   s.promiseNote ?? null,
                        });
                        const link = buildWhatsAppLink(s.customer.phone, msg);
                        return link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send WhatsApp reminder to ${s.customer.name}`}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L0 24l6.335-1.658A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.963-1.346l-.356-.212-3.761.984.999-3.659-.232-.375A9.818 9.818 0 1112 21.818z"/>
                            </svg>
                            WA
                          </a>
                        ) : null;
                      })() : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/sales/${s.id}`}>
                        <Button size="sm" variant="outline">Pay</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Promise notes summary */}
      {sales.some((s: any) => s.promiseNote) && (
        <div className="card mt-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Customer Promise Notes</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {sales
              .filter((s: any) => s.promiseNote)
              .map((s: any) => (
                <div key={s.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {s.customer?.name} · {s.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{s.promiseNote}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                      {formatCurrency(s.dueAmount ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
