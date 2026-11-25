import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db";
import { createUserAndLogin, resetDb } from "./helpers";
const PRO = 2;
const TEAM = 3;

let token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  await resetDb();
  token = await createUserAndLogin();
});

afterAll(async () => {
  await pool.end();
});

describe("subscriptions", () => {
  it("requires a token", async () => {
    const res = await request(app).get("/subscriptions/me");
    expect(res.status).toBe(401);
  });

  it("returns null when there is no active subscription", async () => {
    const res = await request(app).get("/subscriptions/me").set(auth());
    expect(res.status).toBe(200);
    expect(res.text).toBe("null");
  });

  it("subscribes to a plan and creates an invoice", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    expect(res.status).toBe(201);
    expect(res.body.plan).toBe("Pro");
    expect(res.body.amountPaid).toBe(49900);

    const invoices = await request(app).get("/subscriptions/invoices").set(auth());
    expect(invoices.body).toHaveLength(1);
    expect(invoices.body[0].amount).toBe(49900);
    expect(invoices.body[0].description).toBe("Subscribed to Pro (monthly)");
  });

  it("rejects a second active subscription with 409", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const res = await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: TEAM, billingCycle: "monthly" });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid billing cycle with 400", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "weekly" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown plan", async () => {
    const res = await request(app)
        .post("/subscriptions")
        .set(auth())
        .send({ planId: 999, billingCycle: "monthly" });
    expect(res.status).toBe(404);
  });

  it("charges a prorated amount when upgrading within the same cycle", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const res = await request(app)
      .patch("/subscriptions/plan")
      .set(auth())
      .send({ planId: TEAM, billingCycle: "monthly" });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe("Team");
    expect(res.body.charged).toBeGreaterThan(99000);
    expect(res.body.charged).toBeLessThanOrEqual(100000);
  });

  it("does not charge for a downgrade", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: TEAM, billingCycle: "monthly" });
    const res = await request(app)
      .patch("/subscriptions/plan")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    expect(res.status).toBe(200);
    expect(res.body.charged).toBe(0);
  });

  it("charges the full price when switching to yearly", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const res = await request(app)
      .patch("/subscriptions/plan")
      .set(auth())
      .send({ planId: PRO, billingCycle: "yearly" });
    expect(res.status).toBe(200);
    expect(res.body.charged).toBe(499000);
  });

  it("rejects a change to the plan the user is already on", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const res = await request(app)
      .patch("/subscriptions/plan")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    expect(res.status).toBe(400);
  });

  it("cancels the subscription and stores the reason", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const res = await request(app)
      .post("/subscriptions/cancel")
      .set(auth())
      .send({ reason: "Too expensive" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    expect(res.body.cancel_reason).toBe("Too expensive");

    const current = await request(app).get("/subscriptions/me").set(auth());
    expect(current.text).toBe("null");
  });

  it("returns 404 when cancelling without an active subscription", async () => {
    const res = await request(app).post("/subscriptions/cancel").set(auth()).send({});
    expect(res.status).toBe(404);
  });

  it("only shows a user their own invoices", async () => {
    await request(app)
      .post("/subscriptions")
      .set(auth())
      .send({ planId: PRO, billingCycle: "monthly" });
    const otherToken = await createUserAndLogin("other@example.com");
    const res = await request(app)
      .get("/subscriptions/invoices")
      .set({ Authorization: `Bearer ${otherToken}` });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});