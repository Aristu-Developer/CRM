"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/products/ProductForm";
import { PageHeader }  from "@/components/ui/PageHeader";
import { Button }      from "@/components/ui/Button";
import { useBusinessConfig }    from "@/components/providers/BusinessConfigProvider";
import { getDefaultProductUnit } from "@/lib/business-config";

export default function NewProductPage() {
  const router = useRouter();
  const config = useBusinessConfig();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/products", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to create product");
      setSubmitting(false);
    } else {
      const created = await res.json();
      router.push(`/products/${created.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Product"
        description="Add a new product to your inventory"
        action={<Link href="/products"><Button variant="outline">Cancel</Button></Link>}
      />
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <ProductForm
        defaultValues={{ unit: getDefaultProductUnit(config.subType) }}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
