"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader }   from "@/components/ui/PageHeader";
import { Button }       from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader }   from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate, getCustomerTypeLabel, getPaymentMethodLabel } from "@/lib/utils";
import { buildWhatsAppLink, buildReminderMessage } from "@/lib/reminders";

export default function CustomerDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,   setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    setDeleting(false);
    router.push("/customers");
  };

  if (loading) return <PageLoader />;
  if (!data?.id) return <div className="text-gray-500">Customer not found.</div>;

  const { stats, sales } = data;

  // WhatsApp reminder link for this customer (if they have outstanding dues)
  const overdueOrDueSales = (sales ?? []).filter((s: any) => (s.dueAmount ?? 0) > 0);
  const totalDueHere      = stats?.totalDue ?? 0;
  const waReminderLink    = (totalDueHere > 0 && data.phone)
    ? buildWhatsAppLink(
        data.phone,
        buildReminderMessage({
          customerName:  data.name,
          invoiceNumber: overdueOrDueSales.length === 1
            ? overdueOrDueSales[0].invoiceNumber
            : `${overdueOrDueSales.length} invoices`,
          dueAmount:     totalDueHere,
        })
      )
    : "";

  return (
    <div className="max-w-4xl space-y-6 mx-auto">
      {/* Header */}
      <PageHeader
        title={data.name}
        description={data.businessName ?? (data.city ? `${data.city}` : "Customer details")}
        action={
          <div className="flex gap-2 flex-wrap">
            {waReminderLink && (
              <a
                href={waReminderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-green-100 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L0 24l6.335-1.658A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.963-1.346l-.356-.212-3.761.984.999-3.659-.232-.375A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Remind
              </a>
            )}
            <Link href={`/customers/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Purchases", value: stats.totalSales, fmt: (v: any) => v },
          { label: "Total Amount",    value: stats.totalAmount, fmt: formatCurrency },
          { label: "Total Paid",      value: stats.totalPaid,   fmt: formatCurrency },
          { label: "Outstanding Due", value: stats.totalDue,    fmt: formatCurrency },
        ].map(({ label, value, fmt }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Contact & Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          {[
            ["Phone",         data.phone],
            ["Alternate Phone",data.altPhone ?? "—"],
            ["Email",         data.email ?? "—"],
            ["Type",          getCustomerTypeLabel(data.customerType)],
            ["Address",       data.address ?? "—"],
            ["City",          data.city ?? "—"],
            ["PAN/VAT",       data.panVat ?? "—"],
            ["Status",        data.isActive ? "Active" : "Inactive"],
            ["Customer Since",formatDate(data.createdAt)],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-2">
              <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
              <span className="text-gray-800 font-medium">{val}</span>
            </div>
          ))}
        </div>
        {data.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-700">
            <span className="font-medium text-yellow-700">Notes: </span>{data.notes}
          </div>
        )}
      </div>

      {/* Purchase History */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Purchase History</h3>
          <Link href={`/sales/new?customerId=${id}`}>
            <Button size="sm">+ New Sale</Button>
          </Link>
        </div>
        {sales?.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No purchases yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale: any) => {
                const saleLink = (sale.dueAmount > 0 && data.phone)
                  ? buildWhatsAppLink(data.phone, buildReminderMessage({
                      customerName:  data.name,
                      invoiceNumber: sale.invoiceNumber,
                      dueAmount:     sale.dueAmount,
                      repayDate:     sale.nextRepayDate ? formatDate(sale.nextRepayDate) : null,
                    }))
                  : "";
                return (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/sales/${sale.id}`} className="text-primary-600 hover:underline font-medium">
                      {sale.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDate(sale.saleDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(sale.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(sale.dueAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={sale.paymentStatus} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {saleLink ? (
                      <a href={saleLink} target="_blank" rel="noopener noreferrer"
                        title="Send WhatsApp reminder"
                        className="inline-flex items-center text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L0 24l6.335-1.658A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.963-1.346l-.356-.212-3.761.984.999-3.659-.232-.375A9.818 9.818 0 1112 21.818z"/>
                        </svg>
                        WA
                      </a>
                    ) : null}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message="Customers with existing sales will be deactivated. Are you sure?"
      />
    </div>
  );
}
