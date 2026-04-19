import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "purple";

const variants: Record<BadgeVariant, string> = {
  green:  "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  gray:   "bg-gray-100 text-gray-600 border-gray-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

// Payment status badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PAID:     { label: "Paid",     variant: "green"  },
    PARTIAL:  { label: "Partial",  variant: "yellow" },
    UNPAID:   { label: "Unpaid",   variant: "red"    },
    OVERDUE:  { label: "Overdue",  variant: "red"    },
    ACTIVE:   { label: "Active",   variant: "green"  },
    INACTIVE: { label: "Inactive", variant: "gray"   },
  };
  const config = map[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
