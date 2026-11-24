"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function InvoicesPage() {
  const ready = useRequireAuth();
  const { data, isPending, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
    enabled: ready,
  });

  if (!ready || isPending) {
    return <p className="p-8">Loading...</p>;
  }
  if (error) {
    return (
      <p role="alert" className="p-8 text-red-600">
        {(error as Error).message}
      </p>
    );
  }
  if (!data || data.length === 0) {
    return <p className="p-8">No invoices yet.</p>;
  }

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl">Billing history</h1>
      <table className="w-full max-w-2xl text-left">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td>{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
              <td>{inv.description ?? "Payment"}</td>
              <td>{formatPrice(inv.amount, inv.currency)}</td>
              <td>{inv.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}