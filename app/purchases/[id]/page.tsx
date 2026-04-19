"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PAID:    "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  UNPAID:  "bg-red-100 text-red-700",
};

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [purchase,     setPurchase]     = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount,    setPayAmount]    = useState("");
  const [paying,       setPaying]       = useState(false);
  const [payError,     setPayError]     = useState("");

  useEffect(() => {
    fetch(`/api/purchases/${id}`)
      .then((r) => r.json())
      .then(setPurchase);
  }, [id]);

  const handleRecordPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return setPayError("Enter a valid amount");
    if (amount > purchase.dueAmount) return setPayError("Amount exceeds remaining due");
    setPaying(true);
    setPayError("");

    const newPaid = purchase.paidAmount + amount;
    const res = await fetch(`/api/purchases/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ paidAmount: newPaid }),
    });

    if (!res.ok) {
      setPayError((await res.json()).error ?? "Failed");
      setPaying(false);
    } else {
      const updated = await res.json();
      setPurchase((prev: any) => ({ ...prev, ...updated }));
      setShowPayModal(false);
      setPayAmount("");
      setPaying(false);
    }
  };

  if (!purchase) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Purchase Details"
        description={`${new Date(purchase.purchaseDate).toLocaleDateString()} ${purchase.referenceNo ? `· Ref: ${purchase.referenceNo}` : ""}`}
        action={
          <div className="flex gap-2">
            <Link href="/purchases"><Button variant="outline">← Purchases</Button></Link>
            {purchase.dueAmount > 0 && (
              <Button onClick={() => { setShowPayModal(true); setPayAmount(""); setPayError(""); }}>
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(purchase.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(purchase.paidAmount)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${purchase.dueAmount > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}>
          <p className="text-xs text-gray-500 mb-1">Due</p>
          <p className={`text-xl font-bold ${purchase.dueAmount > 0 ? "text-orange-600" : "text-gray-400"}`}>
            {formatCurrency(purchase.dueAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
          <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${STATUS_STYLES[purchase.paymentStatus] ?? ""}`}>
            {purchase.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase info */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Details</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Supplier</dt>
              <dd className="font-medium text-gray-900">
                {purchase.supplier ? (
                  <Link href={`/suppliers/${purchase.supplier.id}`} className="text-primary-700 hover:underline">
                    {purchase.supplier.name}
                  </Link>
                ) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Date</dt>
              <dd className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Reference No.</dt>
              <dd className="font-medium font-mono text-sm">{purchase.referenceNo || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Payment Method</dt>
              <dd className="font-medium">{purchase.paymentMethod}</dd>
            </div>
            {purchase.notes && (
              <div>
                <dt className="text-xs text-gray-500">Notes</dt>
                <dd className="text-gray-700">{purchase.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Items */}
        <div className="lg:col-span-2">
          <h3 className="font-medium text-gray-900 mb-3">Items</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Item</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Qty</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Unit Cost</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchase.items?.map((item: any) => {
                  const pkgLines: Array<{ type: string; label: string; qty: number }> =
                    item.packageLines ? JSON.parse(item.packageLines) : [];
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {/* Package breakdown */}
                        {pkgLines.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {pkgLines.map((l, li) => (
                              <p key={li} className="text-xs text-gray-500">
                                {l.label || `${l.type} ${li + 1}`}: {l.qty} {item.purchaseUnit}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.product && (
                          <p className="text-xs text-blue-500 mt-1">
                            <Link href={`/products/${item.product.id}`} className="hover:underline">
                              linked · stock: {item.product.stock} {item.product.unit}
                            </Link>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        <span className="font-medium">
                          {item.quantity}{item.purchaseUnit ? ` ${item.purchaseUnit}` : ""}
                        </span>
                        {item.convertedQty != null &&
                          item.purchaseUnit &&
                          item.purchaseUnit !== item.product?.unit && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            → {item.convertedQty} {item.product?.unit ?? ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                {purchase.discountAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500">Discount</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600">−{formatCurrency(purchase.discountAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-right font-semibold">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-lg">{formatCurrency(purchase.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Outstanding: <strong>{formatCurrency(purchase.dueAmount)}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid</label>
              <input
                type="number"
                min="0"
                max={purchase.dueAmount}
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`Max: ${formatCurrency(purchase.dueAmount)}`}
              />
            </div>
            {payError && <p className="text-sm text-red-600 mb-3">{payError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPayModal(false)} disabled={paying}>Cancel</Button>
              <Button onClick={handleRecordPayment} loading={paying} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
