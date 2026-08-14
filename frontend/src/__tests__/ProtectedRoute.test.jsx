import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../lib/AuthContext";
import { ProtectedRoute, PublicRoute } from "../components/auth/ProtectedRoute";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderWithAuth = (ui, { isAuthenticated = false } = {}) => {
  const queryClient = createQueryClient();
  localStorage.clear();
  if (isAuthenticated) {
    localStorage.setItem("accessToken", "fake-token");
    localStorage.setItem("user", JSON.stringify({ id: "1", name: "Test", email: "test@test.com", role: "superAdmin" }));
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{ui}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", async () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    );

    await screen.findByText(/login page/i);
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { isAuthenticated: true }
    );

    await screen.findByText(/protected content/i);
  });

  it("redirects when user role is not in allowedRoles", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "1", name: "Teacher", email: "t@test.com", role: "teacher" })
    );

    renderWithAuth(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["superAdmin"]}>
              <div>Admin Only</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { isAuthenticated: true }
    );

    // Should redirect since teacher is not in allowedRoles
    await screen.findByText(/login page/i);
  });
});

describe("PublicRoute", () => {
  it("renders children when not authenticated", async () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>Login Form</div>
            </PublicRoute>
          }
        />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    );

    await screen.findByText(/login form/i);
  });

  it("redirects to / when authenticated", async () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>Login Form</div>
            </PublicRoute>
          }
        />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>,
      { isAuthenticated: true }
    );

    await screen.findByText(/dashboard/i);
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });
});
