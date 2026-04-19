"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

export default function NewLoanPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    partyName:       "",
    type:            "TAKEN",
    principalAmount: "",
    interestRate:    "0",
    startDate:       new Date().toISOString().split("T")[0],
    dueDate:         "",
    notes:           "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partyName.trim()) return setError("Party name is required");
    if (!form.principalAmount || parseFloat(form.principalAmount) <= 0) return setError("Valid amount is required");
    setSaving(true);
    setError("");

    const res = await fetch("/api/loans", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...form,
        principalAmount: parseFloat(form.principalAmount),
        interestRate:    parseFloat(form.interestRate) || 0,
        dueDate:         form.dueDate || undefined,
      }),
    });

    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to save");
      setSaving(false);
    } else {
      const loan = await res.json();
      router.push(`/loans/${loan.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Loan"
        description="Record a loan taken or given"
        action={<Link href="/loans"><Button variant="outline">Cancel</Button></Link>}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Type */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Loan Type</h3>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {[
              { value: "TAKEN", label: "Loan Taken", sub: "We borrowed from someone" },
              { value: "GIVEN", label: "Loan Given", sub: "We lent to someone" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, type: opt.value })}
                className={`flex-1 px-4 py-3 text-left transition ${
                  form.type === opt.value
                    ? "bg-primary-50 text-primary-800 border-primary-200"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Loan Details */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Loan Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {form.type === "TAKEN" ? "Lender Name" : "Borrower Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.partyName}
                onChange={(e) => setForm({ ...form, partyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Person or organization name"
                autoFocus
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Principal Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.principalAmount}
                onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Interest Rate (% / year)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Leave 0 for interest-free</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Purpose of loan, collateral, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saving}>Save Loan</Button>
        </div>
      </form>
    </div>
  );
}
