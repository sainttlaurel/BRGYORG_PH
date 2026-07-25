import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Search, X, ChevronDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { updateReportStatus } from "../../lib/supabaseWrite";
import type { ReportItem } from "../../lib/useSupabaseData";

const urgencyColor: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  reviewing: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const statuses = ["pending", "reviewing", "resolved", "dismissed"];

const AdminConcerns: React.FC = () => {
  const { reports, refetch } = useData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selected, setSelected] = useState<ReportItem | null>(null);

  const filtered = reports.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterUrgency !== "all" && r.urgency !== filterUrgency) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.id.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateReportStatus(id, status);
      toast.success(`Report marked as ${status}`);
      refetch();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Reported Concerns</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{reports.length} total submissions</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
            <option value="all">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
            <option value="all">All Urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {(filterStatus !== "all" || filterUrgency !== "all" || search) && (
          <button onClick={() => { setFilterStatus("all"); setFilterUrgency("all"); setSearch(""); }} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted">
            <Filter size={12} /> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No reports found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left bg-white dark:bg-card border border-border rounded-xl p-4 hover:border-orange-200 dark:hover:border-orange-700 transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{r.id}</span>
                  <span className="font-medium text-foreground text-sm truncate">{r.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColor[r.urgency] ?? urgencyColor.low}`}>{r.urgency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status] ?? statusColor.pending}`}>{r.status}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <motion.div className="relative bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", duration: 0.4 }}
            >
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"><X size={16} /></button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" /></div>
                <div>
                  <h2 className="font-bold text-foreground">{selected.category}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">Status</div>
                  <select value={selected.status} onChange={e => handleStatusChange(selected.id, e.target.value)} className={`text-sm font-medium rounded-lg px-2 py-1 border-0 ${statusColor[selected.status] ?? statusColor.pending}`}>
                    {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">Urgency</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColor[selected.urgency] ?? urgencyColor.low}`}>{selected.urgency}</span>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">Location</div>
                  <div className="text-sm font-medium text-foreground">{selected.location}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">Submitted</div>
                  <div className="text-sm font-medium text-foreground">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-xs text-muted-foreground mb-1.5">Description</div>
                <div className="text-sm text-foreground bg-muted rounded-xl p-3 leading-relaxed whitespace-pre-wrap">{selected.description}</div>
              </div>

              {(selected.reporter_name || selected.reporter_contact) && (
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">Reporter Info (Optional)</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selected.reporter_name && <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{selected.reporter_name}</span></div>}
                    {selected.reporter_contact && <div><span className="text-muted-foreground">Contact:</span> <span className="text-foreground font-medium">{selected.reporter_contact}</span></div>}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminConcerns;
