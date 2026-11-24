import { Erica_One } from "next/font/google";
import { clearToken, getToken } from "./auth";
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

export type Subscription = {
  id: number;
  status: string;
  billing_cycle: "monthly" | "yearly";
  started_at: string;
  next_billing_date: string;
  plan: string;
  currency: string;
};

export type Invoice = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description: string | null;
};

async function authFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired. Please log in again.");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const getMySubscription = (): Promise<Subscription | null> =>
  authFetch("/subscriptions/me");

export const getInvoices = (): Promise<Invoice[]> =>
  authFetch("/subscriptions/invoices");

export const subscribe = (planId: number, billingCycle: "monthly" | "yearly") =>
  authFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({ planId, billingCycle }),
});

export const changePlan = (planId: number, billingCycle: "monthly" | "yearly") =>
  authFetch("/subscriptions/plan", {
    method: "PATCH",
    body: JSON.stringify({ planId, billingCycle }),
});

export const cancelSubscription = (reason?: string) =>
  authFetch("/subscriptions/cancel", {
    method: "POST",
    body: JSON.stringify({ reason }),
});