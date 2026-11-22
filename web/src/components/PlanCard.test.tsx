import { render, screen } from "@testing-library/react";
import PlanCard from "./PlanCard";

it("it shows the plan name and prices",()=>{
    render(
        <PlanCard plan={{ id: 2, name: "Pro", price_monthly: 49900, price_yearly: 499000, currency: "INR" }} />
    );
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText(/₹499/)).toBeInTheDocument();
    expect(screen.getByText(/₹4,990/)).toBeInTheDocument();
});