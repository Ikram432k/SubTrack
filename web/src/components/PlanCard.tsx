import type { Plan } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function PlanCard({ plan }: { plan: Plan }){
    return(
        <div className="rounded border p-4">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p>{formatPrice(plan.price_monthly, plan.currency)} / month</p>
            <p>{formatPrice(plan.price_yearly, plan.currency)} / year</p>
        </div>
    );
}