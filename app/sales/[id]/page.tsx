"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { Modal }        from "@/components/ui/Modal";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader }   from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from "@/lib/utils";
import { useSession }   from "next-auth/react";

const PAYMENT_METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA",         label: "eSewa" },
  { value: "KHALTI",        label: "Khalti" },
  { value: "FONEPAY",       label: "Fonepay" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "OTHER",         label: "Other" },
];

export default function SaleDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const router            = useRouter();
  const { data: session } = useSession();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal
  const [paymentOpen,   setPaymentOpen]   = useState(false);
  const [paymentAmt,    setPaymentAmt]    = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef,    setPaymentRef]    = useState("");
  const [paymentRemark, setPaymentRemark] = useState("");
  const [paymentDate,   setPaymentDate]   = useState(new Date().toISOString().split("T")[0]);
  const [addingPmt,     setAddingPmt]     = useState(false);
  const [pmtError,      setPmtError]      = useState("");

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const reload = () =>
    fetch(`/api/sales/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });

  useEffect(() => { reload(); }, [id]);

  const handleAddPayment = async () => {
    if (!paymentAmt || parseFloat(paymentAmt) <= 0) {
      return setPmtError("Enter a valid amount");
    }
    if (parseFloat(paymentAmt) > data.dueAmount) {
      return setPmtError("Amount exceeds outstanding due");
    }
    setAddingPmt(true);
    setPmtError("");
    const res = await fetch("/api/payments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        saleId:        id,
        paymentDate,
        amount:        parseFloat(paymentAmt),
        paymentMethod,
        referenceNote: paymentRef,
        remarks:       paymentRemark,
      }),
    });
    if (!res.ok) {
      setPmtError((await res.json()).error ?? "Failed to record payment");
    } else {
      setPaymentOpen(false);
      setPaymentAmt("");
      setPaymentRef("");
      setPaymentRemark("");
      reload();
    }
    setAddingPmt(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    router.push("/sales");
  };

  if (loading) return <PageLoader />;
  if (!data?.id) return <div className="text-gray-500">Sale not found.</div>;

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="max-w-4xl space-y-6 mx-auto">
      {/* Header */}
      <PageHeader
        title={data.invoiceNumber}
        description={`${data.customer?.name} · ${formatDate(data.saleDate)}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Link href={`/sales/${id}/invoice`}>
              <Button variant="outline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </Button>
            </Link>
            {data.dueAmount > 0 && (
              <Button onClick={() => setPaymentOpen(true)}>
                + Record Payment
              </Button>
            )}
            {isAdmin && (
              <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
            )}
          </div>
        }
      />

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
        <StatusBadge status={data.paymentStatus} />
        <div className="flex gap-6 text-sm">
          <div><span className="text-gray-400">Total: </span><span className="font-bold">{formatCurrency(data.totalAmount)}</span></div>
          <div><span className="text-gray-400">Paid: </span><span className="font-bold text-green-600">{formatCurrency(data.paidAmount)}</span></div>
          <div><span className="text-gray-400">Due: </span><span className="font-bold text-red-600">{formatCurrency(data.dueAmount)}</span></div>
        </div>
        {data.nextRepayDate && (
          <div className="text-sm">
            <span className="text-gray-400">Repay by: </span>
            <span className="font-medium">{formatDate(data.nextRepayDate)}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Items Purchased</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase">Product</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase">Qty</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase">Unit Price</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase hidden sm:table-cell">Discount</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.items.map((item: any) => (
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-gray-400">{item.product?.sku}</p>
                </td>
                <td className="px-4 py-3 text-right">{item.quantity} {item.product?.unit}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                  {item.discount > 0 ? `-${formatCurrency(item.discount)}` : "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={3} className="px-5 py-3 text-sm text-gray-500">
                Payment: {getPaymentMethodLabel(data.paymentMethod)} · By {data.createdBy?.name}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-500 hidden sm:table-cell">
                {data.discountAmount > 0 && `-${formatCurrency(data.discountAmount)}`}
              </td>
              <td className="px-5 py-3 text-right font-bold">{formatCurrency(data.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {(data.saleNote || data.promiseNote) && (
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">Notes</h3>
          {data.saleNote && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              <span className="font-medium text-gray-500 text-xs uppercase block mb-1">Sale Note</span>
              {data.saleNote}
            </div>
          )}
          {data.promiseNote && (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-700">
              <span className="font-medium text-yellow-700 text-xs uppercase block mb-1">Promise / Collateral</span>
              {data.promiseNote}
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Payment History</h3>
          {data.dueAmount > 0 && (
            <Button size="sm" onClick={() => setPaymentOpen(true)}>+ Add Payment</Button>
          )}
        </div>
        {data.payments.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No payments recorded</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase hidden md:table-cell">Received By</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase hidden lg:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.payments.map((pmt: any) => (
                <tr key={pmt.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">{formatDate(pmt.paymentDate)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(pmt.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{getPaymentMethodLabel(pmt.paymentMethod)}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{pmt.receivedBy?.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{pmt.referenceNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment">
        <div className="space-y-4">
          {pmtError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{pmtError}</div>
          )}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            Outstanding due: <strong>{formatCurrency(data.dueAmount)}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Received (Rs.) *</label>
            <input
              type="number"
              min="0.01"
              max={data.dueAmount}
              step="0.01"
              value={paymentAmt}
              onChange={(e) => setPaymentAmt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
            >
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Note</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none"
              placeholder="Bank transaction ID, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <input
              type="text"
              value={paymentRemark}
              onChange={(e) => setPaymentRemark(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none"
              placeholder="Optional remarks..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} loading={addingPmt}>Save Payment</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Sale"
        message="This will permanently delete the sale and restore inventory stock. This cannot be undone."
      />
    </div>
  );
}
