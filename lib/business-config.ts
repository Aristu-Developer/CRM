import {
  type ModuleConfig,
  parseModules,
  DEFAULT_MODULES,
  BUSINESS_TYPE_TO_TEMPLATE,
  MODULE_TEMPLATES,
} from "@/lib/modules";

export type BusinessType  = "retail" | "trading" | "agency" | "organization" | "other";
export type RetailSubType = "GROCERY" | "MEAT" | "CLOTHING" | "OTHER";

export interface BusinessConfig {
  businessType:  BusinessType;
  subType:       RetailSubType | null;  // non-null only when businessType === "retail"
  modules:       ModuleConfig;
  customerLabel: string;
  productLabel:  string;
  saleLabel:     string;
}

// ─── Business-type label presets (labels only; modules come from lib/modules) ─

type LabelPreset = Pick<BusinessConfig, "customerLabel" | "productLabel" | "saleLabel">;

export const BUSINESS_TYPE_PRESETS: Record<BusinessType, LabelPreset> = {
  retail:       { customerLabel: "Customers", productLabel: "Products",  saleLabel: "Sales"    },
  trading:      { customerLabel: "Customers", productLabel: "Goods",     saleLabel: "Orders"   },
  agency:       { customerLabel: "Clients",   productLabel: "Services",  saleLabel: "Projects" },
  organization: { customerLabel: "Members",   productLabel: "Items",     saleLabel: "Billing"  },
  other:        { customerLabel: "Customers", productLabel: "Products",  saleLabel: "Sales"    },
};

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  retail:       "Retail / Shop",
  trading:      "Trading / Distribution",
  agency:       "Agency / Services",
  organization: "NGO / Organization",
  other:        "Other",
};

export const BUSINESS_TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  retail:       "Sell products to customers, track inventory and payments",
  trading:      "Buy and sell goods in bulk, manage orders and dues",
  agency:       "Provide services to clients, track projects and billing",
  organization: "Manage members, subscriptions, or institutional billing",
  other:        "Custom setup — uses default labels with all features enabled",
};

// ─── Retail sub-type ─────────────────────────────────────────────────────────

export const RETAIL_SUB_TYPES: RetailSubType[] = ["GROCERY", "MEAT", "CLOTHING", "OTHER"];

export const RETAIL_SUB_TYPE_LABELS: Record<RetailSubType, string> = {
  GROCERY:  "Grocery Store",
  MEAT:     "Meat Shop",
  CLOTHING: "Clothing / Garments",
  OTHER:    "Other Retail",
};

export const RETAIL_SUB_TYPE_DESCRIPTIONS: Record<RetailSubType, string> = {
  GROCERY:  "Fresh produce, packaged goods, daily essentials",
  MEAT:     "Meat, poultry, seafood — weight-based sales",
  CLOTHING: "Apparel, footwear, accessories",
  OTHER:    "General retail store",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the best default unit for new products based on the business sub-type. */
export function getDefaultProductUnit(subType: RetailSubType | null): string {
  if (subType === "MEAT") return "kg";
  return "pcs";
}

/** Returns the human-readable badge label for the dashboard header. */
export function getRetailBadgeLabel(subType: RetailSubType | null): string {
  if (subType && subType !== "OTHER") return RETAIL_SUB_TYPE_LABELS[subType];
  return "Retail Shop";
}

// ─── Default config & deriveConfig ──────────────────────────────────────────

export const DEFAULT_CONFIG: BusinessConfig = {
  businessType:  "retail",
  subType:       null,
  modules:       DEFAULT_MODULES,
  ...BUSINESS_TYPE_PRESETS.retail,
};

/**
 * Build a BusinessConfig from raw business record fields.
 * Priority: stored modules JSON > legacy boolean flags > template defaults.
 */
export function deriveConfig(business: {
  businessType?:    string | null;
  businessSubType?: string | null;
  modules?:         string | null;   // new: JSON string
  hasInventory?:    boolean | null;  // legacy — used as fallback if modules not set
  usesDueTracking?: boolean | null;  // legacy — used as fallback if modules not set
  customerLabel?:   string | null;
  productLabel?:    string | null;
  saleLabel?:       string | null;
}): BusinessConfig {
  const type   = (business.businessType ?? "retail") as BusinessType;
  const preset = BUSINESS_TYPE_PRESETS[type] ?? BUSINESS_TYPE_PRESETS.other;
  const subType = type === "retail"
    ? ((business.businessSubType ?? "OTHER") as RetailSubType)
    : null;

  let modules: ModuleConfig;
  if (business.modules && business.modules !== "" && business.modules !== "{}") {
    // Stored JSON is the single source of truth
    modules = parseModules(business.modules);
  } else {
    // Legacy: derive from template + old boolean flags
    const templateKey     = BUSINESS_TYPE_TO_TEMPLATE[type] ?? "retail";
    const templateModules = MODULE_TEMPLATES[templateKey]?.modules ?? DEFAULT_MODULES;
    modules = {
      ...templateModules,
      inventory: business.hasInventory    ?? templateModules.inventory,
      dues:      business.usesDueTracking ?? templateModules.dues,
    };
  }

  return {
    businessType:  type,
    subType,
    modules,
    customerLabel: business.customerLabel ?? preset.customerLabel,
    productLabel:  business.productLabel  ?? preset.productLabel,
    saleLabel:     business.saleLabel     ?? preset.saleLabel,
  };
}
