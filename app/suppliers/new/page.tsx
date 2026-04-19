"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button }     from "@/components/ui/Button";

export default function NewSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", contactPerson: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Supplier name is required");
    setSaving(true);
    setError("");

    const res = await fetch("/api/suppliers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to save");
      setSaving(false);
    } else {
      const supplier = await res.json();
      router.push(`/suppliers/${supplier.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Supplier"
        description="Create a new vendor or supplier record"
        action={<Link href="/suppliers"><Button variant="outline">Cancel</Button></Link>}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Supplier Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Sharma Distributors"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="98XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="supplier@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Ram Sharma"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Thamel, Kathmandu"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any notes about this supplier..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saving}>Save Supplier</Button>
        </div>
      </form>
    </div>
  );
}
