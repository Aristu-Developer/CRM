// ─── Module IDs + config ─────────────────────────────────────────────────────

export type ModuleId =
  | "customers"
  | "products"
  | "sales"
  | "payments"
  | "inventory"
  | "dues"
  | "reports"
  | "team"
  | "suppliers"
  | "purchases"
  | "expenses"
  | "loans"
  | "journal"
  | "statements";

export interface ModuleConfig {
  customers:  boolean;
  products:   boolean;
  sales:      boolean;
  payments:   boolean;
  inventory:  boolean;
  dues:       boolean;
  reports:    boolean;
  team:       boolean;
  suppliers:  boolean;
  purchases:  boolean;
  expenses:   boolean;
  loans:      boolean;
  journal:    boolean;
  statements: boolean;
}

// ─── Module metadata (for UI rendering) ──────────────────────────────────────

export interface ModuleDefinition {
  id:          ModuleId;
  label:       string;
  description: string;
  dependsOn?:  ModuleId;  // if the parent is disabled, this is forced off
}

export const MODULE_LIST: ModuleDefinition[] = [
  {
    id:          "customers",
    label:       "Customers",
    description: "Customer database, contact info, and history",
  },
  {
    id:          "products",
    label:       "Products / Services",
    description: "Product or service catalog with pricing",
  },
  {
    id:          "sales",
    label:       "Sales / Billing",
    description: "Create invoices and record sales transactions",
  },
  {
    id:          "payments",
    label:       "Payments",
    description: "Record payment collections against sales",
  },
  {
    id:          "inventory",
    label:       "Inventory",
    description: "Stock levels, reorder alerts, and adjustments",
    dependsOn:   "products",
  },
  {
    id:          "dues",
    label:       "Due Tracking",
    description: "Outstanding dues, overdue alerts, and repayment dates",
  },
  {
    id:          "reports",
    label:       "Reports",
    description: "Sales, payment, and inventory analytics",
  },
  {
    id:          "team",
    label:       "Team",
    description: "Invite members and manage roles",
  },
  {
    id:          "suppliers",
    label:       "Suppliers",
    description: "Vendor/supplier directory and contact management",
  },
  {
    id:          "purchases",
    label:       "Purchases",
    description: "Track incoming stock purchases and supplier payables",
    dependsOn:   "suppliers",
  },
  {
    id:          "expenses",
    label:       "Expenses",
    description: "Record operating costs like rent, utilities, and salaries",
  },
  {
    id:          "loans",
    label:       "Loans",
    description: "Track loans taken or given with interest and repayments",
  },
  {
    id:          "journal",
    label:       "Daily Journal",
    description: "Day-by-day cash flow summary across all transactions",
  },
  {
    id:          "statements",
    label:       "Statements",
    description: "Monthly and yearly business performance summaries with email export",
  },
];

// ─── Templates ───────────────────────────────────────────────────────────────

export interface ModuleTemplate {
  label:       string;
  description: string;
  modules:     ModuleConfig;
}

export const MODULE_TEMPLATES: Record<string, ModuleTemplate> = {
  retail: {
    label:       "Retail Shop",
    description: "Full-featured: inventory, dues, payments, reports",
    modules: {
      customers: true,  products: true,  sales: true,    payments: true,
      inventory: true,  dues: true,      reports: true,  team: true,
      suppliers: true,  purchases: true, expenses: true, loans: true,
      journal: true,    statements: true,
    },
  },
  agency: {
    label:       "Agency / Services",
    description: "Client management without physical inventory",
    modules: {
      customers: true,  products: true,  sales: true,    payments: true,
      inventory: false, dues: true,      reports: true,  team: true,
      suppliers: false, purchases: false, expenses: true, loans: true,
      journal: true,    statements: true,
    },
  },
  organization: {
    label:       "Organization / NGO",
    description: "Member billing — no inventory or due tracking",
    modules: {
      customers: true,  products: false, sales: true,    payments: true,
      inventory: false, dues: false,     reports: true,  team: true,
      suppliers: false, purchases: false, expenses: true, loans: true,
      journal: true,    statements: true,
    },
  },
};

/** Maps a businessType slug to its best-fit template key */
export const BUSINESS_TYPE_TO_TEMPLATE: Record<string, string> = {
  retail:       "retail",
  trading:      "retail",
  agency:       "agency",
  organization: "organization",
  other:        "retail",
};

// ─── Defaults ────────────────────────────────────────────────────────────────

export const ALL_MODULES_ON: ModuleConfig = {
  customers: true, products: true,   sales: true,    payments:  true,
  inventory: true, dues: true,       reports: true,  team: true,
  suppliers: true, purchases: true,  expenses: true, loans: true,
  journal:   true, statements: true,
};

export const DEFAULT_MODULES: ModuleConfig = ALL_MODULES_ON;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a JSON string stored in the DB back to a ModuleConfig.
 * Missing keys default to `true` so new modules are enabled for existing businesses.
 */
export function parseModules(json: string | null | undefined): ModuleConfig {
  if (!json || json === "" || json === "{}") return DEFAULT_MODULES;
  try {
    const parsed = JSON.parse(json) as Partial<ModuleConfig>;
    return { ...DEFAULT_MODULES, ...parsed };
  } catch {
    return DEFAULT_MODULES;
  }
}

/** Serialize a ModuleConfig to a JSON string for DB storage. */
export function serializeModules(config: ModuleConfig): string {
  return JSON.stringify(config);
}

/**
 * Enforce module dependencies.
 * - `inventory` requires `products`
 * - `purchases` requires `suppliers`
 */
export function applyDependencies(config: ModuleConfig): ModuleConfig {
  return {
    ...config,
    inventory:  config.products  ? config.inventory  : false,
    purchases:  config.suppliers ? config.purchases  : false,
  };
}

/** Get the module template that matches a given business type slug. */
export function getTemplateForBusinessType(businessType: string): ModuleTemplate {
  const key = BUSINESS_TYPE_TO_TEMPLATE[businessType] ?? "retail";
  return MODULE_TEMPLATES[key] ?? MODULE_TEMPLATES.retail;
}
