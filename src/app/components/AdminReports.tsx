import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Download, Users, FileText, Shield } from "lucide-react";
import { useData } from "./DataContext";

function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const first = rows[0];
  if (!first) return;
  const headers = Object.keys(first);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

const CHART_COLORS = ["#059669", "#0ea5e9", "#16a34a", "#38bdf8", "#84cc16", "#f59e0b"];

const AdminReports: React.FC = () => {
  const { residents, docRequests, blotter, loading } = useData();
  const [period, setPeriod] = useState("2026");

  const yearMatch = (d: string) => d?.startsWith(period);
  const docsPeriod = docRequests.filter(r => yearMatch(r.date));
  const blotsPeriod = blotter.filter(c => yearMatch(c.date));
  const residentsPeriod = residents.filter(r => yearMatch(r.registered));

  const releasedCount = docsPeriod.filter(r => r.status === "released").length;
  const approvedCount = docsPeriod.filter(r => r.status === "approved").length;
  const pendingCount = docsPeriod.filter(r => r.status === "pending").length;
  const processingCount = docsPeriod.filter(r => r.status === "processing").length;
  const readyCount = docsPeriod.filter(r => r.status === "ready").length;
  const totalRequests = docsPeriod.length;
  const totalResidents = residentsPeriod.length;
  const ongoingCases = blotsPeriod.filter(c => c.status === "ongoing").length;
  const settledCases = blotsPeriod.filter(c => c.status === "settled").length;

  const docTypeStats = Object.entries(
    docsPeriod.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([type, count], i) => ({ type, count, fill: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.count - a.count);

  const residentsWithValidDob = residentsPeriod.filter(r => r.dob && r.dob !== 'N/A' && !isNaN(new Date(r.dob).getTime()));
  const ageGroups = [
    { name: "Ages 0-17", value: residentsWithValidDob.filter(r => r.age >= 0 && r.age < 18).length, fill: "#22c55e" },
    { name: "Ages 18-59", value: residentsWithValidDob.filter(r => r.age >= 18 && r.age < 60).length, fill: "#059669" },
    { name: "Ages 60+", value: residentsWithValidDob.filter(r => r.age >= 60).length, fill: "#0ea5e9" },
  ];

  const summaryKPIs = [
    { label: "Total Residents", value: totalResidents.toLocaleString(), icon: Users, change: `${residents.filter(r => r.status === "Registered Voter").length} registered voters`, color: "text-emerald-600" },
    { label: "Total Requests", value: totalRequests.toLocaleString(), icon: FileText, change: `${releasedCount} released (${totalRequests ? Math.round(releasedCount / totalRequests * 100) : 0}%)`, color: "text-sky-600" },
    { label: "Blotter Cases", value: blotter.length.toLocaleString(), icon: Shield, change: `${ongoingCases} ongoing · ${settledCases} settled`, color: "text-amber-600" },
    { label: "Pending Requests", value: (pendingCount + processingCount).toLocaleString(), icon: FileText, change: `${readyCount} ready for release`, color: "text-purple-600" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Data insights for Barangay Payatas · live from database</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
            <option>2026</option>
            <option>2025</option>
          </select>
          <button
            onClick={() => exportCSV(
              docTypeStats.map(d => ({ Type: d.type, Count: d.count })),
              `doc-requests-${period}.csv`
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportCSV(
              docsPeriod.map(d => ({ ID: d.id, Resident: d.resident, Type: d.type, Status: d.status, Date: d.date })),
              `all-requests-${period}.csv`
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            <Download size={14} /> Export All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading data…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryKPIs.map(kpi => (
              <div key={kpi.label} className="bg-white dark:bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <kpi.icon size={16} className={kpi.color} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <div className="font-bold text-2xl text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.change}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground text-sm mb-4">Request Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: "Pending", count: pendingCount, fill: "#f59e0b" },
                  { name: "Approved", count: approvedCount, fill: "#0ea5e9" },
                  { name: "Processing", count: processingCount, fill: "#8b5cf6" },
                  { name: "Ready", count: readyCount, fill: "#84cc16" },
                  { name: "Released", count: releasedCount, fill: "#059669" },
                ].filter(d => d.count > 0)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {[{ name: "Pending", count: pendingCount, fill: "#f59e0b" },
                      { name: "Approved", count: approvedCount, fill: "#0ea5e9" },
                      { name: "Processing", count: processingCount, fill: "#8b5cf6" },
                      { name: "Ready", count: readyCount, fill: "#84cc16" },
                      { name: "Released", count: releasedCount, fill: "#059669" },
                    ].filter(d => d.count > 0).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground text-sm mb-4">Document Types Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={docTypeStats} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {docTypeStats.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground text-sm mb-4">Resident Age Distribution</h2>
              {ageGroups.some(g => g.value > 0) ? (
                <div className="flex items-center justify-around">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={ageGroups} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {ageGroups.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {ageGroups.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                        <div>
                          <div className="text-xs font-medium text-foreground">{d.value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{d.name}</div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2">
                      <div className="text-xs font-bold text-foreground">{totalResidents.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs">No demographic data available</div>
              )}
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground text-sm mb-4">Blotter Case Status</h2>
              <div className="flex items-center justify-center h-[180px]">
                <div className="grid grid-cols-2 gap-6 text-center">
                  {[
                    { label: "Ongoing", count: ongoingCases, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/40" },
                    { label: "Settled", count: settledCases, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900" },
                    { label: "Referred", count: blotsPeriod.filter(c => c.status === "referred").length, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/40" },
                    { label: "Closed", count: blotsPeriod.filter(c => c.status === "closed").length, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
