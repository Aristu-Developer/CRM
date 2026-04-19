"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

const CATEGORIES = [
  {
    value: "RENT",
    label: "Rent",
    description: "Office, shop, or property",
    color: "purple",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    value: "UTILITIES",
    label: "Utilities",
    description: "Electricity, water, internet",
    color: "blue",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: "SALARIES",
    label: "Salaries",
    description: "Staff wages and payroll",
    color: "indigo",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "TRANSPORT",
    label: "Transport",
    description: "Fuel, delivery, travel",
    color: "sky",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
    description: "Repairs and upkeep",
    color: "orange",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Miscellaneous expenses",
    color: "gray",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
];

const CATEGORY_ACTIVE_STYLES: Record<string, string> = {
  purple: "border-purple-400 bg-purple-50 text-purple-700",
  blue:   "border-blue-400 bg-blue-50 text-blue-700",
  indigo: "border-indigo-400 bg-indigo-50 text-indigo-700",
  sky:    "border-sky-400 bg-sky-50 text-sky-700",
  orange: "border-orange-400 bg-orange-50 text-orange-700",
  gray:   "border-gray-400 bg-gray-100 text-gray-700",
};

const PAYMENT_METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA",         label: "eSewa" },
  { value: "KHALTI",        label: "Khalti" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "OTHER",         label: "Other" },
];

export default function NewExpensePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title:         "",
    category:      "OTHER",
    amount:        "",
    expenseDate:   new Date().toISOString().split("T")[0],
    paidTo:        "",
    paymentMethod: "CASH",
    notes:         "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required");
    if (!form.amount || parseFloat(form.amount) <= 0) return setError("Valid amount is required");
    setSaving(true);
    setError("");

    const res = await fetch("/api/expenses", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });

    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to save");
      setSaving(false);
    } else {
      router.push("/expenses");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Expense"
        description="Record a business operating cost"
        action={<Link href="/expenses"><Button variant="outline">Cancel</Button></Link>}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isActive = form.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`relative flex items-start gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all ${
                    isActive
                      ? CATEGORY_ACTIVE_STYLES[cat.color]
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${isActive ? "" : "text-gray-400"}`}>{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{cat.label}</p>
                    <p className={`text-xs mt-0.5 leading-tight ${isActive ? "opacity-75" : "text-gray-400"}`}>
                      {cat.description}
                    </p>
                  </div>
                  {isActive && (
                    <span className="absolute top-2 right-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.2" />
                        <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expense Details */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Expense Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Monthly Rent – Thamel Office"
                autoFocus
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Paid To</label>
              <input
                type="text"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Landlord name, vendor, or organisation"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any additional context or reference..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saving}>Save Expense</Button>
        </div>
      </form>
    </div>
  );
}
