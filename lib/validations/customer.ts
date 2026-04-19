import { z } from "zod";

export const customerSchema = z.object({
  name:         z.string().min(1, "Name is required").max(100),
  phone:        z.string().min(7, "Valid phone number required").max(20),
  altPhone:     z.string().optional(),
  email:        z.string().email("Invalid email").optional().or(z.literal("")),
  address:      z.string().optional(),
  city:         z.string().optional(),
  businessName: z.string().optional(),
  customerType: z.enum(["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL"),
  panVat:       z.string().optional(),
  notes:        z.string().optional(),
  isActive:     z.boolean().default(true),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
