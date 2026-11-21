import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db";

beforeEach(async()=>{
    await pool.query("TRUNCATE subscriptions, invoices, users RESTART IDENTITY CASCADE");
})

afterAll(async()=>{
    await pool.end();
})

describe('auth',()=>{
    const creds = { email: "a@xample.com", password: "password123" };

    it("registers a new user", async()=>{
        const res = await request(app).post("/auth/register").send(creds);
        expect(res.status).toBe(201);
        expect(res.body).toEqual({id: expect.any(Number), email: creds.email})
    });

    it("rejects a duplicate email with 409", async()=>{
        await request(app).post("/auth/register").send(creds);
        const res = await request(app).post("/auth/register").send(creds);
        expect(res.status).toBe(409);
    });

    it("rejects a wrong password with 401", async()=>{
        await request(app).post("/auth/register").send(creds);
        const res = await request(app).post("/auth/login").send({email: creds.email, password: "wrongpass1"});
        expect(res.status).toBe(401);
    });

    it("it returns a token that opens a protected route", async()=>{
        await request(app).post("/auth/register").send(creds);
        const login = await request(app).post("/auth/login").send(creds);
        const res = await request(app)
            .get("/me")
            .set("Authorization", `Bearer ${login.body.token}`);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(creds.email);
    });

    it("blocks a protected route without a token", async()=>{
        const res = await request(app).get("/me");
        expect(res.status).toBe(401);
    });

    it("rejects a shot password with 400", async()=>{
        const res = await request(app).post("/auth/register").send({ email: "b@example.com", password: "short" });
        expect(res.status).toBe(400);
    });

    it("rejects login with a missing email with 400", async()=>{
        const res = await request(app).post("/auth/login").send({ password: "password123" });
        expect(res.status).toBe(400);
    });
})