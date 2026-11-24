 "use client";

import { useState } from "react";
import type { Subscription } from "@/lib/api";

export default function SubscriptionCard({
  subscription,
  onCancel,
  cancelling = false,
}: {
  subscription: Subscription;
  onCancel: (reason: string) => void;
  cancelling?: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="rounded border p-4">
      <h2 className="text-xl font-semibold">{subscription.plan}</h2>
      <p>Billed {subscription.billing_cycle}</p>
      <p>
        Next billing date:{" "}
        {new Date(subscription.next_billing_date).toLocaleDateString("en-IN")}
      </p>
      <label htmlFor="reason" className="mt-3 block">
        Reason for cancelling (optional)
      </label>
      <input
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded border p-2"
      />
      <button
        onClick={() => onCancel(reason)}
        disabled={cancelling}
        className="ml-2 rounded border border-red-600 p-2 text-red-600"
      >
        {cancelling ? "Cancelling..." : "Cancel subscription"}
      </button>
    </div>
  );
}