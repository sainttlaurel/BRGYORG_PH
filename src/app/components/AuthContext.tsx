import React, { createContext, useContext, useState } from "react";
import { authenticateUser } from "@/lib/supabase";

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  /** Position / title displayed in the UI (maps to name when coming from the RPC) */
  position: string;
  initials: string;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  /** Async — calls the authenticate_user RPC. Returns error string on failure. */
  login: (emailOrUsername: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// ============================================================
// Fallback mock users (used when Supabase is unreachable)
// ============================================================

const MOCK_USERS: (AuthUser & { password: string })[] = [
  { id: 1, name: "Admin Payatas",  email: "admin",   password: "admin123",  role: "Admin",  position: "Administrator",       initials: "AP", status: "Active" },
  { id: 2, name: "Elena Garcia",   email: "egarcia", password: "staff123",  role: "Staff",  position: "Barangay Staff",       initials: "EG", status: "Active" },
  { id: 3, name: "Roberto Santos", email: "rsantos", password: "staff123",  role: "Staff",  position: "Barangay Staff",       initials: "RS", status: "Active" },
];

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType>({
  user:            null,
  login:           async () => "Not initialized",
  logout:          () => {},
  isAuthenticated: false,
  loading:         false,
});

export const useAuth = () => useContext(AuthContext);

const SESSION_KEY = "pl_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (emailOrUsername: string, password: string): Promise<string | null> => {
    setLoading(true);
    try {
      // Try the live Supabase RPC first
      const result = await authenticateUser(emailOrUsername, password);

      if (!result.success || !result.user) {
        setLoading(false);
        return result.error ?? "Invalid username or password.";
      }

      const u = result.user;
      const authUser: AuthUser = {
        id:       u.id,
        name:     u.name,
        email:    u.email,
        role:     u.role.toLowerCase(),
        position: u.role,           // role doubles as position until RBAC is wired
        initials: u.initials,
        status:   u.status,
      };

      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setLoading(false);
      return null; // success

    } catch (err: unknown) {
      const isOffline =
        err instanceof Error &&
        (err.message === "offline" || err.message.includes("Failed to fetch"));

      if (isOffline) {
        // Offline fallback — check mock users
        const found = MOCK_USERS.find(
          u => (u.email === emailOrUsername || u.name === emailOrUsername) &&
               u.password === password
        );
        if (found) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _pw, ...authUser } = found;
          setUser(authUser);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
          setLoading(false);
          return null; // success
        }
        setLoading(false);
        return "Invalid username or password.";
      }

      setLoading(false);
      return err instanceof Error ? err.message : "Authentication failed.";
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
