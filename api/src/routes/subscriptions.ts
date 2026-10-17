import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { count, error } from "node:console";

export const subscriptionRouter = Router();

subscriptionRouter.post("/", requireAuth, async(req: AuthRequest, res)=>{
    const {planId, billingCycle} = req.body;
    if(!Number.isInteger(planId) || !["monthly", "yearly"].includes(billingCycle)){
        return res.status(400).json({error: "planId and billingCycle (monthly or yearly) are required"});
    }

    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const planResult = await client.query(
            "SELECT id, name, price_monthly, price_yearly, currency FROM plans WHERE id = $1",
            [planId]
        );
        const plan = planResult.rows[0];
        if(!plan){
            await client.query("ROLLBACK");
            return res.status(409).json({error: "Plan not found"});
        }
        
        const amount = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
        const interval = billingCycle === "monthly" ? "1 month" : "1 year";

        const subResult = await client.query(
            `INSERT INTO subscriptions (user_id, plan_id, billing_cycle, next_billing_date)
            VALUES ($1, $2, $3, now() + $4::interval)
            RETURNING id, plan_id, billing_cycle, status, started_at, next_billing_date`,
            [req.user!.id, plan.id, billingCycle, interval]
        )
        const subscription = subResult.rows[0];

        await client.query(
            "INSERT INTO invoices (subscription_id, amount, currency, status) VALUES ($1, $2, $3, 'paid')",
            [subscription.id, amount, plan.currency]
        )

        await client.query("COMMIT");
        res.status(201).json({ subscription, plan: plan.name, amountPaid: amount });
    }catch(err: any){
        await client.query("ROLLBACK");
        if(err.code === "23505"){
            return res.status(409).json({error: "You already have an active subscription"});
        }
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }finally{
        client.release();
    }
});