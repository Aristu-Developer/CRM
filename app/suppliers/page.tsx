"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { EmptyState }     from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (q = "") => {
    setLoading(true);
    fetch(`/api/suppliers?q=${encodeURIComponent(q)}&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        setSuppliers(d.suppliers ?? []);
        setTotal(d.suppliers?.length ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), 300);
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description={`${total} total suppliers`}
        action={
          <Link href="/suppliers/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              Add Supplier
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            title={search ? "No suppliers match your search" : "No suppliers found"}
            description={search ? "Try a different name or clear the search." : "Add your first supplier to get started."}
            action={
              search
                ? <button onClick={() => { setSearch(""); load(""); }} className="text-sm text-primary-600 font-medium hover:underline">Clear search</button>
                : <Link href="/suppliers/new"><Button>Add Supplier</Button></Link>
            }
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Contact Person</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Purchases</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payable</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div>
                        <Link href={`/suppliers/${s.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {s.name}
                        </Link>
                        {s.email && <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{s.phone || "—"}</td>
                    <td className="px-4 py-3.5 text-gray-600 hidden lg:table-cell">{s.contactPerson || "—"}</td>
                    <td className="px-4 py-3.5 text-right text-gray-600 hidden sm:table-cell">{s.totalPurchases}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={s.totalDue > 0 ? "font-medium text-red-600" : "text-gray-400"}>
                        {s.totalDue > 0 ? formatCurrency(s.totalDue) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={`/suppliers/${s.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/suppliers/${s.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
