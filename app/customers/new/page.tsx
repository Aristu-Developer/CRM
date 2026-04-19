"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import type { CustomerFormData } from "@/lib/validations/customer";

export default function NewCustomerPage() {
  const router             = useRouter();
  const [error,  setError]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CustomerFormData) => {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/customers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create customer");
      setSubmitting(false);
    } else {
      const created = await res.json();
      router.push(`/customers/${created.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Customer"
        description="Create a new customer record"
        action={<Link href="/customers"><Button variant="outline">Cancel</Button></Link>}
      />
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <CustomerForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
