import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderWithProviders = (ui) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Login Page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the login form with email and password fields", () => {
    renderWithProviders(<Login />);

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays demo credentials section", () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/superadmin@vidyaloop.in/)).toBeInTheDocument();
  });

  it("allows typing in email and password fields", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email or username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("toggles password visibility when eye icon is clicked", async () => {
    renderWithProviders(<Login />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    await userEvent.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits the form with entered credentials", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email or username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "admin@test.com");
    await userEvent.type(passwordInput, "testpass");
    fireEvent.click(submitButton);

    // Form should attempt to submit (button shows loading state)
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it("shows error message on failed login", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email or username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "wrong@test.com");
    await userEvent.type(passwordInput, "wrongpass");
    fireEvent.click(submitButton);

    // After failed API call, error should appear
    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("disables form inputs while loading", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email or username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "admin@test.com");
    await userEvent.type(passwordInput, "testpass");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
