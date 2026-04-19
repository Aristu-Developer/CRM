"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function SupplierDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,    setData]    = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<any>({});
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setForm({ name: d.name, phone: d.phone ?? "", email: d.email ?? "", address: d.address ?? "", contactPerson: d.contactPerson ?? "", notes: d.notes ?? "" }); });
  }, [id]);

  const handleSave = async () => {
    if (!form.name?.trim()) return setError("Name is required");
    setSaving(true);
    setError("");
    const res = await fetch(`/api/suppliers/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to save");
      setSaving(false);
    } else {
      const updated = await res.json();
      setData((prev: any) => ({ ...prev, ...updated }));
      setEditing(false);
      setSaving(false);
    }
  };

  if (!data) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={data.name}
        description="Supplier details and purchase history"
        action={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} loading={saving}>Save</Button>
              </>
            ) : (
              <>
                <Link href="/suppliers"><Button variant="outline">← Suppliers</Button></Link>
                <Button onClick={() => setEditing(true)}>Edit</Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
          <p className="text-xl font-bold text-gray-900">{data.purchases?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Purchased</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(data.totalPurchased ?? 0)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${(data.totalDue ?? 0) > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <p className="text-xs text-gray-500 mb-1">Payable (Due)</p>
          <p className={`text-xl font-bold ${(data.totalDue ?? 0) > 0 ? "text-red-600" : "text-gray-400"}`}>
            {formatCurrency(data.totalDue ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier info */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
          {editing ? (
            <div className="space-y-3">
              {[
                { key: "name", label: "Name *", type: "text" },
                { key: "phone", label: "Phone", type: "tel" },
                { key: "email", label: "Email", type: "email" },
                { key: "contactPerson", label: "Contact Person", type: "text" },
                { key: "address", label: "Address", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              {[
                { label: "Phone",          value: data.phone },
                { label: "Email",          value: data.email },
                { label: "Contact Person", value: data.contactPerson },
                { label: "Address",        value: data.address },
                { label: "Notes",          value: data.notes },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Purchase history */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Purchase History</h3>
            <Link href={`/purchases/new?supplierId=${id}`}>
              <Button variant="outline" size="sm">+ New Purchase</Button>
            </Link>
          </div>

          {data.purchases?.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              No purchases yet.{" "}
              <Link href={`/purchases/new?supplierId=${id}`} className="text-primary-600 hover:underline">
                Record first purchase
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Ref #</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Due</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{p.referenceNo || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={p.dueAmount > 0 ? "text-red-600" : "text-gray-400"}>
                          {p.dueAmount > 0 ? formatCurrency(p.dueAmount) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.paymentStatus === "PAID"    ? "bg-green-100 text-green-700" :
                          p.paymentStatus === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/purchases/${p.id}`} className="text-primary-600 hover:underline text-xs">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
