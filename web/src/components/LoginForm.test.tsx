import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";
import * as api from "@/lib/api";

jest.mock("@/lib/api");
const mockedLogin = api.login as jest.MockedFunction<typeof api.login>;

describe("LoginForm", () => {
  it("calls onSuccess with the token after a valid login", async () => {
    mockedLogin.mockResolvedValue("fake-token");
    const onSuccess = jest.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("fake-token"));
    expect(mockedLogin).toHaveBeenCalledWith("a@example.com", "password123");
  });

  it("shows an error message when login fails", async () => {
    mockedLogin.mockRejectedValue(new Error("Invalid email or password"));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});