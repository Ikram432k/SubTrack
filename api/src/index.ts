import "dotenv/config";
import express, {Request, Response} from 'express';
import userRoutes from './routes/userRoutes';
import { subscriptionRouter } from "./routes/subscriptions";
import { authRouter } from './routes/auth';
import { requireAuth, AuthRequest } from "./middleware/auth";
import { pool } from './db';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:3001" }));
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

app.use('/auth',authRouter);
app.use('/user',userRoutes);
app.use('/subscriptions',subscriptionRouter);
//Add GET /health returning { "status": "ok" }. 
app.get("/health", (_req, res) => {
res.json({ status: "ok" });
});

app.listen(PORT,()=>{
    console.log(`server is running at http://localhost:${PORT}`);
})



