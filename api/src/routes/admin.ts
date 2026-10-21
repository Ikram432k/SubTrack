import { Router } from "express";
import { pool } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.get("/summary", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [byPlan, totals, monthly, users] = await Promise.all([
      pool.query(
        `SELECT p.name AS plan, s.billing_cycle, COUNT(*)::int AS active_subscriptions
         FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.status = 'active'
         GROUP BY p.name, s.billing_cycle
         ORDER BY p.name, s.billing_cycle`
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0)::int AS total_revenue, COUNT(*)::int AS paid_invoices
         FROM invoices
         WHERE status = 'paid'`
      ),
      pool.query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                SUM(amount)::int AS revenue
         FROM invoices
         WHERE status = 'paid'
         GROUP BY 1
         ORDER BY 1`
      ),
      pool.query(`SELECT COUNT(*)::int AS total_users FROM users`),
    ]);

    res.json({
      totalUsers: users.rows[0].total_users,
      totalRevenue: totals.rows[0].total_revenue,
      paidInvoices: totals.rows[0].paid_invoices,
      activeByPlan: byPlan.rows,
      revenueByMonth: monthly.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});