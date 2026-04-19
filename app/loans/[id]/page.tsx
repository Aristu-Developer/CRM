"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA",         label: "eSewa" },
  { value: "KHALTI",        label: "Khalti" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "OTHER",         label: "Other" },
];

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loan,         setLoan]         = useState<any>(null);
  const [showRepModal, setShowRepModal] = useState(false);
  const [repForm,      setRepForm]      = useState({
    amount:        "",
    interestAmount:"0",
    repaymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    notes:         "",
    closeLoan:     false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [repError,   setRepError]   = useState("");

  const reload = () => {
    fetch(`/api/loans/${id}`)
      .then((r) => r.json())
      .then(setLoan);
  };

  useEffect(() => { reload(); }, [id]);

  const handleRepayment = async () => {
    const amount = parseFloat(repForm.amount);
    if (!amount || amount <= 0) return setRepError("Enter a valid amount");
    setSubmitting(true);
    setRepError("");

    const res = await fetch(`/api/loans/${id}/repayments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        interestAmount: parseFloat(repForm.interestAmount) || 0,
        repaymentDate:  repForm.repaymentDate,
        paymentMethod:  repForm.paymentMethod,
        notes:          repForm.notes || undefined,
        closeLoan:      repForm.closeLoan,
      }),
    });

    if (!res.ok) {
      setRepError((await res.json()).error ?? "Failed");
      setSubmitting(false);
    } else {
      setShowRepModal(false);
      setRepForm({ amount: "", interestAmount: "0", repaymentDate: new Date().toISOString().split("T")[0], paymentMethod: "CASH", notes: "", closeLoan: false });
      setSubmitting(false);
      reload();
    }
  };

  const handleCloseLoan = async () => {
    await fetch(`/api/loans/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "CLOSED" }),
    });
    reload();
  };

  if (!loan) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  const progressPct = loan.principalAmount > 0
    ? Math.min(100, (loan.totalRepaid / loan.principalAmount) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={loan.partyName}
        description={`${loan.type === "TAKEN" ? "Loan taken from" : "Loan given to"} ${loan.partyName}`}
        action={
          <div className="flex gap-2">
            <Link href="/loans"><Button variant="outline">← Loans</Button></Link>
            {loan.status === "ACTIVE" && (
              <Button onClick={() => { setShowRepModal(true); setRepError(""); }}>
                Record Repayment
              </Button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Principal</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.principalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Repaid</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(loan.totalRepaid)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${loan.outstanding > 0 ? (loan.type === "TAKEN" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200") : "bg-white border-gray-200"}`}>
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className={`text-xl font-bold ${loan.outstanding > 0 ? (loan.type === "TAKEN" ? "text-red-600" : "text-green-600") : "text-gray-400"}`}>
            {loan.outstanding > 0 ? formatCurrency(loan.outstanding) : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
          <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
            loan.status === "ACTIVE" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
          }`}>
            {loan.status}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {loan.principalAmount > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Repayment progress</span>
            <span>{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan info */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Loan Info</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Type</dt>
              <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.type === "TAKEN" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                  {loan.type === "TAKEN" ? "Loan Taken" : "Loan Given"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Start Date</dt>
              <dd className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</dd>
            </div>
            {loan.dueDate && (
              <div>
                <dt className="text-xs text-gray-500">Due Date</dt>
                <dd className="font-medium">{new Date(loan.dueDate).toLocaleDateString()}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500">Interest Rate</dt>
              <dd className="font-medium">{loan.interestRate > 0 ? `${loan.interestRate}% / year` : "Interest-free"}</dd>
            </div>
            {loan.totalInterestPaid > 0 && (
              <div>
                <dt className="text-xs text-gray-500">Interest Paid</dt>
                <dd className="font-medium">{formatCurrency(loan.totalInterestPaid)}</dd>
              </div>
            )}
            {loan.notes && (
              <div>
                <dt className="text-xs text-gray-500">Notes</dt>
                <dd className="text-gray-700">{loan.notes}</dd>
              </div>
            )}
            {loan.status === "ACTIVE" && (
              <div className="pt-2">
                <button
                  onClick={handleCloseLoan}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Mark as closed
                </button>
              </div>
            )}
          </dl>
        </div>

        {/* Repayment history */}
        <div className="lg:col-span-2">
          <h3 className="font-medium text-gray-900 mb-3">Repayment History</h3>
          {loan.repayments?.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No repayments yet.
              {loan.status === "ACTIVE" && (
                <> {" "}
                  <button onClick={() => setShowRepModal(true)} className="text-primary-600 hover:underline">
                    Record first repayment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Principal</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Interest</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loan.repayments.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(r.repaymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {r.interestAmount > 0 ? formatCurrency(r.interestAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.amount + r.interestAmount)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium">Total</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(loan.totalRepaid)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-500">{formatCurrency(loan.totalInterestPaid)}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(loan.totalRepaid + loan.totalInterestPaid)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Repayment Modal */}
      {showRepModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Record Repayment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Outstanding: <strong>{formatCurrency(loan.outstanding)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Principal Amount *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={repForm.amount}
                  onChange={(e) => setRepForm({ ...repForm, amount: e.target.value })}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              {loan.interestRate > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Interest Amount</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={repForm.interestAmount}
                    onChange={(e) => setRepForm({ ...repForm, interestAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={repForm.repaymentDate}
                  onChange={(e) => setRepForm({ ...repForm, repaymentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={repForm.paymentMethod}
                  onChange={(e) => setRepForm({ ...repForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={repForm.notes}
                  onChange={(e) => setRepForm({ ...repForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repForm.closeLoan}
                  onChange={(e) => setRepForm({ ...repForm, closeLoan: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">Mark loan as closed after this payment</span>
              </label>
            </div>
            {repError && <p className="text-sm text-red-600 mt-2">{repError}</p>}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowRepModal(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleRepayment} loading={submitting} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
