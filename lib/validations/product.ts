import { z } from "zod";

export const productSchema = z.object({
  name:             z.string().min(1, "Product name is required").max(100),
  sku:              z.string().min(1, "SKU is required").max(50),
  category:         z.string().optional(),
  description:      z.string().optional(),
  costPrice:        z.coerce.number().min(0, "Cost price must be >= 0"),
  sellingPrice:     z.coerce.number().min(0, "Selling price must be >= 0"),
  stock:            z.coerce.number().min(0, "Stock must be >= 0"),  // Float to support unit conversions
  reorderLevel:     z.coerce.number().int().min(0).default(10),
  unit:             z.string().default("pcs"),
  isActive:         z.boolean().default(true),
  // Optional purchase-side unit conversion
  purchaseUnit:     z.string().optional(),
  conversionFactor: z.coerce.number().positive().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
