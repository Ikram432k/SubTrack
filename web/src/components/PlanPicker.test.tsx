import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanPicker from "./PlanPicker";

const plans = [
  { id: 1, name: "Free", price_monthly: 0, price_yearly: 0, currency: "INR" },
  { id: 2, name: "Pro", price_monthly: 49900, price_yearly: 499000, currency: "INR" },
];

describe("PlanPicker", () => {
  it("calls onSelect with the plan id and the monthly cycle by default", async () => {
    const onSelect = jest.fn();
    render(<PlanPicker plans={plans} current={null} onSelect={onSelect} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Subscribe" })[1]);

    expect(onSelect).toHaveBeenCalledWith(2, "monthly");
  });

  it("switches to yearly pricing and passes the yearly cycle", async () => {
    const onSelect = jest.fn();
    render(<PlanPicker plans={plans} current={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(screen.getByText(/₹4,990/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Subscribe" })[1]);

    expect(onSelect).toHaveBeenCalledWith(2, "yearly");
  });

  it("disables the button for the current plan", () => {
    const current = {
      id: 1,
      status: "active",
      billing_cycle: "monthly" as const,
      started_at: "",
      next_billing_date: "",
      plan: "Pro",
      currency: "INR",
    };
    render(<PlanPicker plans={plans} current={current} onSelect={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });
});