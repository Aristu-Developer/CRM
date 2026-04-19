"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormData } from "@/lib/validations/customer";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit:       (data: CustomerFormData) => Promise<void>;
  isSubmitting:   boolean;
  submitLabel?:   string;
}

export function CustomerForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Save Customer" }: CustomerFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    resolver:      zodResolver(customerSchema),
    defaultValues: { customerType: "INDIVIDUAL", isActive: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            {...register("name")}
            error={errors.name?.message}
            placeholder="Ram Sharma"
          />
          <Select
            label="Customer Type"
            {...register("customerType")}
            error={errors.customerType?.message}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
          </Select>
          <Input
            label="Phone Number *"
            {...register("phone")}
            error={errors.phone?.message}
            placeholder="98XXXXXXXX"
          />
          <Input
            label="Alternate Phone"
            {...register("altPhone")}
            error={errors.altPhone?.message}
            placeholder="97XXXXXXXX"
          />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            placeholder="ram@example.com"
          />
          <Input
            label="Business Name"
            {...register("businessName")}
            error={errors.businessName?.message}
            placeholder="Sharma Enterprises"
          />
        </div>
      </div>

      {/* Address */}
      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address"
            {...register("address")}
            error={errors.address?.message}
            placeholder="Thamel, Kathmandu"
            className="sm:col-span-2"
          />
          <Input
            label="City / District"
            {...register("city")}
            error={errors.city?.message}
            placeholder="Kathmandu"
          />
          <Input
            label="PAN / VAT Number"
            {...register("panVat")}
            error={errors.panVat?.message}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Notes & Status */}
      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Notes & Status</h3>
        <div className="space-y-4">
          <Textarea
            label="Notes"
            {...register("notes")}
            error={errors.notes?.message}
            placeholder="Any important notes about this customer..."
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="rounded" />
            <span className="text-sm text-gray-700">Active customer</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
