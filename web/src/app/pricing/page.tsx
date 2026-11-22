import PlanCard from "@/components/PlanCard";
import { getPlans } from "@/lib/api";

export default async function PricingPage(){
    const plans = await getPlans();

    return(
        <main className="p-8">
            <h1 className="mb-6 text-2xl">Pricing</h1>
            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan)=>(
                    <PlanCard key={plan.id} plan={plan}/>
                ))}
            </div>
        </main>
    );
}