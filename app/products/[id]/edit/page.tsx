"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/products/ProductForm";
import { PageHeader }  from "@/components/ui/PageHeader";
import { Button }      from "@/components/ui/Button";
import { PageLoader }  from "@/components/ui/LoadingSpinner";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product,    setProduct]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => { setProduct(d); setLoading(false); });
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/products/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to update");
      setSubmitting(false);
    } else {
      router.push(`/products/${id}`);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`Edit: ${product?.name}`}
        action={<Link href={`/products/${id}`}><Button variant="outline">Cancel</Button></Link>}
      />
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <ProductForm
        defaultValues={product}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitLabel="Update Product"
      />
    </div>
  );
}
