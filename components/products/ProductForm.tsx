"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormData } from "@/lib/validations/product";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const BASE_UNITS = [
  "pcs", "kg", "gram", "litre", "ml",
  "meter", "yard", "feet",
  "box", "packet", "pair", "set", "dozen",
];

const PURCHASE_UNITS = [
  { value: "yard",   label: "Yard (yd)" },
  { value: "feet",   label: "Foot (ft)" },
  { value: "inch",   label: "Inch (in)" },
  { value: "meter",  label: "Meter (m)" },
  { value: "cm",     label: "Centimetre (cm)" },
  { value: "kg",     label: "Kilogram (kg)" },
  { value: "gram",   label: "Gram (g)" },
  { value: "lb",     label: "Pound (lb)" },
  { value: "oz",     label: "Ounce (oz)" },
  { value: "litre",  label: "Litre (L)" },
  { value: "ml",     label: "Millilitre (ml)" },
  { value: "pcs",    label: "Pieces (pcs)" },
  { value: "dozen",  label: "Dozen" },
];

// Common conversion factors: purchaseUnit → baseUnit → factor
const PRESETS: Record<string, Record<string, number>> = {
  yard:  { meter: 0.9144, feet: 3, cm: 91.44 },
  feet:  { meter: 0.3048, cm: 30.48 },
  inch:  { meter: 0.0254, cm: 2.54 },
  cm:    { meter: 0.01 },
  gram:  { kg: 0.001 },
  lb:    { kg: 0.453592, gram: 453.592 },
  oz:    { kg: 0.028350, gram: 28.350 },
  ml:    { litre: 0.001 },
  dozen: { pcs: 12 },
};

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit:       (data: ProductFormData) => Promise<void>;
  isSubmitting:   boolean;
  submitLabel?:   string;
}

export function ProductForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Save Product" }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver:      zodResolver(productSchema),
    defaultValues: { unit: "pcs", reorderLevel: 10, isActive: true, ...defaultValues },
  });

  const watchedUnit         = watch("unit")             || "pcs";
  const watchedPurchaseUnit = watch("purchaseUnit")     || "";
  const watchedFactor       = watch("conversionFactor") || 0;

  // Suggest a preset factor when purchase unit changes
  const presetFactor = watchedPurchaseUnit
    ? (PRESETS[watchedPurchaseUnit]?.[watchedUnit] ?? null)
    : null;

  const showConversionPreview =
    watchedPurchaseUnit &&
    watchedFactor > 0 &&
    watchedPurchaseUnit !== watchedUnit;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Product Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            {...register("name")}
            error={errors.name?.message}
            placeholder="Rice (Premium)"
            className="sm:col-span-2"
          />
          <Input
            label="SKU / Code *"
            {...register("sku")}
            error={errors.sku?.message}
            placeholder="RICE-001"
          />
          <Input
            label="Category"
            {...register("category")}
            error={errors.category?.message}
            placeholder="Grocery"
          />
          <Textarea
            label="Description"
            {...register("description")}
            error={errors.description?.message}
            placeholder="Brief product description..."
            className="sm:col-span-2"
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Cost Price (Rs.)"
            type="number"
            step="0.01"
            leftAddon="Rs."
            {...register("costPrice")}
            error={errors.costPrice?.message}
            placeholder="0.00"
          />
          <Input
            label="Selling Price (Rs.) *"
            type="number"
            step="0.01"
            leftAddon="Rs."
            {...register("sellingPrice")}
            error={errors.sellingPrice?.message}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="font-medium text-gray-900 mb-4">Inventory</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Current Stock *"
            type="number"
            step="0.001"
            {...register("stock")}
            error={errors.stock?.message}
            placeholder="0"
          />
          <Input
            label="Reorder Level"
            type="number"
            {...register("reorderLevel")}
            error={errors.reorderLevel?.message}
            placeholder="10"
          />
          <Select label="Base Unit" {...register("unit")} error={errors.unit?.message}>
            {BASE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="rounded" />
            <span className="text-sm text-gray-700">Active product</span>
          </label>
        </div>
      </div>

      {/* ── Purchase Unit Conversion (optional) ────────────────────────────── */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900">Purchase Unit Conversion</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">optional</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Set this when your supplier delivers in a different unit than your stock unit.
          Example: buying in yards but tracking stock in meters.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Supplier / Purchase Unit
            </label>
            <select
              {...register("purchaseUnit")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Same as base unit (no conversion)</option>
              {PURCHASE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Conversion Factor
              <span className="ml-1 text-xs font-normal text-gray-400">
                (base units per purchase unit)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.00001"
                min="0.00001"
                placeholder="e.g. 0.9144"
                {...register("conversionFactor")}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {presetFactor && Math.abs((watchedFactor || 0) - presetFactor) > 0.00001 && (
                <button
                  type="button"
                  onClick={() => setValue("conversionFactor", presetFactor)}
                  className="px-3 py-2 text-xs rounded-lg border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 transition whitespace-nowrap"
                >
                  Use {presetFactor}
                </button>
              )}
            </div>
            {errors.conversionFactor && (
              <p className="text-xs text-red-600 mt-1">{errors.conversionFactor.message}</p>
            )}
          </div>

          {/* Live preview */}
          <div className="h-full flex items-end pb-0.5">
            {showConversionPreview ? (
              <div className="w-full rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                <p className="text-xs text-blue-600 font-medium">
                  1 {watchedPurchaseUnit} = {watchedFactor} {watchedUnit}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  100 {watchedPurchaseUnit} → {(100 * watchedFactor).toFixed(4)} {watchedUnit} stock
                </p>
              </div>
            ) : watchedPurchaseUnit && watchedPurchaseUnit !== watchedUnit ? (
              <p className="text-xs text-gray-400 italic">Enter a conversion factor to see the preview</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
