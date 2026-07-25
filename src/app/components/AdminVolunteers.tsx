import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Search, X, ChevronDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { updateVolunteerStatus } from "../../lib/supabaseWrite";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

const AdminVolunteers: React.FC = () => {
  const { volunteers, refetch } = useData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<typeof volunteers[0] | null>(null);

  const filtered = volunteers.filter(v => {
    if (filterStatus !== "all" && v.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return v.full_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.contact.includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateVolunteerStatus(id, status);
      toast.success(`Volunteer ${status}`);
      refetch();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch { toast.error("Failed to update"); }
  };

  const getWorkflowActions = (status: string) => {
    const next: Record<string, { label: string; next: string; color: string }[]> = {
      pending: [
        { label: "Accept", next: "accepted", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      ],
      accepted: [
        { label: "Mark Completed", next: "completed", color: "bg-blue-600 hover:bg-blue-700 text-white" },
      ],
      completed: [],
    };
    return next[status] || [];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Volunteer Registrations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{volunteers.length} total sign-ups</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or contact…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none">
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {(filterStatus !== "all" || search) && (
          <button onClick={() => { setFilterStatus("all"); setSearch(""); }} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted"><Filter size={12} /> Clear</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground"><Heart size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No volunteer registrations found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => (
            <button key={v.id} onClick={() => setSelected(v)} className="w-full text-left bg-white dark:bg-card border border-border rounded-xl p-4 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-foreground text-sm">{v.full_name}</span>
                  <span className="text-xs text-muted-foreground">{v.email || v.contact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(statusConfig[v.status] ?? statusConfig.pending).color}`}>{(statusConfig[v.status] ?? statusConfig.pending).label}</span>
                  <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
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
            <motion.div className="relative bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", duration: 0.4 }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-foreground">Volunteer Details</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-bold text-foreground">{selected.full_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${(statusConfig[selected.status] ?? statusConfig.pending).color}`}>{(statusConfig[selected.status] ?? statusConfig.pending).label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: "Email", value: selected.email || "—" },
                      { label: "Contact", value: selected.contact },
                      { label: "Date Registered", value: new Date(selected.created_at).toLocaleDateString() },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.body_conditions && (() => {
                  let parsed: Record<string, string> = {};
                  try { parsed = JSON.parse(selected.body_conditions); } catch { parsed = {}; }
                  const fields = Object.entries(parsed).filter(([, v]) => v);
                  if (fields.length === 0) return null;
                  return (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-2">Additional Information</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {fields.map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-border pb-1.5">
                            <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="text-xs font-medium text-foreground text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  {getWorkflowActions(selected.status).map(action => (
                    <button key={action.next} onClick={() => updateStatus(selected.id, action.next)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}>{action.label}</button>
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

export default AdminVolunteers;
