import "dotenv/config";
import express, {Request, Response} from 'express';
import userRoutes from './routes/userRoutes';
import { subscriptionRouter,  } from "./routes/subscriptions";
import { authRouter } from './routes/auth';
import { requireAuth, AuthRequest } from "./middleware/auth";
import { pool } from './db';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.get('/',(req: Request, res: Response)=>{
    res.json({message:"Express with typoescript with live reload"});
})

app.get('/health/db', async(_req, res)=>{
    const result = await pool.query("SELECT 1 AS ok");
    res.json({ db: result.rows[0].ok === 1 ? "connected" : "error" });
})

app.get("/plans",async(req, res)=>{
    const result = await pool.query(
        "SELECT id, name, price_monthly, price_yearly, currency FROM plans ORDER BY id"
    )
    res.json(result.rows);
})

app.get("/me",requireAuth, async(req: AuthRequest, res)=>{
    const result = await pool.query(
        "SELECT id, email, role, created_at FROM users WHERE id = $1",
        [req.user!.id]
    );
    res.json(result.rows[0]);
})

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
    `SELECT i.id, i.amount, i.currency, i.status, i.created_at, p.name AS plan
     FROM invoices i
     JOIN subscriptions s ON s.id = i.subscription_id
     JOIN plans p ON p.id = s.plan_id
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

app.use('/auth',authRouter);
app.use('/user',userRoutes);
app.use('/subscriptions',subscriptionRouter);
//Add GET /health returning { "status": "ok" }. 


app.listen(PORT,()=>{
    console.log(`server is running at http://localhost:${PORT}`);
})



