"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState }   from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [data,     setData]     = useState<any>({ products: [], total: 0 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, page: String(page), limit: "20" });
    if (lowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/products?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [search, page, lowStock]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    fetch_();
  };

  const { products, total } = data;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        description={`${total} products`}
        action={
          <Link href="/products/new">
            <Button leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
              Add Product
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-60 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Low stock only
        </label>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Add your first product to start tracking inventory."
            action={<Link href="/products/new"><Button>Add Product</Button></Link>}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <Link href={`/products/${p.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {p.name}
                          </Link>
                          <p className="text-xs text-gray-400">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs hidden sm:table-cell">{p.sku}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{p.category ?? "—"}</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold ${p.isLowStock ? "text-red-600" : "text-gray-900"}`}>
                        {p.stock}
                      </span>
                      {p.isLowStock && (
                        <span className="ml-1.5 text-xs text-red-500">Low</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={`/products/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                        <Link href={`/products/${p.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
                          Delete
                        </Button>
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
        title="Delete Product"
        message="Products with sales history will be deactivated instead of deleted."
      />
    </div>
  );
}
