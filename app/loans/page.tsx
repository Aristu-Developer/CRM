"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { EmptyState }     from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

export default function LoansPage() {
  const [loans,      setLoans]      = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  const load = (type = typeFilter) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    fetch(`/api/loans?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLoans(d.loans ?? []);
        setTotal(d.loans?.length ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [typeFilter]);

  const activeTaken = loans.filter((l) => l.type === "TAKEN" && l.status === "ACTIVE");
  const activeGiven = loans.filter((l) => l.type === "GIVEN" && l.status === "ACTIVE");
  const totalOwed   = activeTaken.reduce((s, l) => s + l.outstanding, 0);
  const totalLent   = activeGiven.reduce((s, l) => s + l.outstanding, 0);

  return (
    <div>
      <PageHeader
        title="Loans"
        description={`${total} total loans`}
        action={
          <Link href="/loans/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              Add Loan
            </Button>
          </Link>
        }
      />

      {/* Summary + Filter row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          <option value="TAKEN">Loans Taken</option>
          <option value="GIVEN">Loans Given</option>
        </select>
        {(totalOwed > 0 || totalLent > 0) && (
          <div className="flex gap-3 ml-auto">
            {totalOwed > 0 && (
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                We owe: {formatCurrency(totalOwed)}
              </span>
            )}
            {totalLent > 0 && (
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                Owed to us: {formatCurrency(totalLent)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : loans.length === 0 ? (
          <EmptyState
            title="No loans found"
            description="Start tracking money borrowed or lent to keep your finances organised."
            action={<Link href="/loans/new"><Button>Add Loan</Button></Link>}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Party</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Principal</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Repaid</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loans.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <Link href={`/loans/${l.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {l.partyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                      l.type === "TAKEN" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {l.type === "TAKEN" ? "Taken" : "Given"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600 hidden sm:table-cell">{formatCurrency(l.principalAmount)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-600 hidden md:table-cell">{formatCurrency(l.totalRepaid)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={
                      l.outstanding > 0
                        ? (l.type === "TAKEN" ? "font-medium text-red-600" : "font-medium text-green-600")
                        : "text-gray-400"
                    }>
                      {l.outstanding > 0 ? formatCurrency(l.outstanding) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                    {l.dueDate ? new Date(l.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                      l.status === "ACTIVE" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {l.status === "ACTIVE" ? "Active" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link href={`/loans/${l.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
