import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db";

export async function resetDb() {
  await pool.query("TRUNCATE subscriptions, invoices, users RESTART IDENTITY CASCADE");
}

export async function createUserAndLogin(
  email = "user@example.com",
  password = "password123"
) {
  await request(app).post("/auth/register").send({ email, password });
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.token as string;
}

export async function createAdminAndLogin(
  email = "admin@example.com",
  password = "password123"
) {
  await request(app).post("/auth/register").send({ email, password });
  await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.token as string;
}