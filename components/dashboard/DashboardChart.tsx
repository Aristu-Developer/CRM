"use client";

import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartDataPoint {
  date:  string;
  value: number;
}

interface DashboardChartProps {
  data:           ChartDataPoint[];
  onChartChange:  (type: string)   => void;
  onPeriodChange: (period: string) => void;
  chartType:      string;
  period:         string;
  isLoading?:     boolean;
  title?:         string;
}

const chartOptions = [
  { value: "sales",    label: "Sales" },
  { value: "payments", label: "Payments" },
  { value: "inventory",label: "Inventory" },
];

const periodOptions = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function DashboardChart({
  data, onChartChange, onPeriodChange,
  chartType, period, isLoading, title,
}: DashboardChartProps) {
  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="font-semibold text-gray-900">{title ?? "Performance Overview"}</h3>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart type selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {chartOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChartChange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  chartType === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPeriodChange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  period === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
