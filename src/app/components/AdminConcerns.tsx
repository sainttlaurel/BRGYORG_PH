import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Search, X, ChevronDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { updateReportStatus } from "@/lib/supabaseWrite";
import { TableLoading } from "./ui/table-state";
import type { ReportItem } from "@/lib/useSupabaseData";

const urgencyColor: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const pendingCfg = { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" } as const;
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: pendingCfg,
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const statuses = ["pending", "reviewing", "resolved", "dismissed"];

const AdminConcerns: React.FC = () => {
  const { reports, refetch, loading } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const getStatus = (r: ReportItem) => statusOverrides[r.id] ?? r.status;

  const filtered = reports.filter(r => {
    const st = getStatus(r);
    if (filterStatus !== "all" && st !== filterStatus) return false;
    if (filterUrgency !== "all" && r.urgency !== filterUrgency) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return r.id.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const updateStatus = async (id: string, newStatus: string) => {
    setStatusOverrides(o => ({ ...o, [id]: newStatus }));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: newStatus } : null);
    try {
      await updateReportStatus(id, newStatus, user?.name || "System");
      toast.success(`Report ${id} marked as ${newStatus}`);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update status"); }
  };

  const getWorkflowActions = (status: string) => {
    const next: Record<string, { label: string; next: string; color: string }[]> = {
      pending: [
        { label: "Start Review", next: "reviewing", color: "bg-sky-600 hover:bg-sky-700 text-white" },
        { label: "Dismiss", next: "dismissed", color: "bg-red-100 hover:bg-red-200 text-red-700" },
      ],
      reviewing: [
        { label: "Mark Resolved", next: "resolved", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
        { label: "Dismiss", next: "dismissed", color: "bg-red-100 hover:bg-red-200 text-red-700" },
      ],
      resolved: [],
      dismissed: [
        { label: "Reopen", next: "pending", color: "bg-amber-100 hover:bg-amber-200 text-amber-700" },
      ],
    };
    return next[status] || [];
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><TableLoading /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Reported Concerns</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{reports.length} total submissions</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-reports" name="search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        <div className="relative">
          <select id="filter-status" name="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
            <option value="all">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select id="filter-urgency" name="filterUrgency" value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
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
          {filtered.map(r => {
            const st = getStatus(r);
            const sc = statusConfig[st];
            return (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left bg-white dark:bg-card border border-border rounded-xl p-4 hover:border-orange-200 dark:hover:border-orange-700 transition-all">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{r.id}</span>
                    <span className="font-medium text-foreground text-sm truncate">{r.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColor[r.urgency] ?? urgencyColor.low}`}>{r.urgency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc?.color ?? pendingCfg.color}`}>{sc?.label ?? st}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <motion.div className="relative bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", duration: 0.4 }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-foreground">Concern Details</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-foreground font-mono">{selected.id}</span>
                    {(() => { const sc = statusConfig[getStatus(selected)]; return sc ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span> : null; })()}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: "Category", value: selected.category },
                      { label: "Urgency", value: selected.urgency.charAt(0).toUpperCase() + selected.urgency.slice(1) },
                      { label: "Location", value: selected.location },
                      { label: "Date Filed", value: new Date(selected.created_at).toLocaleDateString() },
                      { label: "Reporter", value: selected.reporter_name || "Anonymous" },
                      { label: "Contact", value: selected.reporter_contact || "—" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">Description</h3>
                  <div className="bg-muted rounded-xl p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.description}</div>
                </div>

                <div className="space-y-2">
                  {getWorkflowActions(getStatus(selected)).map(action => (
                    <button key={action.next} onClick={() => updateStatus(selected.id, action.next)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminConcerns;
