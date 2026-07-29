import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Leaf, Eye, EyeOff, Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthContext";

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const errMsg = await login(loginId, password);
    setLoading(false);
    if (!errMsg) {
      navigate("/admin/dashboard");
    } else {
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left - nature illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-800 via-emerald-700 to-sky-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background SVG */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="400" r="300" fill="url(#lg-glow)" />
            <path d="M0 600 Q150 500 300 560 Q450 620 600 520 L600 800 L0 800 Z" fill="#22c55e" opacity="0.4" />
            <path d="M0 680 Q150 600 300 650 Q450 700 600 620 L600 800 L0 800 Z" fill="#16a34a" opacity="0.5" />
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={`translate(${(i * 80) + 20}, ${300 + Math.sin(i) * 80})`} opacity="0.5">
                <polygon points="0,-40 -20,10 20,10" fill="#15803d" />
                <polygon points="0,-60 -26,5 26,5" fill="#16a34a" />
              </g>
            ))}
          </svg>
        </div>

        <Link to="/" className="flex items-center gap-2 z-10 hover:opacity-80 transition-opacity">
          <ArrowLeft size={16} /> Back to Public Site
        </Link>

        <div className="z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
              <Leaf size={22} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-xl">Payatas Ledger</div>
              <div className="text-emerald-200/70 text-sm">Barangay Payatas</div>
            </div>
          </div>
          <h2 className="font-bold mb-4" style={{ fontSize: "2rem", lineHeight: 1.2 }}>
            Secure Staff Portal
          </h2>
          <p className="text-emerald-200/70 leading-relaxed max-w-xs">
            Authorized personnel only. All access is logged and monitored in compliance with government data privacy regulations.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
              <Shield size={14} /> Role-based access control
            </div>
            <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
              <Shield size={14} /> End-to-end encrypted session
            </div>
            <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
              <Shield size={14} /> Full activity audit logging
            </div>
          </div>
        </div>

        <div className="text-emerald-200/40 text-xs z-10">
        © 2026 Barangay Payatas · DICT-Compliant Platform
        </div>
      </div>

      {/* Right - login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400">Payatas Ledger</div>
              <div className="text-muted-foreground text-xs">Admin Portal</div>
            </div>
          </div>

          <h1 className="font-bold text-foreground mb-1" style={{ fontSize: "1.6rem" }}>Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to access the Admin Portal</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="loginId" className="block text-sm text-muted-foreground mb-1.5">Username or Email</label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="admin or you@brgy.ph"
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 pr-11 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-md transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating…
                </span>
              ) : (
                <>
                  <Shield size={16} /> Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Sign in with your username or email</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Contact the system administrator if you have not been given credentials.</p>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Return to Public Website
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
