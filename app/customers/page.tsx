"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { EmptyState }   from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate, getCustomerTypeLabel } from "@/lib/utils";

export default function CustomersPage() {
  const [data,       setData]       = useState<any>({ customers: [], total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [page,       setPage]       = useState(1);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, page: String(page), limit: "20" });
    const res    = await fetch(`/api/customers?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    fetchCustomers();
  };

  const { customers, total } = data;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total} total customers`}
        action={
          <Link href="/customers/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              Add Customer
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name, phone, business..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Add your first customer to get started."
            action={<Link href="/customers/new"><Button>Add Customer</Button></Link>}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Sales</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div>
                        <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {c.name}
                        </Link>
                        {c.businessName && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.businessName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">{c.phone}</td>
                    <td className="px-4 py-3.5 text-gray-600 hidden lg:table-cell">{c.city ?? "—"}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Badge variant={c.customerType === "BUSINESS" ? "blue" : "gray"}>
                        {getCustomerTypeLabel(c.customerType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium hidden md:table-cell">
                      {c._count.sales}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/customers/${c.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteId(c.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
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

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message="Are you sure? Customers with existing sales will be deactivated instead of deleted."
      />
    </div>
  );
}
