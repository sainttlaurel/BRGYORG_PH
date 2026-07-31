import React, { useState, useEffect, useCallback } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf, Sun, Moon, Menu, X, Phone, Mail, MapPin,
  ChevronDown, Facebook, Twitter, Youtube,
  Shield, FileText, Users, Megaphone, MessageSquare, Vote,
  Heart, AlertTriangle, Home, Info, Award, Store, Building2, FileCheck
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useData } from "./DataContext";

const navLinks = [
  { path: "/", label: "Home", icon: Home },
  { path: "/about", label: "About", icon: Info },
  { path: "/officials", label: "Officials", icon: Award },
  { path: "/services", label: "Services", icon: FileText },
  { path: "/announcements", label: "Announcements", icon: Megaphone },
];

const moreLinks = [
  { path: "/registry", label: "Public Registry", icon: Users },
  { path: "/document-application", label: "Request Document", icon: FileText },
  { path: "/citizens-voice", label: "Citizens' Voice", icon: MessageSquare },
  { path: "/community-vote", label: "Community Vote", icon: Vote },
  { path: "/volunteer", label: "Volunteer", icon: Heart },
  { path: "/report-concern", label: "Report a Concern", icon: AlertTriangle },
  { path: "/business-registry", label: "Business Reg", icon: Store },
  { path: "/projects", label: "Projects", icon: Building2 },
  { path: "/clearance-request", label: "Get Clearance", icon: FileCheck },
  { path: "/contact", label: "Contact Us", icon: Phone },
];

const PublicLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { barangayInfo } = useData();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  useEffect(() => {
    const dismissed = sessionStorage.getItem("disclaimer_dismissed");
    if (!dismissed) setShowDisclaimer(true);
  }, []);
  const dismissDisclaimer = useCallback(() => {
    setShowDisclaimer(false);
    sessionStorage.setItem("disclaimer_dismissed", "1");
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="bg-emerald-800 dark:bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="flex items-center gap-1.5"><Phone size={11} /> {barangayInfo.hotline}</span>
            <span className="hidden sm:flex items-center gap-1.5"><Mail size={11} /> {barangayInfo.email}</span>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 truncate ml-2"><MapPin size={11} /> {barangayInfo.address}</span>
        </div>
      </div>

      {/* Disclaimer banner */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-center">
                <strong>Disclaimer:</strong> This website is a prototype and is not affiliated with Barangay Payatas or any government agency. All content is for demonstration purposes only.
              </div>
              <button onClick={dismissDisclaimer} className="shrink-0 p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 dark:bg-emerald-950/85 backdrop-blur-xl shadow-md border-b border-emerald-100 dark:border-emerald-900"
            : "bg-white/70 dark:bg-emerald-950/70 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/img/logo-payatas.png" alt="Payatas Logo" className="w-9 h-9 rounded-xl object-contain shadow-sm group-hover:shadow-emerald-300 transition-shadow" />
            <div className="leading-tight">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-[0.95rem] leading-tight">Payatas Ledger</div>
              <div className="text-emerald-600/70 dark:text-emerald-500/70 text-[0.65rem] leading-none">Barangay Payatas</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              >
                More <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-emerald-950 rounded-xl shadow-xl border border-emerald-100 dark:border-emerald-800 overflow-hidden"
                  >
                    {moreLinks.map(link => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                              : "text-foreground/80 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                          }`
                        }
                      >
                        <link.icon size={14} className="text-emerald-500" />
                        {link.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-all"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <Link
              to="/admin/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm hover:shadow-emerald-300 dark:hover:shadow-emerald-900"
            >
              <Shield size={14} /> Staff Portal
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-border bg-white dark:bg-emerald-950"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {[...navLinks, ...moreLinks].map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium"
                          : "text-foreground/70 hover:bg-muted"
                      }`
                    }
                  >
                    <link.icon size={15} className="text-emerald-500" />
                    {link.label}
                  </NavLink>
                ))}
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-900 mt-1"
                >
                  <Shield size={15} /> Staff Portal
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 dark:bg-emerald-950 text-emerald-100">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Leaf size={16} className="text-emerald-300" />
                </div>
                <span className="font-bold text-white">Payatas Ledger</span>
              </div>
              <p className="text-sm text-emerald-200/70 leading-relaxed mb-3">
                {barangayInfo.name}, {barangayInfo.municipality}. Serving our community with transparency and dedication.
              </p>
              <div className="flex gap-2">
                <a href="https://www.facebook.com/quezoncitygovernment" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-300 transition-colors"><Facebook size={14} /></a>
                <a href="https://twitter.com/QuezonCityGov" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-300 transition-colors"><Twitter size={14} /></a>
                <a href="https://www.youtube.com/@quezoncitygovernment" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-300 transition-colors"><Youtube size={14} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-sm text-emerald-200/70">
                {[
                  { to: "/services", label: "All Services" },
                  { to: "/document-application", label: "Request a Document" },
                  { to: "/registry", label: "Public Registry" },
                  { to: "/report-concern", label: "Report a Concern" },
                  { to: "/volunteer", label: "Volunteer" },
                ].map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="hover:text-emerald-300 transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Barangay */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Barangay</h4>
              <ul className="space-y-2 text-sm text-emerald-200/70">
                {[
                  { to: "/about", label: "About Us" },
                  { to: "/officials", label: "Officials" },
                  { to: "/announcements", label: "Announcements" },
                  { to: "/community-vote", label: "Community Vote" },
                  { to: "/citizens-voice", label: "Citizens' Voice" },
                ].map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="hover:text-emerald-300 transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-emerald-200/70">
                <li className="flex items-start gap-2"><Phone size={13} className="mt-0.5 shrink-0 text-emerald-400" />{barangayInfo.hotline}</li>
                <li className="flex items-start gap-2"><Mail size={13} className="mt-0.5 shrink-0 text-emerald-400" />{barangayInfo.email}</li>
                <li className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0 text-emerald-400" />{barangayInfo.address}</li>
                <li className="mt-3 text-xs text-emerald-200/50">{barangayInfo.officeHours}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-emerald-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-200/40">
            <span>© 2026 {barangayInfo.name}. All rights reserved.</span>
            <span>Powered by Payatas Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
