"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { EmptyState }     from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  RENT:        "Rent",
  UTILITIES:   "Utilities",
  SALARIES:    "Salaries",
  TRANSPORT:   "Transport",
  MAINTENANCE: "Maintenance",
  OTHER:       "Other",
};

const CATEGORY_STYLES: Record<string, string> = {
  RENT:        "bg-purple-100 text-purple-700",
  UTILITIES:   "bg-blue-100 text-blue-700",
  SALARIES:    "bg-indigo-100 text-indigo-700",
  TRANSPORT:   "bg-sky-100 text-sky-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  OTHER:       "bg-gray-100 text-gray-600",
};

export default function ExpensesPage() {
  const [expenses,  setExpenses]  = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState("");
  const [page,      setPage]      = useState(1);
  const limit = 20;

  const load = (cat = category, p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (cat) params.set("category", cat);
    fetch(`/api/expenses?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.expenses ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(category, page); }, [category, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={`${total} total expenses`}
        action={
          <Link href="/expenses/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              Add Expense
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          <option value="RENT">Rent</option>
          <option value="UTILITIES">Utilities</option>
          <option value="SALARIES">Salaries</option>
          <option value="TRANSPORT">Transport</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title={category ? `No ${CATEGORY_LABELS[category] ?? category.toLowerCase()} expenses` : "No expenses found"}
            description={
              category
                ? "Try selecting a different category or clear the filter."
                : "Start recording your operating costs to keep your finances organised."
            }
            action={
              category
                ? <button onClick={() => { setCategory(""); setPage(1); }} className="text-sm text-primary-600 font-medium hover:underline">Clear filter</button>
                : <Link href="/expenses/new"><Button>Add Expense</Button></Link>
            }
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Paid To</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {new Date(e.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900">{e.title}</p>
                      {e.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[e.category] ?? CATEGORY_STYLES.OTHER}`}>
                        {CATEGORY_LABELS[e.category] ?? e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{e.paidTo || "—"}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-gray-900">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

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
