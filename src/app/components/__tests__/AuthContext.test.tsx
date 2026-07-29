import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";

vi.mock("@/lib/supabase", () => ({
  authenticateUser: vi.fn(),
  setSessionToken: vi.fn(),
  logoutSession: vi.fn(),
  getSessionToken: vi.fn(() => null),
  supabase: null,
}));

const TestConsumer: React.FC = () => {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? "logged-in" : "logged-out"}</div>
      <div data-testid="loading-status">{loading ? "loading" : "idle"}</div>
      <div data-testid="user-name">{user?.name ?? "none"}</div>
      <button data-testid="login-btn" onClick={() => login("admin", "admin123")}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts unauthenticated with null user", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });

  it("logs in successfully and updates state", async () => {
    const { authenticateUser } = await import("@/lib/supabase");
    vi.mocked(authenticateUser).mockResolvedValue({
      success: true,
      token: "mock-token",
      user: {
        id: 1,
        name: "Admin Payatas",
        username: "admin",
        role: "Admin",
        email: "admin@payatas.gov.ph",
        status: "Active",
        last_active: "Jul 29, 2026 16:00",
        initials: "AP",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
      expect(screen.getByTestId("user-name").textContent).toBe("Admin Payatas");
    });
  });

  it("shows error message on failed login", async () => {
    const { authenticateUser } = await import("@/lib/supabase");
    vi.mocked(authenticateUser).mockResolvedValue({
      success: false,
      error: "Invalid credentials",
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
    });
  });

  it("logs out and clears state", async () => {
    const { authenticateUser } = await import("@/lib/supabase");
    vi.mocked(authenticateUser).mockResolvedValue({
      success: true,
      token: "mock-token",
      user: {
        id: 1, name: "Admin Payatas", username: "admin", role: "Admin",
        email: "admin@payatas.gov.ph", status: "Active", last_active: "", initials: "AP",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId("login-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
    });

    await userEvent.click(screen.getByTestId("logout-btn"));
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });
});
