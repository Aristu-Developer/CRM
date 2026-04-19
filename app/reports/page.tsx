"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader }    from "@/components/ui/PageHeader";
import { Button }        from "@/components/ui/Button";
import { StatusBadge }   from "@/components/ui/Badge";
import { formatCurrency, formatDate, getPaymentMethodLabel } from "@/lib/utils";

const REPORT_TYPES = [
  { value: "sales",     label: "Sales" },
  { value: "payments",  label: "Payments" },
  { value: "dues",      label: "Dues" },
  { value: "purchases", label: "Purchases" },
  { value: "expenses",  label: "Expenses" },
  { value: "loans",     label: "Loans" },
  { value: "inventory", label: "Inventory" },
  { value: "customers", label: "Customers" },
];

const PRESETS = [
  { value: "today",  label: "Today" },
  { value: "week",   label: "This Week" },
  { value: "month",  label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).filter((k) => !["id", "items", "payments", "sales", "adjustments", "saleItems"].includes(k));
  const rows    = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val instanceof Date || (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T/))) {
        return formatDate(val);
      }
      if (typeof val === "object") return JSON.stringify(val);
      return String(val ?? "");
    }).join(",")
  );
  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [preset,     setPreset]     = useState("month");
  const [from,       setFrom]       = useState("");
  const [to,         setTo]         = useState("");
  const [data,       setData]       = useState<any[]>([]);
  const [summary,    setSummary]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType, preset });
      if (preset === "custom" && from) params.set("from", from);
      if (preset === "custom" && to)   params.set("to",   to);
      const res         = await fetch(`/api/reports?${params}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("application/json")) {
        setData([]); setSummary(null); return;
      }
      const json = await res.json();
      setData(json.data ?? []);
      setSummary(json.summary ?? null);
    } catch (err) {
      console.error("[reports] fetch error:", err);
      setData([]); setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, preset, from, to]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = () => {
    downloadCSV(
      data.map((row) => {
        // Flatten nested objects for CSV
        const flat: any = { ...row };
        if (flat.customer)   { flat.customerName = flat.customer.name; flat.customerPhone = flat.customer.phone; delete flat.customer; }
        if (flat.supplier)   { flat.supplierName = flat.supplier?.name ?? ""; delete flat.supplier; }
        if (flat.sale)       { flat.invoiceNumber = flat.sale.invoiceNumber; delete flat.sale; }
        if (flat.receivedBy) { flat.receivedByName = flat.receivedBy.name; delete flat.receivedBy; }
        if (flat.createdBy)  { flat.createdByName = flat.createdBy?.name ?? ""; delete flat.createdBy; }
        delete flat._count; delete flat.sales; delete flat.items; delete flat.payments; delete flat.repayments;
        return flat;
      }),
      `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business performance reports"
        action={
          <Button variant="outline" onClick={handleExport} disabled={data.length === 0}
            leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            Export CSV
          </Button>
        }
      />

      {/* Controls */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          {/* Report type */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-wrap">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setReportType(t.value)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  reportType === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Period */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
                  preset === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex gap-2 items-center">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white" />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="flex flex-wrap gap-3 mb-5">
          {reportType === "sales" && (
            <>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Sales</p><p className="text-lg font-bold">{summary._count?.id ?? 0}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Revenue</p><p className="text-lg font-bold">{formatCurrency(summary._sum?.totalAmount ?? 0)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Collected</p><p className="text-lg font-bold text-green-600">{formatCurrency(summary._sum?.paidAmount ?? 0)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Due</p><p className="text-lg font-bold text-red-600">{formatCurrency(summary._sum?.dueAmount ?? 0)}</p></div>
            </>
          )}
          {reportType === "payments" && (
            <>
              <div className="card p-4"><p className="text-xs text-gray-400">Payments</p><p className="text-lg font-bold">{summary._count?.id ?? 0}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Collected</p><p className="text-lg font-bold text-green-600">{formatCurrency(summary._sum?.amount ?? 0)}</p></div>
            </>
          )}
          {reportType === "dues" && (
            <div className="card p-4"><p className="text-xs text-gray-400">Total Outstanding</p><p className="text-lg font-bold text-red-600">{formatCurrency(summary._sum?.dueAmount ?? 0)}</p></div>
          )}
          {reportType === "inventory" && (
            <>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Products</p><p className="text-lg font-bold">{summary.totalProducts ?? 0}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Low Stock</p><p className="text-lg font-bold text-orange-600">{summary.lowStockCount ?? 0}</p></div>
            </>
          )}
          {reportType === "customers" && (
            <div className="card p-4"><p className="text-xs text-gray-400">Total Customers</p><p className="text-lg font-bold">{summary.total ?? 0}</p></div>
          )}
          {reportType === "purchases" && (
            <>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Purchases</p><p className="text-lg font-bold">{summary._count?.id ?? 0}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Value</p><p className="text-lg font-bold">{formatCurrency(summary._sum?.totalAmount ?? 0)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Paid</p><p className="text-lg font-bold text-green-600">{formatCurrency(summary._sum?.paidAmount ?? 0)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Due</p><p className="text-lg font-bold text-red-600">{formatCurrency(summary._sum?.dueAmount ?? 0)}</p></div>
            </>
          )}
          {reportType === "expenses" && (
            <>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Expenses</p><p className="text-lg font-bold">{summary._count?.id ?? 0}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-400">Total Amount</p><p className="text-lg font-bold text-red-600">{formatCurrency(summary._sum?.amount ?? 0)}</p></div>
            </>
          )}
          {reportType === "loans" && (
            <div className="card p-4"><p className="text-xs text-gray-400">Total Loans</p><p className="text-lg font-bold">{summary.total ?? 0}</p></div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">No data for selected period</p>
        ) : (
          <>
            {reportType === "sales"     && <SalesTable     data={data} />}
            {reportType === "payments"  && <PaymentsTable  data={data} />}
            {reportType === "dues"      && <DuesTable      data={data} />}
            {reportType === "purchases" && <PurchasesTable data={data} />}
            {reportType === "expenses"  && <ExpensesTable  data={data} />}
            {reportType === "loans"     && <LoansTable     data={data} />}
            {reportType === "inventory" && <InventoryTable data={data} />}
            {reportType === "customers" && <CustomersTable data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

function SalesTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((s: any) => (
          <tr key={s.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-mono text-xs">{s.invoiceNumber}</td>
            <td className="px-4 py-3">{s.customer?.name}</td>
            <td className="px-4 py-3 text-gray-500">{formatDate(s.saleDate)}</td>
            <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.totalAmount)}</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(s.paidAmount)}</td>
            <td className="px-4 py-3 text-right text-red-600">{formatCurrency(s.dueAmount)}</td>
            <td className="px-4 py-3"><StatusBadge status={s.paymentStatus} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PaymentsTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Received By</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((p: any) => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-mono text-xs">{p.sale?.invoiceNumber}</td>
            <td className="px-4 py-3 text-gray-500">{formatDate(p.paymentDate)}</td>
            <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.amount)}</td>
            <td className="px-4 py-3">{getPaymentMethodLabel(p.paymentMethod)}</td>
            <td className="px-4 py-3 text-gray-500">{p.receivedBy?.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DuesTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase text-red-500">Due Amount</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Repay Date</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((s: any) => (
          <tr key={s.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-mono text-xs">{s.invoiceNumber}</td>
            <td className="px-4 py-3 font-medium">{s.customer?.name}</td>
            <td className="px-4 py-3 text-gray-500">{s.customer?.phone}</td>
            <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(s.dueAmount ?? 0)}</td>
            <td className="px-4 py-3 text-gray-500">{s.nextRepayDate ? formatDate(s.nextRepayDate) : "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={s.paymentStatus} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InventoryTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reorder At</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Selling Price</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((p: any) => (
          <tr key={p.id} className={`hover:bg-gray-50 ${p.isLowStock ? "bg-orange-50/30" : ""}`}>
            <td className="px-5 py-3 font-medium">
              {p.name}
              {p.isLowStock && <span className="ml-2 text-xs text-orange-600">Low</span>}
            </td>
            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
            <td className="px-4 py-3 text-gray-500">{p.category ?? "—"}</td>
            <td className="px-4 py-3 text-right font-bold">{p.stock} {p.unit}</td>
            <td className="px-4 py-3 text-right text-gray-500">{p.reorderLevel}</td>
            <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PurchasesTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ref No.</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((p: any) => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-medium">{p.supplier?.name ?? "—"}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.referenceNo ?? "—"}</td>
            <td className="px-4 py-3 text-gray-500">{formatDate(p.purchaseDate)}</td>
            <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(p.paidAmount)}</td>
            <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.dueAmount)}</td>
            <td className="px-4 py-3"><StatusBadge status={p.paymentStatus} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  RENT: "Rent", UTILITIES: "Utilities", SALARIES: "Salaries",
  TRANSPORT: "Transport", MAINTENANCE: "Maintenance", OTHER: "Other",
};

function ExpensesTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid To</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((e: any) => (
          <tr key={e.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-medium">{e.title}</td>
            <td className="px-4 py-3 text-gray-500">{EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}</td>
            <td className="px-4 py-3 text-gray-500">{formatDate(e.expenseDate)}</td>
            <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(e.amount)}</td>
            <td className="px-4 py-3 text-gray-500">{e.paidTo ?? "—"}</td>
            <td className="px-4 py-3 text-gray-500">{getPaymentMethodLabel(e.paymentMethod)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LoansTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Party</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Principal</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Repaid</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Interest Paid</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((l: any) => (
          <tr key={l.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-medium">{l.partyName}</td>
            <td className="px-4 py-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.type === "TAKEN" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                {l.type === "TAKEN" ? "Borrowed" : "Lent"}
              </span>
            </td>
            <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.principalAmount)}</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(l.totalRepaid ?? 0)}</td>
            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(l.totalInterest ?? 0)}</td>
            <td className="px-4 py-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.status === "CLOSED" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700"}`}>
                {l.status}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-500">{l.dueDate ? formatDate(l.dueDate) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CustomersTable({ data }: { data: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sales</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase text-red-500">Due</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((c: any) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-medium">{c.name}</td>
            <td className="px-4 py-3 text-gray-500">{c.phone}</td>
            <td className="px-4 py-3 text-right">{c.totalSales}</td>
            <td className="px-4 py-3 text-right">{formatCurrency(c.totalAmount ?? 0)}</td>
            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(c.totalPaid ?? 0)}</td>
            <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(c.totalDue ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
