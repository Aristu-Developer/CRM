"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatsCard }      from "@/components/dashboard/StatsCard";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { StatusBadge }    from "@/components/ui/Badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useBusinessConfig }                from "@/components/providers/BusinessConfigProvider";
import { getRetailBadgeLabel }             from "@/lib/business-config";

const EMPTY_DATA = {
  stats: {
    totalSales: 0, totalRevenue: 0, totalPaid: 0, totalDue: 0,
    totalCustomers: 0, totalProducts: 0, lowStockCount: 0, overdueCount: 0,
  },
  todaySummary:   { salesCount: 0, salesAmount: 0, collected: 0, newDue: 0 },
  profitSummary:  {
    todayGrossProfit: 0, todayNetProfit: 0,
    monthGrossProfit: 0, monthNetProfit: 0,
    totalGrossProfit: 0, totalNetProfit: 0,
  },
  lowStockProducts: [] as { id: string; name: string; sku: string; stock: number; reorderLevel: number }[],
  recentSales:      [],
  recentPayments:   [],
  topProducts:      [],
  chartData:        [],
};

// ─── Shared icon helpers (keep JSX concise) ─────────────────────────────────
const Icon = {
  currency: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  invoice: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  box: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  users: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  clock: (cls: string) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function DashboardPage() {
  const config    = useBusinessConfig();
  const { modules } = config;
  const isRetail  = config.businessType === "retail";

  const [data,         setData]         = useState<any>(EMPTY_DATA);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(false);
  const [chartType,    setChartType]    = useState("sales");
  const [period,       setPeriod]       = useState("monthly");
  const [chartLoading, setChartLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setChartLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/dashboard?chart=${chartType}&period=${period}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("application/json")) {
        setFetchError(true);
        setData(EMPTY_DATA);
        return;
      }
      const json = await res.json();
      setData({ ...EMPTY_DATA, ...json });
    } catch {
      setFetchError(true);
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, [chartType, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { stats, todaySummary, profitSummary, lowStockProducts, recentSales, recentPayments, topProducts, chartData } = data;

  // ─── Retail dashboard ────────────────────────────────────────────────────
  if (isRetail) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Retail overview</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {getRetailBadgeLabel(config.subType)}
            </span>
            {modules.sales && (
              <Link
                href="/sales/quick"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Sale
              </Link>
            )}
          </div>
        </div>

        {fetchError && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            Could not load dashboard data. Please refresh the page.
          </div>
        )}

        {/* Today's Summary strip */}
        {modules.sales && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-3">Today's Summary</p>
            <div className={`grid divide-x divide-white/20 ${modules.payments && modules.dues ? "grid-cols-3" : modules.payments || modules.dues ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="text-center pr-2 sm:pr-4">
                <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(todaySummary.salesAmount)}</p>
                <p className="text-xs opacity-75 mt-0.5">
                  {todaySummary.salesCount === 0
                    ? "No sales yet"
                    : `${todaySummary.salesCount} sale${todaySummary.salesCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              {modules.payments && (
                <div className="text-center px-2 sm:px-4">
                  <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(todaySummary.collected)}</p>
                  <p className="text-xs opacity-75 mt-0.5">Collected</p>
                </div>
              )}
              {modules.dues && (
                <div className="text-center pl-2 sm:pl-4">
                  <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(todaySummary.newDue)}</p>
                  <p className="text-xs opacity-75 mt-0.5">New dues added</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats grid: show only cards for enabled modules */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.sales && (
            <StatsCard title="Today's Sales" value={todaySummary.salesAmount} isCurrency
              iconBg="bg-blue-50" icon={Icon.currency("w-5 h-5 text-blue-600")} />
          )}
          {modules.payments && (
            <StatsCard title="Today's Collection" value={todaySummary.collected} isCurrency
              iconBg="bg-green-50" icon={Icon.check("w-5 h-5 text-green-600")} />
          )}
          {modules.dues && (
            <StatsCard title="Total Due" value={stats.totalDue} isCurrency
              iconBg="bg-red-50" icon={Icon.alert("w-5 h-5 text-red-500")} />
          )}
          {modules.inventory && (
            <StatsCard title="Low Stock Items" value={stats.lowStockCount}
              iconBg="bg-orange-50" icon={Icon.warning("w-5 h-5 text-orange-500")} />
          )}
          {modules.products && (
            <StatsCard title="Total Products" value={stats.totalProducts}
              iconBg="bg-indigo-50" icon={Icon.box("w-5 h-5 text-indigo-600")} />
          )}
          {modules.customers && (
            <StatsCard title="Customers" value={stats.totalCustomers}
              iconBg="bg-yellow-50" icon={Icon.users("w-5 h-5 text-yellow-600")} />
          )}
        </div>

        {/* Profit Overview */}
        {modules.sales && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Profit Overview</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Estimated</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="text-center pr-2">
                <p className={cn("text-base font-bold", profitSummary.todayNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(profitSummary.todayNetProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Today</p>
              </div>
              <div className="text-center px-2">
                <p className={cn("text-base font-bold", profitSummary.monthNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(profitSummary.monthNetProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">This Month</p>
              </div>
              <div className="text-center pl-2">
                <p className={cn("text-base font-bold", profitSummary.totalNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(profitSummary.totalNetProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">All Time</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50">
              Net = Sales − Purchases − Expenses − Loan Interest
            </p>
          </div>
        )}

        {/* Sales Trend chart */}
        {modules.sales && (
          <DashboardChart
            title="Sales Trend"
            data={chartData ?? []}
            chartType={chartType}
            period={period}
            onChartChange={setChartType}
            onPeriodChange={setPeriod}
            isLoading={chartLoading}
          />
        )}

        {/* Low Stock Alert */}
        {modules.inventory && lowStockProducts.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Low Stock Alert</h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                  {lowStockProducts.length}
                </span>
              </div>
              <Link href="/products" className="text-xs text-primary-600 hover:underline">
                View all products
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(lowStockProducts as { id: string; name: string; sku: string; stock: number; reorderLevel: number }[]).map((p) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">{p.stock} left</p>
                    <p className="text-xs text-gray-400">min {p.reorderLevel}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: Recent Sales + Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Sales */}
          {modules.sales && (
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Recent {config.saleLabel}</h3>
              <Link href="/sales" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSales.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-gray-500">No sales yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start by{" "}
                    <Link href="/sales/new" className="text-primary-600 hover:underline">creating your first sale</Link>.
                  </p>
                </div>
              ) : (
                recentSales.map((sale: any) => (
                  <Link key={sale.id} href={`/sales/${sale.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.customer?.name}</p>
                      <p className="text-xs text-gray-400">{sale.invoiceNumber} · {formatDate(sale.saleDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                      <StatusBadge status={sale.paymentStatus} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
          )}

          {/* Top Products */}
          {modules.products && (
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Top {config.productLabel}</h3>
              <Link href="/products" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium text-gray-500">No products yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <Link href="/products/new" className="text-primary-600 hover:underline">Add products</Link>{" "}
                    to track inventory.
                  </p>
                </div>
              ) : (
                topProducts.map((p: any, i: number) => (
                  <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400">{p._sum.quantity} units sold</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(p._sum.total ?? 0)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Generic dashboard (all other business types) ────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your business performance</p>
      </div>

      {fetchError && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Could not load dashboard data. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.sales     && <StatsCard title="Total Revenue"   value={stats.totalRevenue}   isCurrency iconBg="bg-blue-50"   icon={Icon.currency("w-5 h-5 text-blue-600")} />}
        {modules.payments  && <StatsCard title="Total Collected" value={stats.totalPaid}      isCurrency iconBg="bg-green-50"  icon={Icon.check("w-5 h-5 text-green-600")} />}
        {modules.dues      && <StatsCard title="Total Due"       value={stats.totalDue}       isCurrency iconBg="bg-red-50"    icon={Icon.alert("w-5 h-5 text-red-500")} />}
        {modules.sales     && <StatsCard title={`Total ${config.saleLabel}`} value={stats.totalSales} iconBg="bg-purple-50" icon={Icon.invoice("w-5 h-5 text-purple-600")} />}
        {modules.customers && <StatsCard title={config.customerLabel} value={stats.totalCustomers} iconBg="bg-yellow-50" icon={Icon.users("w-5 h-5 text-yellow-600")} />}
        {modules.products  && <StatsCard title={config.productLabel}  value={stats.totalProducts}  iconBg="bg-indigo-50" icon={Icon.box("w-5 h-5 text-indigo-600")} />}
        {modules.inventory && <StatsCard title="Low Stock"       value={stats.lowStockCount}             iconBg="bg-orange-50" icon={Icon.warning("w-5 h-5 text-orange-500")} />}
        {modules.dues      && <StatsCard title="Overdue"         value={stats.overdueCount}              iconBg="bg-red-50"    icon={Icon.clock("w-5 h-5 text-red-600")} />}
      </div>

      {/* Profit Overview */}
      {modules.sales && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Profit Overview</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Estimated</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center pr-2">
              <p className={cn("text-base font-bold", profitSummary.todayNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                {formatCurrency(profitSummary.todayNetProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Today</p>
            </div>
            <div className="text-center px-2">
              <p className={cn("text-base font-bold", profitSummary.monthNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                {formatCurrency(profitSummary.monthNetProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">This Month</p>
            </div>
            <div className="text-center pl-2">
              <p className={cn("text-base font-bold", profitSummary.totalNetProfit >= 0 ? "text-green-600" : "text-red-500")}>
                {formatCurrency(profitSummary.totalNetProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">All Time</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50">
            Net = Sales − Purchases − Expenses − Loan Interest
          </p>
        </div>
      )}

      {modules.sales && (
      <DashboardChart
        data={chartData ?? []}
        chartType={chartType}
        period={period}
        onChartChange={setChartType}
        onPeriodChange={setPeriod}
        isLoading={chartLoading}
      />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Sales</h3>
            <Link href="/sales" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSales.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No sales yet</p>
            )}
            {recentSales.map((sale: any) => (
              <Link key={sale.id} href={`/sales/${sale.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{sale.customer?.name}</p>
                  <p className="text-xs text-gray-400">{sale.invoiceNumber} · {formatDate(sale.saleDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                  <StatusBadge status={sale.paymentStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Top Products</h3>
              <Link href="/products" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {topProducts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
              )}
              {topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">{p._sum.quantity} units</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(p._sum.total ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Payments</h3>
              <Link href="/payments" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentPayments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No payments yet</p>
              )}
              {recentPayments.map((pmt: any) => (
                <div key={pmt.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{pmt.sale?.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(pmt.paymentDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+{formatCurrency(pmt.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
