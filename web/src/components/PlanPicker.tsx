"use client";

import { useState } from "react";
import type { Plan, Subscription } from "@/lib/api";
import { formatPrice } from "@/lib/format";

type Cycle = "monthly" | "yearly";

export default function PlanPicker({
  plans,
  current,
  busy = false,
  onSelect,
}: {
  plans: Plan[];
  current: Subscription | null | undefined;
  busy?: boolean;
  onSelect: (planId: number, cycle: Cycle) => void;
}) {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["monthly", "yearly"] as Cycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            aria-pressed={cycle === c}
            className={`rounded border px-3 py-1 ${cycle === c ? "bg-black text-white" : ""}`}
          >
            {c === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
          const isCurrent = current?.plan === plan.name && current.billing_cycle === cycle;
          return (
            <div key={plan.id} className="rounded border p-4">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p>
                {formatPrice(price, plan.currency)} / {cycle === "monthly" ? "month" : "year"}
              </p>
              <button
                disabled={busy || isCurrent}
                onClick={() => onSelect(plan.id, cycle)}
                className="mt-3 rounded bg-black p-2 text-white disabled:opacity-50"
              >
                {isCurrent ? "Current plan" : current ? "Switch to this plan" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}