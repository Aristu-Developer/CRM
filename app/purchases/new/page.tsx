"use client";

import { Fragment, Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader }     from "@/components/ui/PageHeader";
import { Button }         from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

// One row in the detailed package breakdown (stored as JSON on PurchaseItem.packageLines)
interface PackageLine {
  type:  string;   // e.g. "roll", "box"
  label: string;   // e.g. "Roll 1", "Large batch" — free text, optional
  qty:   number;   // quantity in item's purchaseUnit
}

interface PurchaseItem {
  productId:        string | null;
  productName:      string;
  unit:             string;            // product's base stock unit
  quantity:         number;            // total in purchaseUnit; auto-summed when usePackages = true
  unitPrice:        number;
  total:            number;
  // Conversion
  purchaseUnit:     string;            // "" = same as base, no conversion
  conversionFactor: number;            // 0 = no conversion
  convertedQty:     number | null;     // base-unit qty for stock; null = no conversion
  // Package breakdown
  packageType:      string;            // default type for new lines (e.g. "roll")
  usePackages:      boolean;           // false = simple total entry, true = line-by-line
  packageLines:     PackageLine[];     // only meaningful when usePackages = true
  // UI state
  showConversion:   boolean;
}

const PAYMENT_METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA",         label: "eSewa" },
  { value: "KHALTI",        label: "Khalti" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "OTHER",         label: "Other" },
];

const COMMON_UNITS = ["pcs", "kg", "g", "litre", "ml", "box", "bag", "dozen", "meter", "roll", "set", "pair"];

const PURCHASE_UNITS = [
  { value: "yard",  label: "Yard" },
  { value: "feet",  label: "Feet" },
  { value: "inch",  label: "Inch" },
  { value: "meter", label: "Meter" },
  { value: "cm",    label: "Centimetre" },
  { value: "kg",    label: "Kilogram" },
  { value: "gram",  label: "Gram" },
  { value: "lb",    label: "Pound" },
  { value: "oz",    label: "Ounce" },
  { value: "litre", label: "Litre" },
  { value: "ml",    label: "Millilitre" },
  { value: "pcs",   label: "Pieces" },
  { value: "dozen", label: "Dozen" },
];

const PACKAGE_TYPES = ["roll", "box", "carton", "bundle", "bale", "bag", "sack", "piece"];

// Recomputes derived fields after any field change:
//   - quantity  = sum of packageLines when usePackages = true
//   - convertedQty = quantity × conversionFactor (when factor > 0 and purchaseUnit set)
//   - total     = quantity × unitPrice
function recompute(item: PurchaseItem): PurchaseItem {
  let qty = item.quantity;
  if (item.usePackages) {
    qty = item.packageLines.reduce((s, l) => s + (l.qty || 0), 0);
  }
  const converted =
    item.conversionFactor > 0 && item.purchaseUnit !== ""
      ? qty * item.conversionFactor
      : null;
  return {
    ...item,
    quantity:     qty,
    convertedQty: converted,
    total:        Math.max(0, qty * item.unitPrice),
  };
}

function blankItem(overrides: Partial<PurchaseItem> = {}): PurchaseItem {
  return {
    productId: null, productName: "", unit: "pcs",
    quantity: 1, unitPrice: 0, total: 0,
    purchaseUnit: "", conversionFactor: 0, convertedQty: null,
    packageType: "roll", usePackages: false, packageLines: [],
    showConversion: false,
    ...overrides,
  };
}

function NewPurchaseForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preSupplier  = searchParams.get("supplierId") ?? "";

  const [suppliers,     setSuppliers]     = useState<any[]>([]);
  const [products,      setProducts]      = useState<any[]>([]);
  const [supplierId,    setSupplierId]    = useState(preSupplier);
  const [purchaseDate,  setPurchaseDate]  = useState(new Date().toISOString().split("T")[0]);
  const [referenceNo,   setReferenceNo]   = useState("");
  const [items,         setItems]         = useState<PurchaseItem[]>([]);
  const [discount,      setDiscount]      = useState(0);
  const [paidAmount,    setPaidAmount]    = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes,         setNotes]         = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");

  useEffect(() => {
    fetch("/api/suppliers?limit=200")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));
    fetch("/api/products?limit=200&status=active")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  const subtotal    = items.reduce((s, i) => s + i.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const dueAmount   = Math.max(0, totalAmount - paidAmount);

  // Apply partial changes to an item and recompute derived fields
  const updateItemField = (index: number, changes: Partial<PurchaseItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = recompute({ ...updated[index], ...changes });
      return updated;
    });
  };

  // Update one package line within an item
  const updateLine = (itemIdx: number, lineIdx: number, changes: Partial<PackageLine>) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[itemIdx] };
      const lines = [...item.packageLines];
      lines[lineIdx] = { ...lines[lineIdx], ...changes };
      updated[itemIdx] = recompute({ ...item, packageLines: lines });
      return updated;
    });
  };

  const addLine = (itemIdx: number) => {
    const item = items[itemIdx];
    const newLine: PackageLine = { type: item.packageType || "roll", label: "", qty: 0 };
    updateItemField(itemIdx, { packageLines: [...item.packageLines, newLine] });
  };

  const removeLine = (itemIdx: number, lineIdx: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[itemIdx] };
      const lines = item.packageLines.filter((_, i) => i !== lineIdx);
      updated[itemIdx] = recompute({ ...item, packageLines: lines });
      return updated;
    });
  };

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = items.findIndex((i) => i.productId === productId);
    if (existing >= 0) {
      const ex = items[existing];
      if (ex.usePackages) {
        // add a new blank package line instead of bumping quantity
        addLine(existing);
      } else {
        updateItemField(existing, { quantity: ex.quantity + 1 });
      }
      return;
    }

    const hasPurchaseUnit = !!(product.purchaseUnit);
    const initConverted =
      hasPurchaseUnit && (product.conversionFactor ?? 0) > 0
        ? 1 * product.conversionFactor
        : null;

    setItems((prev) => [...prev, blankItem({
      productId:        product.id,
      productName:      product.name,
      unit:             product.unit,
      quantity:         1,
      unitPrice:        product.costPrice || 0,
      total:            product.costPrice || 0,
      purchaseUnit:     product.purchaseUnit     || "",
      conversionFactor: product.conversionFactor || 0,
      convertedQty:     initConverted,
      packageType:      product.purchaseUnit ? "roll" : "roll",
      showConversion:   hasPurchaseUnit,
    })]);
  };

  const addCustomItem = () => setItems((prev) => [...prev, blankItem()]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0)       return setError("Add at least one item");
    if (paidAmount > totalAmount) return setError("Paid amount cannot exceed total");
    if (items.find((i) => !i.productName.trim())) return setError("All items must have a name");
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/purchases", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId:     supplierId || undefined,
        purchaseDate,
        referenceNo:    referenceNo || undefined,
        items: items.map((item) => ({
          productId:    item.productId,
          productName:  item.productName,
          quantity:     item.quantity,
          unitPrice:    item.unitPrice,
          total:        item.total,
          unit:         item.unit,
          purchaseUnit: item.purchaseUnit || undefined,
          packageType:  item.packageType  || undefined,
          // Serialize detailed lines as JSON; omit when in simple mode
          packageLines: item.usePackages && item.packageLines.length > 0
            ? JSON.stringify(item.packageLines)
            : undefined,
          convertedQty: item.convertedQty ?? undefined,
        })),
        discountAmount: discount,
        paidAmount,
        paymentMethod,
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to create purchase");
      setSubmitting(false);
    } else {
      const purchase = await res.json();
      router.push(`/purchases/${purchase.id}`);
    }
  };

  const newProductCount = items.filter((i) => !i.productId && i.productName.trim()).length;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Purchase"
        description="Record an incoming stock purchase"
        action={<Link href="/purchases"><Button variant="outline">Cancel</Button></Link>}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Purchase Information ───────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Purchase Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No supplier / Cash purchase</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Link href="/suppliers/new" className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                + Add supplier
              </Link>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference / Bill No.</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. BILL-001"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* ── Items ─────────────────────────────────────────────────────── */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Items</h3>
            <div className="flex gap-2">
              <select
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none"
                onChange={(e) => { if (e.target.value) { addProduct(e.target.value); e.target.value = ""; } }}
                defaultValue=""
              >
                <option value="">+ Add from catalog…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — Cost: {formatCurrency(p.costPrice)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCustomItem}
                className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
              >
                + New item
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              Add items from the catalog or click &ldquo;New item&rdquo; to enter a product not yet in your catalog
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-xs text-gray-500 font-medium uppercase">Item</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium uppercase w-28">Qty</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium uppercase w-28">Unit Cost</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium uppercase w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <Fragment key={i}>

                      {/* ── Main row ── */}
                      <tr>
                        <td className="py-2 pr-3">
                          {item.productId ? (
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{item.unit} · linked to catalog</span>
                                {!item.showConversion && !item.purchaseUnit && (
                                  <button
                                    type="button"
                                    onClick={() => updateItemField(i, { showConversion: true })}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                  >
                                    + conversion
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => updateItemField(i, { productName: e.target.value })}
                                placeholder="Product name"
                                className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={item.unit}
                                  onChange={(e) => updateItemField(i, { unit: e.target.value })}
                                  className="px-1.5 py-0.5 rounded border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                                >
                                  {COMMON_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                                {item.productName.trim() && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    New product
                                  </span>
                                )}
                                {!item.showConversion && !item.purchaseUnit && (
                                  <button
                                    type="button"
                                    onClick={() => updateItemField(i, { showConversion: true })}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                  >
                                    + conversion
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Qty — read-only when packages mode totals it */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            readOnly={item.usePackages}
                            onChange={(e) => {
                              if (!item.usePackages) {
                                updateItemField(i, { quantity: parseFloat(e.target.value) || 0 });
                              }
                            }}
                            className={`w-full text-right px-2 py-1 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 ${
                              item.usePackages
                                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                : "border-gray-200"
                            }`}
                          />
                          {item.purchaseUnit && item.purchaseUnit !== item.unit && (
                            <p className="text-xs text-center text-gray-400 mt-0.5">{item.purchaseUnit}</p>
                          )}
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItemField(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        <td className="py-2 pl-2">
                          <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* ── Conversion + packaging panel ── */}
                      {(item.showConversion || item.purchaseUnit !== "") && (
                        <tr>
                          <td colSpan={5} className="px-3 pb-3 pt-0">
                            <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 space-y-3">

                              {/* Row 1: purchase unit + factor + mode toggle */}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <label className="text-xs text-gray-500 whitespace-nowrap">Purchase unit</label>
                                  <select
                                    value={item.purchaseUnit}
                                    onChange={(e) => updateItemField(i, { purchaseUnit: e.target.value })}
                                    className="px-2 py-1 rounded border border-gray-200 text-xs bg-white focus:outline-none"
                                  >
                                    <option value="">Base unit (no conversion)</option>
                                    {PURCHASE_UNITS.map((u) => (
                                      <option key={u.value} value={u.value}>{u.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {item.purchaseUnit && (
                                  <div className="flex items-center gap-1.5">
                                    <label className="text-xs text-gray-500 whitespace-nowrap">
                                      {item.unit}/{item.purchaseUnit}
                                    </label>
                                    <input
                                      type="number"
                                      step="0.00001"
                                      min="0.00001"
                                      value={item.conversionFactor || ""}
                                      onChange={(e) => updateItemField(i, { conversionFactor: parseFloat(e.target.value) || 0 })}
                                      placeholder="e.g. 0.9144"
                                      className="w-24 px-2 py-1 rounded border border-gray-200 text-xs focus:outline-none"
                                    />
                                  </div>
                                )}

                                {item.purchaseUnit && (
                                  <div className="ml-auto flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Entry mode:</span>
                                    <button
                                      type="button"
                                      onClick={() => updateItemField(i, {
                                        usePackages: false,
                                        quantity: item.quantity, // keep the computed total
                                      })}
                                      className={`text-xs px-2.5 py-1 rounded-l-full border transition ${
                                        !item.usePackages
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                                      }`}
                                    >
                                      Total qty
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Switch to package mode; seed with one blank line if empty
                                        const lines = item.packageLines.length > 0
                                          ? item.packageLines
                                          : [{ type: item.packageType || "roll", label: "", qty: 0 }];
                                        updateItemField(i, { usePackages: true, packageLines: lines });
                                      }}
                                      className={`text-xs px-2.5 py-1 rounded-r-full border-t border-b border-r transition ${
                                        item.usePackages
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                                      }`}
                                    >
                                      📦 Packages
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Row 2: Package breakdown table */}
                              {item.usePackages && item.purchaseUnit && (
                                <div className="space-y-1.5">
                                  <div className="grid gap-1" style={{ gridTemplateColumns: "90px 1fr 80px 24px" }}>
                                    <span className="text-xs text-gray-400 px-1">Type</span>
                                    <span className="text-xs text-gray-400 px-1">Label</span>
                                    <span className="text-xs text-gray-400 px-1 text-right">Qty ({item.purchaseUnit})</span>
                                    <span />
                                  </div>
                                  {item.packageLines.map((line, li) => (
                                    <div key={li} className="grid gap-1 items-center" style={{ gridTemplateColumns: "90px 1fr 80px 24px" }}>
                                      <select
                                        value={line.type}
                                        onChange={(e) => updateLine(i, li, { type: e.target.value })}
                                        className="px-1.5 py-1 rounded border border-gray-200 text-xs bg-white focus:outline-none"
                                      >
                                        {PACKAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                      <input
                                        type="text"
                                        value={line.label}
                                        onChange={(e) => updateLine(i, li, { label: e.target.value })}
                                        placeholder={`${line.type} ${li + 1}`}
                                        className="px-2 py-1 rounded border border-gray-200 text-xs focus:outline-none"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={line.qty || ""}
                                        onChange={(e) => updateLine(i, li, { qty: parseFloat(e.target.value) || 0 })}
                                        className="px-2 py-1 rounded border border-gray-200 text-xs text-right focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeLine(i, li)}
                                        className="text-gray-300 hover:text-red-500 transition flex items-center justify-center"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addLine(i)}
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                  >
                                    + Add {item.packageType || "package"}
                                  </button>
                                </div>
                              )}

                              {/* Conversion preview */}
                              {item.quantity > 0 && item.purchaseUnit && (
                                <div className="rounded bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                                  {item.usePackages ? (
                                    <span>
                                      {item.packageLines.length} package{item.packageLines.length !== 1 ? "s" : ""}
                                      {" · "}Total: <strong>{item.quantity} {item.purchaseUnit}</strong>
                                    </span>
                                  ) : (
                                    <span>Total: <strong>{item.quantity} {item.purchaseUnit}</strong></span>
                                  )}
                                  {item.convertedQty != null && item.purchaseUnit !== item.unit && (
                                    <span className="ml-2">
                                      → <strong>{item.convertedQty.toFixed(4)} {item.unit}</strong> added to stock
                                    </span>
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => updateItemField(i, {
                                  showConversion: false, purchaseUnit: "", conversionFactor: 0,
                                  usePackages: false, packageLines: [], convertedQty: null,
                                })}
                                className="text-xs text-gray-400 hover:text-red-500"
                              >
                                Clear conversion
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {newProductCount > 0 && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {newProductCount} new product{newProductCount > 1 ? "s" : ""} will be automatically added to your catalog when this purchase is saved.
            </p>
          )}
          {items.some((i) => i.productId !== null) && (
            <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              Stock will be automatically updated for catalog-linked items on save.
            </p>
          )}
        </div>

        {/* ── Payment ───────────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount</span>
                <input
                  type="number" min="0" value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none"
                />
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid Now</label>
                <input
                  type="number" min="0" max={totalAmount} step="0.01" value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining Payable</span>
                <span className={`font-bold ${dueAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
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

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="font-medium text-gray-900 mb-4">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Any notes about this purchase…"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={submitting} disabled={items.length === 0}>
            Save Purchase
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <NewPurchaseForm />
    </Suspense>
  );
}
