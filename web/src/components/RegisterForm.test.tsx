import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";
import * as api from "@/lib/api";

jest.mock("@/lib/api");
const mockedRegister = api.register as jest.MockedFunction<typeof api.register>;
const mockedLogin = api.login as jest.MockedFunction<typeof api.login>;

async function fillAndSubmit(email: string, password: string, confirm: string) {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RegisterForm", () => {
  it("registers, logs in and calls onSuccess with the token", async () => {
    mockedRegister.mockResolvedValue({ id: 1, email: "a@example.com" });
    mockedLogin.mockResolvedValue("fake-token");
    const onSuccess = jest.fn();
    render(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit("a@example.com", "password123", "password123");

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("fake-token"));
    expect(mockedRegister).toHaveBeenCalledWith("a@example.com", "password123");
  });

  it("blocks the submit when the passwords do not match", async () => {
    render(<RegisterForm />);

    await fillAndSubmit("a@example.com", "password123", "different123");

    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("shows the server error when the email is already taken", async () => {
    mockedRegister.mockRejectedValue(new Error("Email already registered"));
    render(<RegisterForm />);

    await fillAndSubmit("a@example.com", "password123", "password123");

    expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered");
  });
});