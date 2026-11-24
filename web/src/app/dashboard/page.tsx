"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSubscription,
  changePlan,
  getMySubscription,
  getPlans,
  subscribe,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";
import PlanPicker from "@/components/PlanPicker";
import SubscriptionCard from "@/components/SubscriptionCard";

export default function DashboardPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: getMySubscription,
    enabled: ready,
  });
  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    enabled: ready,
  });
  const subscription = subscriptionQuery.data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const selectMutation = useMutation({
    mutationFn: ({ planId, cycle }: { planId: number; cycle: "monthly" | "yearly" }) =>
      subscription ? changePlan(planId, cycle) : subscribe(planId, cycle),
    onSuccess: refresh,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelSubscription(reason),
    onSuccess: refresh,
  });

  if (!ready || subscriptionQuery.isPending || plansQuery.isPending) {
    return <p className="p-8">Loading...</p>;
  }

  const error =
    subscriptionQuery.error ||
    plansQuery.error ||
    selectMutation.error ||
    cancelMutation.error;

  return (
    <main className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Your subscription</h1>
        <button
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
          className="underline"
        >
          Log out
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-600">
          {(error as Error).message}
        </p>
      )}

      {subscription ? (
        <SubscriptionCard
          subscription={subscription}
          onCancel={(reason) => cancelMutation.mutate(reason)}
          cancelling={cancelMutation.isPending}
        />
      ) : (
        <p>You have no active subscription. Choose a plan below.</p>
      )}

      <section>
        <h2 className="mb-3 text-xl">{subscription ? "Change plan" : "Choose a plan"}</h2>
        <PlanPicker
          plans={plansQuery.data ?? []}
          current={subscription}
          busy={selectMutation.isPending}
          onSelect={(planId, cycle) => selectMutation.mutate({ planId, cycle })}
        />
      </section>

      <Link href="/dashboard/invoices" className="underline">
        View billing history
      </Link>
    </main>
  );
}