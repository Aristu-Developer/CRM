import { z } from "zod";

export const paymentSchema = z.object({
  saleId:        z.string().min(1, "Sale is required"),
  paymentDate:   z.string(),
  amount:        z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH","BANK_TRANSFER","ESEWA","KHALTI","FONEPAY","CHEQUE","OTHER"]).default("CASH"),
  referenceNote: z.string().optional(),
  remarks:       z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
