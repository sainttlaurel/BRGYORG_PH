import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf, LayoutDashboard, Users, FileText, Shield, Award,
  Megaphone, BarChart2, TrendingUp, AlertTriangle, UserCog, ScrollText,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell,
  Sun, Moon, Menu, X, Globe
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeProvider";
import { useData } from "./DataContext";

const navItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/residents", label: "Residents", icon: Users },
  { path: "/admin/requests", label: "Requests", icon: FileText },
  { path: "/admin/blotter", label: "Blotter", icon: Shield },
  { path: "/admin/officials", label: "Officials", icon: Award },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { path: "/admin/polls", label: "Polls", icon: BarChart2 },
  { path: "/admin/reports", label: "Analytics", icon: TrendingUp },
  { path: "/admin/concerns", label: "Concerns", icon: AlertTriangle },
  { path: "/admin/users", label: "Users", icon: UserCog },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

const roleColors: Record<string, string> = {
  captain: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  secretary: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  treasurer: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  staff: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { barangayInfo } = useData();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 p-4 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
          <Leaf size={16} className="text-emerald-300" />
        </div>
        {!collapsed && (
          <div>
              <div className="font-bold text-white" style={{ fontSize: "0.85rem" }}>Payatas Ledger</div>
            <div className="text-emerald-400/60" style={{ fontSize: "0.6rem" }}>Admin Portal</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-xs truncate">{user?.name}</div>
              <div className={`text-xs px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${roleColors[user?.role || "staff"]}`}>
                {user?.role}
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-emerald-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name.charAt(0)}
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-emerald-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground shrink-0 relative z-10"
        style={{ minHeight: "100vh" }}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white shadow-md hover:bg-emerald-600 transition-colors z-20"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-white dark:bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Menu size={18} />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">Admin Portal</span>
              <span className="text-muted-foreground text-sm"> — {barangayInfo.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-medium transition-colors"
            >
              <Globe size={13} /> Public Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
