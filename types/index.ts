import type {
  User, Customer, Product, Sale, SaleItem, Payment,
  InventoryAdjustment, Business, Membership,
} from "@prisma/client";

export type { User, Customer, Product, Sale, SaleItem, Payment, InventoryAdjustment, Business, Membership };

// String literal unions replace Prisma enums (SQLite doesn't support native enums)
export type Role           = "ADMIN" | "STAFF";
export type CustomerType   = "INDIVIDUAL" | "BUSINESS";
export type PaymentStatus  = "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
export type PaymentMethod  = "CASH" | "BANK_TRANSFER" | "ESEWA" | "KHALTI" | "FONEPAY" | "CHEQUE" | "OTHER";
export type AdjustmentType = "MANUAL_IN" | "MANUAL_OUT" | "SALE" | "RETURN" | "INITIAL";

export type SaleWithRelations = Sale & {
  customer:  Customer;
  items:     (SaleItem & { product: Product })[];
  payments:  Payment[];
  createdBy: Pick<User, "id" | "name">;
};

export type CustomerWithStats = Customer & {
  _count:      { sales: number };
  totalSales?: number;
  totalPaid?:  number;
  totalDue?:   number;
};

export type PaymentWithRelations = Payment & {
  sale:       Pick<Sale, "id" | "invoiceNumber" | "totalAmount">;
  receivedBy: Pick<User, "id" | "name">;
};

export type DashboardStats = {
  totalSales:     number;
  totalRevenue:   number;
  totalPaid:      number;
  totalDue:       number;
  totalCustomers: number;
  totalProducts:  number;
  lowStockCount:  number;
  overdueCount:   number;
};
