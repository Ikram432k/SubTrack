import { Erica_One } from "next/font/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data.token as string;
}

export type Plan = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
}

export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/plans`, {next: {revalidate: 60}});
  if(!res.ok) throw Error("Could not laod plans");
  return res.json();
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { id: number; email: string };
}