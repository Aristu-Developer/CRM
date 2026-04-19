"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader }    from "@/components/ui/PageHeader";
import { Button }        from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";

interface LineItem {
  productId:   string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  discount:    number;
  total:       number;
  stock:       number;
  unit:        string;
}

const PAYMENT_METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA",         label: "eSewa" },
  { value: "KHALTI",        label: "Khalti" },
  { value: "FONEPAY",       label: "Fonepay" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "OTHER",         label: "Other" },
];

function NewSaleForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preCustomer  = searchParams.get("customerId") ?? "";

  // ── Sale mode ─────────────────────────────────────────────────────────────
  const [isWalkIn,     setIsWalkIn]     = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [customers,    setCustomers]    = useState<any[]>([]);
  const [products,     setProducts]     = useState<any[]>([]);
  const [customerId,   setCustomerId]   = useState(preCustomer);
  const [saleDate,     setSaleDate]     = useState(new Date().toISOString().split("T")[0]);
  const [items,        setItems]        = useState<LineItem[]>([]);
  const [discount,     setDiscount]     = useState(0);
  const [paidAmount,   setPaidAmount]   = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saleNote,     setSaleNote]     = useState("");
  const [promiseNote,  setPromiseNote]  = useState("");
  const [nextRepayDate,setNextRepayDate]= useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    fetch("/api/customers?limit=200")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
    fetch("/api/products?limit=200&status=active")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  const subtotal    = items.reduce((s, i) => s + i.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const dueAmount   = Math.max(0, totalAmount - paidAmount);

  // Walk-in mode: keep paid = total automatically
  useEffect(() => {
    if (isWalkIn) setPaidAmount(totalAmount);
  }, [isWalkIn, totalAmount]);

  const switchMode = (walkIn: boolean) => {
    setIsWalkIn(walkIn);
    if (walkIn) {
      setCustomerId("");
      setPaidAmount(totalAmount);
    }
  };

  const addItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = items.findIndex((i) => i.productId === productId);
    if (existing >= 0) {
      updateItem(existing, "quantity", items[existing].quantity + 1);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId:   product.id,
        productName: product.name,
        quantity:    1,
        unitPrice:   product.sellingPrice,
        discount:    0,
        total:       product.sellingPrice,
        stock:       product.stock,
        unit:        product.unit,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item    = { ...updated[index], [field]: value };
      item.total    = Math.max(0, (item.quantity * item.unitPrice) - item.discount);
      updated[index] = item;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalkIn && !customerId) return setError("Please select a customer");
    if (items.length === 0)       return setError("Add at least one item");
    if (paidAmount > totalAmount) return setError("Paid amount cannot exceed total");

    setSubmitting(true);
    setError("");

    const body: any = {
      saleDate,
      items: items.map(({ productId, productName, quantity, unitPrice, discount, total }) =>
              ({ productId, productName, quantity, unitPrice, discount, total })),
      discountAmount: discount,
      paidAmount,
      paymentMethod,
      saleNote:      saleNote || undefined,
      promiseNote:   promiseNote || undefined,
      nextRepayDate: nextRepayDate || undefined,
    };
    if (!isWalkIn) body.customerId = customerId;

    const res = await fetch("/api/sales", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to create sale");
      setSubmitting(false);
    } else {
      const sale = await res.json();
      router.push(`/sales/${sale.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Sale"
        description="Record a new sale transaction"
        action={<Link href="/sales"><Button variant="outline">Cancel</Button></Link>}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Sale Mode Toggle ─────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-3">Sale Type</h3>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                !isWalkIn
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Customer Sale
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                isWalkIn
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Walk-in Sale
            </button>
          </div>
          {isWalkIn && (
            <p className="mt-2 text-xs text-gray-500">
              No customer record needed. Sale will be linked to a Walk-in Customer automatically.
              Payment defaults to fully paid.
            </p>
          )}
        </div>

        {/* ── Customer & Date ──────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Sale Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer — hidden in walk-in mode */}
            {!isWalkIn ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ""}</option>
                  ))}
                </select>
                <Link href="/customers/new" className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                  + Add new customer
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Walk-in Customer
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Date *</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        </div>

        {/* ── Line Items ───────────────────────────────────────────────────── */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Items</h3>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
                onChange={(e) => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }}
                defaultValue=""
              >
                <option value="">+ Add product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.name} (Stock: {p.stock} {p.unit}) — Rs.{p.sellingPrice}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              Select a product above to add items
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-xs text-gray-500 font-medium">Product</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium w-24">Qty</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium w-28">Unit Price</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium w-24">Discount</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <tr key={item.productId}>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-400">Stock: {item.stock} {item.unit}</p>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateItem(i, "discount", parseFloat(e.target.value) || 0)}
                          className="w-full text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Totals & Payment ─────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Discount</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none"
                />
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment details */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount Paid (Rs.)
                  {isWalkIn && (
                    <span className="ml-2 text-xs font-normal text-gray-400">auto-filled for walk-in</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining Due</span>
                <span className={`font-bold ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(dueAmount)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Note</label>
              <textarea
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any notes about this sale..."
              />
            </div>
            {dueAmount > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Promise / Collateral Note
                    <span className="text-gray-400 font-normal ml-1">(for unpaid balance)</span>
                  </label>
                  <textarea
                    value={promiseNote}
                    onChange={(e) => setPromiseNote(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="What the customer promised, any collateral they left, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Repayment Date</label>
                  <input
                    type="date"
                    value={nextRepayDate}
                    onChange={(e) => setNextRepayDate(e.target.value)}
                    className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/sales"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" loading={submitting} disabled={items.length === 0}>
            Save Sale
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <NewSaleForm />
    </Suspense>
  );
}
