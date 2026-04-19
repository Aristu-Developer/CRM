"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { PageLoader }   from "@/components/ui/LoadingSpinner";

export default function EditCustomerPage() {
  const { id }                = useParams<{ id: string }>();
  const router                = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { setCustomer(d); setLoading(false); });
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to update");
      setSubmitting(false);
    } else {
      router.push(`/customers/${id}`);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`Edit: ${customer?.name}`}
        action={<Link href={`/customers/${id}`}><Button variant="outline">Cancel</Button></Link>}
      />
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <CustomerForm
        defaultValues={customer}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitLabel="Update Customer"
      />
    </div>
  );
}
