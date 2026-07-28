import React, { createContext, useContext, useState } from "react";
import { authenticateUser, setSessionToken, logoutSession } from "@/lib/supabase";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  position: string;
  initials: string;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (emailOrUsername: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

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
        position: u.role,
        initials: u.initials,
        status:   u.status,
      };

      if (result.token) {
        setSessionToken(result.token);
      }

      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setLoading(false);
      return null;

    } catch (err: unknown) {
      setLoading(false);
      return err instanceof Error ? err.message : "Authentication failed.";
    }
  };

  const logout = () => {
    logoutSession();
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
