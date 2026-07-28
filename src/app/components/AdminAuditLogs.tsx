import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Download, Clock, User } from "lucide-react";
import { useData } from "./DataContext";
import { TableLoading, TableEmpty } from "./ui/table-state";

const moduleColors: Record<string, string> = {
  Requests: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
  Announcements: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  Blotter: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Residents: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  Reports: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  Authentication: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
  Settings: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function csvExport(data: Record<string, string>[], filename: string) {
  const headers = Object.keys(data[0] ?? {});
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const AdminAuditLogs: React.FC = () => {
  const { auditLogs, loading } = useData();
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const modules = ["All", ...Array.from(new Set(auditLogs.map(l => l.module)))];

  const filtered = auditLogs.filter(l =>
    (moduleFilter === "All" || l.module === moduleFilter) &&
    (query === "" || l.user.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase()) || l.detail.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">System activity trail · {auditLogs.length} entries · {filtered.length} showing</p>
        </div>
        <button onClick={() => csvExport(filtered.map(l => ({ Timestamp: l.date, User: l.user, Action: l.action, Details: l.detail, Module: l.module })), "audit-logs.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Download size={14} /> Export
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search logs…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {modules.map(m => (
            <button key={m} onClick={() => setModuleFilter(m)} className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${moduleFilter === m ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : filtered.length === 0 ? (
        <TableEmpty message="No audit logs found" />
      ) : (
        <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Module</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} />
                        <span className="font-mono">{log.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <User size={11} className="text-muted-foreground" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate">{log.detail}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${moduleColors[log.module] || "bg-muted text-muted-foreground"}`}>{log.module}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Audit logs are retained for 3 years in compliance with government data retention policies.
      </div>
    </div>
  );
};

export default AdminAuditLogs;
