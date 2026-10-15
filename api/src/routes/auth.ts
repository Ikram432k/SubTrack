import {Router, Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import { pool } from "../db";

export const authRouter = Router();

authRouter.post('/register',async(req, res)=>{
    const {email, password} = req.body;

    if(!email || !password || password.length < 0){
        return res
            .status(400)
            .json({ error: "Email and a password of at least 8 characters are required" });
    }
    try{
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
            [email.toLowerCase(), passwordHash]
        );
        res.status(200).json(result.rows[0]);
    }catch(err: any){
        if(err.code === "23505"){
            return res.status(409).json({ error: "Email already registered" });
        }
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
})