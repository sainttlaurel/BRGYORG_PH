import React from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, FileText, Shield, Megaphone, TrendingUp, Clock,
  CheckCircle, Plus, ArrowRight, WifiOff,
} from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";

// ── activity feed stays as static audit log until audit table is wired ─────
const activityFeed = [
  { user: "Carlos Ramos",  action: "Approved", detail: "Certificate of Indigency for Maria Santos",       time: "2 mins ago",  icon: CheckCircle, color: "text-emerald-500" },
  { user: "Juan Dela Cruz",action: "Updated",  detail: "BLT-2026-042 – Hearing scheduled Jul 25",        time: "15 mins ago", icon: Shield,      color: "text-amber-500"  },
  { user: "Grace Fernan",  action: "Released", detail: "Barangay Clearance for Pedro Dela Cruz",         time: "1 hour ago",  icon: FileText,    color: "text-sky-500"    },
  { user: "Carlos Ramos",  action: "Published",detail: "COVID-19 Vaccination Announcement",              time: "2 hours ago", icon: Megaphone,   color: "text-purple-500" },
  { user: "IT Admin",      action: "Updated",  detail: "Certificate template for Barangay Clearance",   time: "Yesterday",   icon: TrendingUp,  color: "text-orange-500" },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    approved:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
    processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
    ready:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    released:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[status] || "bg-muted text-muted-foreground";
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { residents, docRequests, blotter, announcements, barangayInfo, loading, offline } = useData();

  // Compute chart data from live records
  const docTypeCounts: Record<string, number> = {};
  docRequests.forEach(d => {
    const t = d.type || "Unknown";
    docTypeCounts[t] = (docTypeCounts[t] || 0) + 1;
  });
  const chartColors = ["#059669","#0ea5e9","#16a34a","#38bdf8","#84cc16","#f59e0b","#f97316","#ef4444"];
  const documentTypeStats = Object.entries(docTypeCounts).map(([type, count], i) => ({
    type, count, fill: chartColors[i % chartColors.length],
  }));

  const ageGroups = { "0-17": 0, "18-59": 0, "60+": 0 };
  residents.forEach(r => {
    if (r.age < 18) ageGroups["0-17"]++;
    else if (r.age < 60) ageGroups["18-59"]++;
    else ageGroups["60+"]++;
  });
  const residentDemographics = [
    { name: "Ages 0-17", value: ageGroups["0-17"], fill: "#22c55e" },
    { name: "Ages 18-59", value: ageGroups["18-59"], fill: "#059669" },
    { name: "Ages 60+", value: ageGroups["60+"], fill: "#0ea5e9" },
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthCounts: Record<string, { requests: number; released: number }> = {};
  months.forEach(m => { monthCounts[m] = { requests: 0, released: 0 }; });
  docRequests.forEach(d => {
    const parsed = new Date(d.date);
    const m = d.date && !isNaN(parsed.getTime()) ? months[parsed.getMonth()] : undefined;
    if (m && monthCounts[m]) {
      monthCounts[m].requests++;
      if (d.status === "released") monthCounts[m].released++;
    }
  });
  const requestsTimeline = months.map(month => ({ month, ...monthCounts[month] }));

  // Live KPI values derived from real data
  const pendingCount  = docRequests.filter(d => d.status === "pending").length;
  const blotterActive = blotter.filter(b => b.status === "ongoing").length;

  const kpis = [
    { label: "Total Residents",  value: loading ? "…" : residents.length.toLocaleString(), change: "Registered in system",  icon: Users,     color: "from-emerald-500 to-emerald-600", bgLight: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800" },
    { label: "Pending Requests", value: loading ? "…" : String(pendingCount),              change: "Awaiting processing",   icon: FileText,  color: "from-amber-500 to-amber-600",    bgLight: "bg-amber-50 dark:bg-amber-950",    border: "border-amber-200 dark:border-amber-800"   },
    { label: "Active Blotter",   value: loading ? "…" : String(blotterActive),             change: "Open cases",            icon: Shield,    color: "from-red-500 to-red-600",        bgLight: "bg-red-50 dark:bg-red-950",        border: "border-red-200 dark:border-red-800"       },
    { label: "Announcements",    value: loading ? "…" : String(announcements.length),      change: "Published",             icon: Megaphone, color: "from-sky-500 to-sky-600",        bgLight: "bg-sky-50 dark:bg-sky-950",        border: "border-sky-200 dark:border-sky-800"       },
  ];

  const recentRequests = docRequests.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Offline banner */}
      {offline && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
          <WifiOff size={14} className="shrink-0" />
          Showing cached data — Supabase unreachable.
        </div>
      )}

      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.4rem" }}>
            Good morning, {user?.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {barangayInfo.name} · {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          to="/admin/requests"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={14} /> New Request
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className={`rounded-2xl border p-5 ${kpi.bgLight} ${kpi.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-sm`}>
                  <kpi.icon size={17} className="text-white" />
                </div>
                <TrendingUp size={13} className="text-muted-foreground opacity-50" />
              </div>
              <div className="font-bold text-2xl text-foreground">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{kpi.change}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — monthly trend (uses mock timeline until reports table is added) */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">Document Requests – 2026</h2>
            <span className="text-xs text-muted-foreground">Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={requestsTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="relGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Area type="monotone" dataKey="requests" stroke="#059669" strokeWidth={2} fill="url(#reqGrad)" name="Requests" />
              <Area type="monotone" dataKey="released" stroke="#0ea5e9" strokeWidth={2} fill="url(#relGrad)" name="Released" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Resident Demographics</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={residentDemographics} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {residentDemographics.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {residentDemographics.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4">Document Types Requested – 2026</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={documentTypeStats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="type" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {documentTypeStats.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent requests — live */}
        <div className="lg:col-span-3 bg-white dark:bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">Recent Requests</h2>
            <Link to="/admin/requests" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground font-mono">{req.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{req.resident} · {req.type}</div>
                </div>
                <div className="text-xs text-muted-foreground ml-3 shrink-0">{req.date}</div>
              </div>
            ))}
            {recentRequests.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No requests yet.</p>
            )}
          </div>
        </div>

        {/* Activity feed — static until audit logs RPC is wired */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Activity Feed</h2>
          <div className="space-y-3">
            {activityFeed.map((act, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <act.icon size={14} className={`mt-0.5 shrink-0 ${act.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground"><strong>{act.user}</strong> {act.action}</div>
                  <div className="text-xs text-muted-foreground truncate">{act.detail}</div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
