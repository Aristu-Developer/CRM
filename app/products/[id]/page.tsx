"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { Modal }        from "@/components/ui/Modal";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PageLoader }   from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Select } from "@/components/ui/Input";

export default function ProductDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,   setData]      = useState<any>(null);
  const [loading, setLoading]  = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjType,    setAdjType]    = useState("MANUAL_IN");
  const [adjQty,     setAdjQty]     = useState("");
  const [adjReason,  setAdjReason]  = useState("");
  const [adjusting,  setAdjusting]  = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const reload = () =>
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });

  useEffect(() => { reload(); }, [id]);

  const handleAdjust = async () => {
    if (!adjQty) return;
    setAdjusting(true);
    await fetch(`/api/products/${id}/adjust`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ type: adjType, quantity: parseInt(adjQty), reason: adjReason }),
    });
    setAdjusting(false);
    setAdjustOpen(false);
    setAdjQty("");
    setAdjReason("");
    reload();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.push("/products");
  };

  if (loading) return <PageLoader />;
  if (!data?.id) return <div className="text-gray-500">Product not found.</div>;

  return (
    <div className="max-w-4xl space-y-6 mx-auto">
      <PageHeader
        title={data.name}
        description={`SKU: ${data.sku}${data.category ? " · " + data.category : ""}`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setAdjustOpen(true)} variant="outline">
              Adjust Stock
            </Button>
            <Link href={`/products/${id}/edit`}><Button variant="outline">Edit</Button></Link>
            <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      {data.isLowStock && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
          Low stock alert: Only {data.stock} {data.unit}(s) remaining (reorder at {data.reorderLevel})
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Current Stock",   value: `${data.stock} ${data.unit}` },
          { label: "Selling Price",   value: formatCurrency(data.sellingPrice) },
          { label: "Cost Price",      value: formatCurrency(data.costPrice) },
          { label: "Total Sold",      value: `${data.salesStats.totalSold} units` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-base font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Product Details</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          {[
            ["Name",          data.name],
            ["SKU",           data.sku],
            ["Category",      data.category ?? "—"],
            ["Unit",          data.unit],
            ["Reorder Level", data.reorderLevel],
            ["Status",        data.isActive ? "Active" : "Inactive"],
            ["Created",       formatDate(data.createdAt)],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-2">
              <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
              <span className="text-gray-800 font-medium">{val}</span>
            </div>
          ))}
        </div>
        {data.description && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{data.description}</p>
        )}
      </div>

      {/* Adjustment History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Stock Adjustment History</h3>
        </div>
        {data.adjustments.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No adjustments yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.adjustments.map((adj: any) => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Badge variant={adj.quantity > 0 ? "green" : "red"}>
                      {adj.type.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span className={adj.quantity > 0 ? "text-green-600" : "text-red-600"}>
                      {adj.quantity > 0 ? "+" : ""}{adj.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{adj.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{adj.user.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(adj.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust Stock">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjustment Type</label>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm"
            >
              <option value="MANUAL_IN">Stock In (Add)</option>
              <option value="MANUAL_OUT">Stock Out (Remove)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={adjQty}
              onChange={(e) => setAdjQty(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Stock received from supplier"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust} loading={adjusting}>Save Adjustment</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message="Products with sales history will be deactivated. Are you sure?"
      />
    </div>
  );
}
