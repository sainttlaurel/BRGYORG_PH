import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Eye, X, Calendar, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { updateBlotterStatus, insertBlotterCase } from "@/lib/supabaseWrite";
import { TableLoading, TableEmpty } from "./ui/table-state";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { blotterSchema } from "@/lib/validations";
import ColumnToggle from "@/app/components/ui/column-toggle";
import { useColumnVisibility } from "@/lib/hooks/useColumnVisibility";

const statusColors: Record<string, string> = {
  ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  settled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
  referred: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
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

const AdminBlotter: React.FC = () => {
  const { blotter, loading } = useData();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<typeof blotter[0] | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const cases = React.useMemo(() =>
    blotter.map(c => {
      const s = statusOverrides[c.id];
      return s ? { ...c, status: s } : c;
    }),
    [blotter, statusOverrides]
  );
  const [showForm, setShowForm] = useState(false);
  const [caseForm, setCaseForm] = useState({ complainant: "", respondent: "", incident: "", location: "", summary: "" });

  const filtered = cases.filter(c =>
    (statusFilter === "All" || c.status === statusFilter) &&
    (debouncedQuery === "" || 
      c.id.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
      c.complainant.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
      c.respondent.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      c.incident.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);

  const vis = useColumnVisibility([
    { key: "id", label: "Case ID" },
    { key: "status", label: "Status" },
    { key: "incident", label: "Incident" },
    { key: "complainant", label: "Complainant" },
    { key: "respondent", label: "Respondent" },
    { key: "date", label: "Date & Time" },
    { key: "handler", label: "Handler" },
    { key: "summary", label: "Summary" },
    { key: "actions", label: "Actions" },
  ]);

  const updateStatus = async (id: string, newStatus: string) => {
    setStatusOverrides(o => ({ ...o, [id]: newStatus }));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: newStatus } : null);
    try {
      await updateBlotterStatus(id, newStatus, user?.name || "System");
      toast.success(`Case ${id} updated to ${newStatus}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update status"); }
  };

  const handleCreateCase = async () => {
    const parsed = blotterSchema.safeParse(caseForm);
    if (!parsed.success) { parsed.error.issues.forEach(i => toast.error(i.message)); return; }
    try {
      const now = new Date();
      await insertBlotterCase({
        ...caseForm,
        date: now.toISOString().split("T")[0] ?? "",
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        handler: "Barangay",
      }, user?.name || "System");
      setCaseForm({ complainant: "", respondent: "", incident: "", location: "", summary: "" });
      setShowForm(false);
      toast.success("Blotter case created");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create case"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Blotter Records</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{cases.length} total cases · {total} showing</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => csvExport(cases.map(c => ({
            ID: c.id, Status: c.status, Incident: c.incident, Complainant: c.complainant,
            Respondent: c.respondent, "Date Filed": c.date, Location: c.location, Handler: c.handler
          })), "blotter-cases.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
            <Plus size={14} /> New Case
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">New Blotter Case</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input id="case-complainant" name="complainant" type="text" value={caseForm.complainant} onChange={e => setCaseForm(f => ({ ...f, complainant: e.target.value }))} placeholder="Complainant *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
              <input id="case-respondent" name="respondent" type="text" value={caseForm.respondent} onChange={e => setCaseForm(f => ({ ...f, respondent: e.target.value }))} placeholder="Respondent" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input id="case-incident" name="incident" type="text" value={caseForm.incident} onChange={e => setCaseForm(f => ({ ...f, incident: e.target.value }))} placeholder="Incident type *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
              <input id="case-location" name="location" type="text" value={caseForm.location} onChange={e => setCaseForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            </div>
            <textarea id="case-summary" name="summary" rows={2} value={caseForm.summary} onChange={e => setCaseForm(f => ({ ...f, summary: e.target.value }))} placeholder="Description…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleCreateCase} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">Create Case</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-cases" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cases…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
        </div>
        <ColumnToggle columns={vis.columns} hidden={vis.hidden} onToggle={vis.toggle} onReset={vis.showAll} />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())} className="rounded" />
            All
          </label>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "ongoing", "settled", "referred", "closed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${statusFilter === s ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{selectedIds.size} selected</span>
          <button onClick={async () => { for (const id of selectedIds) { try { await updateStatus(id, "settled"); } catch {} } toast.success(`${selectedIds.size} cases marked settled`); setSelectedIds(new Set()); }} className="px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium transition-colors">
            Mark Settled
          </button>
          <button onClick={() => csvExport(filtered.filter(c => selectedIds.has(c.id)).map(c => ({ ID: c.id, Status: c.status, Incident: c.incident, Complainant: c.complainant, Respondent: c.respondent, Date: c.date, Location: c.location, Handler: c.handler })), `selected-cases.csv`)} className="px-3 py-1 rounded-lg bg-white dark:bg-card border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            Export Selected
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 rounded-lg bg-white dark:bg-card border border-border text-xs text-muted-foreground hover:bg-muted transition-colors ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* Sort */}
      <div className="flex gap-2 mb-3">
        <span className="text-xs text-muted-foreground self-center">Sort by:</span>
        {["date", "complainant", "incident", "status"].map(key => (
          <button key={key} onClick={() => toggleSort(key as keyof typeof cases[0])} className={`px-2 py-1 rounded-lg text-xs border transition-all ${sortKey === key ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        ))}
      </div>

      {/* Cases */}
      <div className="space-y-3">
        {loading ? (
          <TableLoading />
        ) : filtered.length === 0 ? (
          <TableEmpty message="No blotter cases found" />
        ) : (paginatedData.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="pt-1"><input type="checkbox" checked={selectedIds.has(c.id)} onChange={e => { const next = new Set(selectedIds); if (e.target.checked) next.add(c.id); else next.delete(c.id); setSelectedIds(next); }} className="rounded" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-bold text-foreground text-sm font-mono ${vis.isHidden("id") ? "hidden" : ""}`}>{c.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[c.status]} ${vis.isHidden("status") ? "hidden" : ""}`}>{c.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ${vis.isHidden("incident") ? "hidden" : ""}`}>{c.incident}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <div className={`${vis.isHidden("complainant") ? "hidden" : ""}`}>
                      <div className="text-xs text-muted-foreground">Complainant</div>
                      <div className="text-xs font-medium text-foreground">{c.complainant}</div>
                    </div>
                    <div className={`${vis.isHidden("respondent") ? "hidden" : ""}`}>
                      <div className="text-xs text-muted-foreground">Respondent</div>
                      <div className="text-xs font-medium text-foreground">{c.respondent}</div>
                    </div>
                    <div className={`${vis.isHidden("date") ? "hidden" : ""}`}>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={10} /> Date</div>
                      <div className="text-xs font-medium text-foreground">{c.date} · {c.time}</div>
                    </div>
                    <div className={`${vis.isHidden("handler") ? "hidden" : ""}`}>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Users size={10} /> Handler</div>
                      <div className="text-xs font-medium text-foreground">{c.handler}</div>
                    </div>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2 ${vis.isHidden("summary") ? "hidden" : ""}`}>{c.summary}</p>
                  {c.hearingDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Calendar size={11} /> Next Hearing: {c.hearingDate}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(c)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 text-xs transition-colors shrink-0 ${vis.isHidden("actions") ? "hidden" : ""}`}>
                  <Eye size={13} /> View
                </button>
              </div>
            </div>
          </motion.div>
        )))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3 mt-4 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-border bg-white dark:bg-card text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>{page} of {totalPages} pages ({total} total)</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setPage(1)} disabled={page <= 1} className="px-2 py-1 rounded-lg border border-border text-xs disabled:opacity-30 hover:bg-muted transition-colors">First</button>
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-2 py-1 rounded-lg border border-border text-xs disabled:opacity-30 hover:bg-muted transition-colors">Prev</button>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-2 py-1 rounded-lg border border-border text-xs disabled:opacity-30 hover:bg-muted transition-colors">Next</button>
          <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 rounded-lg border border-border text-xs disabled:opacity-30 hover:bg-muted transition-colors">Last</button>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-foreground">Case Details</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="font-bold font-mono text-foreground">{selected.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[selected.status]}`}>{selected.status}</span>
                  </div>
                  {[
                    { label: "Incident Type", value: selected.incident },
                    { label: "Complainant", value: selected.complainant },
                    { label: "Respondent", value: selected.respondent },
                    { label: "Date & Time", value: `${selected.date} · ${selected.time}` },
                    { label: "Location", value: selected.location },
                    { label: "Handler", value: selected.handler },
                    { label: "Hearing Date", value: selected.hearingDate || "Not scheduled" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between border-b border-border pb-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium text-foreground text-right max-w-48">{item.value}</span>
                    </div>
                  ))}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Summary</div>
                    <p className="text-xs text-foreground leading-relaxed">{selected.summary}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selected.status === "ongoing" && (
                    <>
                      <button onClick={() => updateStatus(selected.id, "settled")} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">Mark Settled</button>
                      <button onClick={() => updateStatus(selected.id, "referred")} className="w-full py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-all">Refer to Police</button>
                    </>
                  )}
                  <button onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>Case Record - ${selected.id}</title><style>body{font-family:sans-serif;padding:40px;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;margin-top:16px;}td,th{border:1px solid #ccc;padding:8px 10px;text-align:left;font-size:13px;}th{background:#f5f5f5;}.lbl{font-weight:600;color:#555;width:140px;}</style></head><body><h1>Blotter Case Record</h1><table><tr><td class="lbl">Case ID</td><td>${selected.id}</td></tr><tr><td class="lbl">Status</td><td>${selected.status}</td></tr><tr><td class="lbl">Incident Type</td><td>${selected.incident}</td></tr><tr><td class="lbl">Complainant</td><td>${selected.complainant}</td></tr><tr><td class="lbl">Respondent</td><td>${selected.respondent}</td></tr><tr><td class="lbl">Date & Time</td><td>${selected.date} · ${selected.time}</td></tr><tr><td class="lbl">Location</td><td>${selected.location}</td></tr><tr><td class="lbl">Handler</td><td>${selected.handler}</td></tr><tr><td class="lbl">Hearing Date</td><td>${selected.hearingDate || "Not scheduled"}</td></tr></table><h3>Summary</h3><p>${selected.summary}</p></body></html>`); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 300); }} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                    Print Case Record
                  </button>
                </div>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBlotter;
