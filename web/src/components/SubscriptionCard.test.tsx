import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionCard from "./SubscriptionCard";

const subscription = {
  id: 1,
  status: "active",
  billing_cycle: "monthly" as const,
  started_at: "2026-11-01T00:00:00.000Z",
  next_billing_date: "2026-12-01T00:00:00.000Z",
  plan: "Pro",
  currency: "INR",
};

it("calls onCancel with the typed reason", async () => {
  const onCancel = jest.fn();
  render(<SubscriptionCard subscription={subscription} onCancel={onCancel} />);

  await userEvent.type(screen.getByLabelText(/reason/i), "Too expensive");
  await userEvent.click(screen.getByRole("button", { name: "Cancel subscription" }));

  expect(onCancel).toHaveBeenCalledWith("Too expensive");
});