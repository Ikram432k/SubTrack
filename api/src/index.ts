import express, {Request, Response} from 'express';
import userRoutes from './routes/userRoutes';
import { authRouter } from './routes/auth';
import { Pool } from 'pg';
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

app.use('/auth',authRouter)
app.use('/user',userRoutes);
//Add GET /health returning { "status": "ok" }. 


app.listen(PORT,()=>{
    console.log(`server is running at http://localhost:${PORT}`);
})



