import { cn, formatCurrency } from "@/lib/utils";

interface StatsCardProps {
  title:     string;
  value:     string | number;
  isCurrency?: boolean;
  icon:      React.ReactNode;
  iconBg:    string;
  trend?:    { value: number; label: string };
  className?: string;
}

export function StatsCard({ title, value, isCurrency, icon, iconBg, trend, className }: StatsCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;

  return (
    <div className={cn("stat-card", className)}>
      <div className={cn("flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{displayValue}</p>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.value >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
