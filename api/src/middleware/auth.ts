import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { error } from "node:console";

export interface AuthRequest extends Request {
    user?: {id: number, role: string}
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction){
    const header = req.headers.authorization;
    if(!header || !header.startsWith("Bearer ")){
        return res.status(401).json({error:"Missing token"});
    }
    try{
        const payload = jwt.verify(
            header.slice(7),
            process.env.JWT_SECRET as string
        ) as jwt.JwtPayload;
        req.user = {id: Number(payload.sub), role: payload.role};
        next();
    }catch(err){
        res.status(401).json({error: "Invalid or expired token"});
    }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}