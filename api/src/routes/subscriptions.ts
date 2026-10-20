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
        "INSERT INTO invoices (subscription_id, amount, currency, status, description) VALUES ($1, $2, $3, 'paid', $4)",
        [subscription.id, amount, plan.currency, `Subscribed to ${plan.name} (${billingCycle})`]
        );

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

subscriptionRouter.patch("/plan", requireAuth, async (req: AuthRequest, res) => {
  const { planId, billingCycle } = req.body;
  if (!Number.isInteger(planId) || !["monthly", "yearly"].includes(billingCycle)) {
    return res
      .status(400)
      .json({ error: "planId and billingCycle (monthly or yearly) are required" });
  }

  const priceOf = (p: any, cycle: string) =>
    cycle === "monthly" ? p.price_monthly : p.price_yearly;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock this user's active subscription so two requests can't change it at once
    const currentResult = await client.query(
      `SELECT s.id, s.plan_id, s.billing_cycle, s.current_period_start,
              s.next_billing_date, p.price_monthly, p.price_yearly
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active'
       FOR UPDATE OF s`,
      [req.user!.id]
    );
    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No active subscription" });
    }

    if (current.plan_id === planId && current.billing_cycle === billingCycle) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "You are already on this plan" });
    }

    const planResult = await client.query(
      "SELECT id, name, price_monthly, price_yearly, currency FROM plans WHERE id = $1",
      [planId]
    );
    const newPlan = planResult.rows[0];
    if (!newPlan) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Plan not found" });
    }

    const newAmount = priceOf(newPlan, billingCycle);
    const cycleChanged = billingCycle !== current.billing_cycle;
    let charge = 0;
    let description: string;

    if (!cycleChanged) {
      // Same cycle: charge the prorated difference for the rest of the period
      const oldAmount = priceOf(current, current.billing_cycle);
      const periodStart = new Date(current.current_period_start).getTime();
      const periodEnd = new Date(current.next_billing_date).getTime();
      const remaining = Math.max(periodEnd - Date.now(), 0);
      const fraction = periodEnd > periodStart ? remaining / (periodEnd - periodStart) : 0;

      charge = Math.max(Math.round((newAmount - oldAmount) * fraction), 0);
      description =
        newAmount > oldAmount
          ? `Upgrade to ${newPlan.name} (prorated)`
          : `Downgrade to ${newPlan.name}`;
    } else {
      // Cycle changed: start a fresh period and charge the full new price
      charge = newAmount;
      description = `Switch to ${newPlan.name} (${billingCycle})`;
    }

    const interval = billingCycle === "monthly" ? "1 month" : "1 year";
    const updated = await client.query(
      `UPDATE subscriptions
       SET plan_id = $2,
           billing_cycle = $3,
           current_period_start = CASE WHEN $4::boolean THEN now() ELSE current_period_start END,
           next_billing_date = CASE WHEN $4::boolean THEN now() + $5::interval ELSE next_billing_date END
       WHERE id = $1
       RETURNING id, plan_id, billing_cycle, status, current_period_start, next_billing_date`,
      [current.id, newPlan.id, billingCycle, cycleChanged, interval]
    );

    if (charge > 0) {
      await client.query(
        `INSERT INTO invoices (subscription_id, amount, currency, status, description)
         VALUES ($1, $2, $3, 'paid', $4)`,
        [current.id, charge, newPlan.currency, description]
      );
    }

    await client.query("COMMIT");
    res.json({ subscription: updated.rows[0], plan: newPlan.name, charged: charge, description });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    client.release();
  }
});

//View, billing history, cancel
subscriptionRouter.get("/me",requireAuth,async(req: AuthRequest,res)=>{
    const result = await pool.query(
        `SELECT s.id, s.status, s.billing_cycle, s.started_at, s.next_billing_date,
        p.name AS plan, p.currency
        FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.user_id = $1 AND s.status = 'active'`,
        [req.user!.id]
    )
    res.json(result.rows[0] || null);
})

subscriptionRouter.get("/invoices", requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT i.id, i.amount, i.currency, i.status, i.created_at, i.description
     FROM invoices i
     JOIN subscriptions s ON s.id = i.subscription_id
     WHERE s.user_id = $1
     ORDER BY i.created_at DESC`,
    [req.user!.id]
  );
  res.json(result.rows);
});

subscriptionRouter.post("/cancel", requireAuth, async (req: AuthRequest, res) => {
  const { reason } = req.body;
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = now(), cancel_reason = $2
     WHERE user_id = $1 AND status = 'active'
     RETURNING id, status, cancelled_at, cancel_reason`,
    [req.user!.id, reason || null]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "No active subscription" });
  }
  res.json(result.rows[0]);
});