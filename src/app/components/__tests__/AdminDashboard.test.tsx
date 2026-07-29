import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AdminDashboard from "../AdminDashboard";
import type { AppData } from "@/lib/useSupabaseData";

const mockUseData = vi.hoisted(() => vi.fn());

vi.mock("../DataContext", () => ({
  useData: mockUseData,
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ user: { name: "Admin", role: "admin" } }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

vi.mock("motion/react", () => ({
  motion: { div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div> },
}));

const mockData: AppData = {
  residents: [],
  docRequests: [],
  blotter: [],
  announcements: [],
  officials: [],
  polls: [],
  auditLogs: [
    { id: "1", user: "Admin", action: "Created announcement", target: "Test", detail: "Test announcement", date: "2026-07-29", module: "Announcements", ip: "" },
  ],
  adminUsers: [],
  barangayInfo: { name: "Barangay Payatas", municipality: "Quezon City", province: "Metro Manila", region: "NCR", captain: "John Doe", established: "1980", population: 0, households: 1500, area: "5 sq km", hotline: "", emergency: "", email: "", address: "", officeHours: "", vision: "", mission: "", history: "" },
  reports: [],
  suggestions: [],
  volunteers: [],
  services: [],
  loading: false,
  offline: false,
  refetch: () => {},
};

describe("AdminDashboard", () => {
  it("renders the greeting with user name", () => {
    mockUseData.mockReturnValue(mockData);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    expect(screen.getAllByText(/Admin/).length).toBeGreaterThan(0);
  });

  it("shows activity feed from audit logs", () => {
    mockUseData.mockReturnValue(mockData);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText("Activity Feed")).toBeInTheDocument();
    expect(screen.getByText(/Created announcement/)).toBeInTheDocument();
  });

  it("shows offline banner when offline", () => {
    mockUseData.mockReturnValue({ ...mockData, offline: true });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Supabase unreachable/i)).toBeInTheDocument();
  });
});
