import { z } from "zod";

export const saleItemSchema = z.object({
  productId:   z.string().min(1, "Product is required"),
  productName: z.string(),
  quantity:    z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice:   z.coerce.number().min(0, "Unit price must be >= 0"),
  discount:    z.coerce.number().min(0).default(0),
  total:       z.coerce.number(),
});

export const saleSchema = z.object({
  customerId:    z.string().optional(),   // omit or empty → walk-in customer resolved server-side
  saleDate:      z.string(),
  items:         z.array(saleItemSchema).min(1, "At least one item is required"),
  discountAmount:z.coerce.number().min(0).default(0),
  paidAmount:    z.coerce.number().min(0, "Paid amount must be >= 0"),
  paymentMethod: z.enum(["CASH","BANK_TRANSFER","ESEWA","KHALTI","FONEPAY","CHEQUE","OTHER"]).default("CASH"),
  saleNote:      z.string().optional(),
  promiseNote:   z.string().optional(),
  nextRepayDate: z.string().optional(),
});

export type SaleFormData   = z.infer<typeof saleSchema>;
export type SaleItemData   = z.infer<typeof saleItemSchema>;
