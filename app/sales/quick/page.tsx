"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id:           string;
  name:         string;
  sku:          string;
  sellingPrice: number;
  stock:        number;
  unit:         string;
};

type CartItem = {
  productId:   string;
  productName: string;
  unitPrice:   number;
  quantity:    number;
  stock:       number;
  unit:        string;
};

type PayMode = "CASH" | "DIGITAL" | "DUE";

const PAY_METHOD: Record<PayMode, string> = {
  CASH:    "CASH",
  DIGITAL: "ESEWA",
  DUE:     "CASH",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ─── Cart row ─────────────────────────────────────────────────────────────────

interface CartRowProps {
  item:     CartItem;
  qtyRef:   (el: HTMLInputElement | null) => void;
  onChange: (qty: number) => void;
  onRemove: () => void;
  onEnter:  () => void;
}

function CartRow({ item, qtyRef, onChange, onRemove, onEnter }: CartRowProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm leading-tight truncate">{item.productName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatCurrency(item.unitPrice)} / {item.unit}
          {item.stock <= 5 && item.stock > 0 && (
            <span className="ml-2 text-orange-500">only {item.stock} left</span>
          )}
          {item.stock <= 0 && (
            <span className="ml-2 text-red-500">out of stock</span>
          )}
        </p>
      </div>

      {/* Qty */}
      <input
        ref={qtyRef}
        type="number"
        min={1}
        max={item.stock > 0 ? item.stock : undefined}
        value={item.quantity}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter")  { e.preventDefault(); onEnter(); }
          if (e.key === "Escape") { e.preventDefault(); onEnter(); }
        }}
        className="w-16 text-center py-2 rounded-lg border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
      />

      {/* Row total */}
      <p className="font-bold text-gray-900 tabular-nums text-sm w-20 text-right shrink-0">
        {formatCurrency(item.unitPrice * item.quantity)}
      </p>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-500 transition p-1 rounded shrink-0"
        title="Remove item"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuickSalePage() {
  // Cart
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [payMode,    setPayMode]    = useState<PayMode>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState<{ invoiceNumber: string; id: string } | null>(null);

  // Search
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<Product[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [ddOpen,      setDdOpen]      = useState(false);
  const [searching,   setSearching]   = useState(false);

  // Refs
  const searchRef   = useRef<HTMLInputElement>(null);
  const qtyRefs     = useRef<(HTMLInputElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const ddRef       = useRef<HTMLDivElement>(null);

  // Auto-focus search on mount
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Debounced product search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setDdOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/products?search=${encodeURIComponent(query)}&status=active&limit=8`);
        const data = await res.json();
        setResults(data.products ?? []);
        setHighlighted(0);
        setDdOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Add product to cart (or increment if already present)
  const addProduct = useCallback((product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        setTimeout(() => { qtyRefs.current[idx]?.select(); }, 30);
        return next;
      }
      const newIdx = prev.length;
      setTimeout(() => { qtyRefs.current[newIdx]?.select(); }, 30);
      return [...prev, {
        productId:   product.id,
        productName: product.name,
        unitPrice:   product.sellingPrice,
        quantity:    1,
        stock:       product.stock,
        unit:        product.unit,
      }];
    });
    setQuery("");
    setResults([]);
    setDdOpen(false);
    setHighlighted(0);
    setError("");
  }, []);

  // Keyboard nav on search input
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!ddOpen && query) return;
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const p = results[highlighted >= 0 ? highlighted : 0];
      if (p) addProduct(p);
    } else if (e.key === "Escape") {
      setQuery("");
      setDdOpen(false);
    }
  };

  // Focus back to search (called from qty rows)
  const focusSearch = () => {
    // Move to next qty input if there is one, else back to search
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const removeItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  // Totals
  const total      = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const paidAmount = payMode === "DUE" ? 0 : total;

  // Submit
  const handleComplete = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess(null);

    const items = cart.map((item) => ({
      productId:   item.productId,
      productName: item.productName,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      discount:    0,
      total:       item.unitPrice * item.quantity,
    }));

    try {
      const res  = await fetch("/api/sales", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          saleDate:       new Date().toISOString(),
          items,
          discountAmount: 0,
          paidAmount,
          paymentMethod:  PAY_METHOD[payMode],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sale failed. Try again.");
      } else {
        setSuccess({ invoiceNumber: data.invoiceNumber, id: data.id });
        setCart([]);
        setPayMode("CASH");
        setTimeout(() => setSuccess(null), 6000);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto pb-56">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quick Sale</h1>
          <p className="text-xs text-gray-400 mt-0.5">Walk-in · Cash by default · No customer required</p>
        </div>
        <Link
          href="/sales/new"
          className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-1 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Full Form
        </Link>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckIcon />
            <div>
              <p className="text-sm font-semibold text-green-800">Sale complete!</p>
              <p className="text-xs text-green-600 font-mono">{success.invoiceNumber}</p>
            </div>
          </div>
          <Link
            href={`/sales/${success.id}`}
            className="text-xs font-medium text-green-700 underline underline-offset-2 hover:text-green-900 shrink-0"
          >
            View receipt
          </Link>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3">
            <XIcon />
          </button>
        </div>
      )}

      {/* ── Product search ── */}
      <div className="relative mb-4">
        <div className="relative">
          {/* Search icon */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {searching
              ? <svg className="w-5 h-5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>
              : <SearchIcon />
            }
          </span>

          <input
            ref={searchRef}
            type="text"
            value={query}
            autoComplete="off"
            spellCheck={false}
            placeholder="Type product name or SKU…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            onBlur={() => setTimeout(() => setDdOpen(false), 150)}
            className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-300 focus:border-primary-500 focus:outline-none text-sm bg-white shadow-sm transition"
          />

          {/* Clear button */}
          {query && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setQuery(""); setDdOpen(false); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon />
            </button>
          )}
        </div>

        {/* ── Dropdown ── */}
        {ddOpen && results.length > 0 && (
          <div
            ref={ddRef}
            onMouseDown={(e) => e.preventDefault()}  // prevent search blur
            className="absolute z-50 w-full top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {results.map((p, i) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition ${
                  i === highlighted ? "bg-primary-50" : "hover:bg-gray-50"
                } ${p.stock <= 0 ? "opacity-50" : ""}`}
                disabled={p.stock <= 0}
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight truncate pr-2">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.sku}
                    {p.stock <= 0
                      ? " · Out of stock"
                      : p.stock <= 5
                        ? <span className="text-orange-500"> · {p.stock} left</span>
                        : ` · ${p.stock} ${p.unit}`
                    }
                  </p>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <p className="font-bold text-gray-900 text-sm tabular-nums">{formatCurrency(p.sellingPrice)}</p>
                </div>
              </button>
            ))}

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">↑↓ navigate · Enter to add · Esc to close</p>
            </div>
          </div>
        )}

        {/* No results */}
        {ddOpen && query && !searching && results.length === 0 && (
          <div className="absolute z-50 w-full top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 px-4 py-4 text-center">
            <p className="text-sm text-gray-500">No products found for "{query}"</p>
            <Link href="/products/new" className="text-xs text-primary-600 hover:underline mt-1 block">
              + Add new product
            </Link>
          </div>
        )}
      </div>

      {/* ── Cart ── */}
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CartIcon />
          <p className="text-sm font-medium text-gray-400 mt-3">Cart is empty</p>
          <p className="text-xs text-gray-300 mt-1">Search for a product above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column header */}
          <div className="flex items-center gap-3 px-4 py-1">
            <p className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Product</p>
            <p className="w-16 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Qty</p>
            <p className="w-20 text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Total</p>
            <span className="w-6" />
          </div>

          {cart.map((item, i) => (
            <CartRow
              key={item.productId}
              item={item}
              qtyRef={(el) => { qtyRefs.current[i] = el; }}
              onChange={(qty) =>
                setCart((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], quantity: qty };
                  return next;
                })
              }
              onRemove={() => removeItem(i)}
              onEnter={focusSearch}
            />
          ))}

          {/* Subtotal row */}
          {cart.length > 1 && (
            <div className="flex justify-between items-center px-4 pt-1">
              <span className="text-xs text-gray-400">{cart.length} items</span>
              <span className="text-sm font-bold text-gray-700 tabular-nums">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 z-30 px-4 pt-3 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">

        {/* Total amount */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">
            {payMode === "DUE" ? "Amount Due" : "Total to Pay"}
          </span>
          <span className="text-3xl font-bold text-gray-900 tabular-nums leading-none">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Payment mode toggle */}
        <div className="flex gap-2 mb-3">
          {(["CASH", "DIGITAL", "DUE"] as PayMode[]).map((mode) => {
            const labels: Record<PayMode, string> = {
              CASH:    "Cash",
              DIGITAL: "Digital",
              DUE:     "On Due",
            };
            const active = payMode === mode;
            const activeClass =
              mode === "DUE"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-primary-600 text-white border-primary-600";
            return (
              <button
                key={mode}
                onClick={() => setPayMode(mode)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition active:scale-95 ${
                  active ? activeClass : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* Due mode hint */}
        {payMode === "DUE" && (
          <p className="text-xs text-orange-600 mb-2 text-center">
            Full amount will be added to customer dues (Walk-in)
          </p>
        )}

        {/* Complete Sale button */}
        <button
          onClick={handleComplete}
          disabled={cart.length === 0 || submitting}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-base transition active:scale-[0.98] shadow-sm"
        >
          {submitting
            ? "Processing…"
            : cart.length === 0
              ? "Add items to complete sale"
              : `Complete Sale · ${formatCurrency(paidAmount > 0 ? paidAmount : total)}`
          }
        </button>
      </div>
    </div>
  );
}
