import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Download, Plus, Pencil, Trash2, ThumbsUp, Heart } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { insertProject, updateProject, deleteProject, genId } from "@/lib/supabaseWrite";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { useColumnVisibility } from "@/lib/hooks/useColumnVisibility";
import type { ColumnDef } from "@/lib/hooks/useColumnVisibility";
import { TableLoading, TableEmpty } from "./ui/table-state";
import { ConfirmDialog } from "./ui/confirm-dialog";
import ColumnToggle from "@/app/components/ui/column-toggle";
import type { Project } from "@/lib/useSupabaseData";

const statusConfig: Record<string, { color: string; label: string }> = {
  Planned: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", label: "Planned" },
  Ongoing: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "Ongoing" },
  Completed: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", label: "Completed" },
};

const categories = ["Infrastructure", "Health", "Education", "Livelihood", "Environment", "Social Welfare", "Others"];

const tableColumns: ColumnDef[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "budget", label: "Budget" },
  { key: "progress", label: "Progress" },
];

function csvExport(data: Record<string, string>[], filename: string) {
  const headers = Object.keys(data[0] ?? {});
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const emptyForm = { title: "", category: "Infrastructure", budget: "", progress: "", description: "", target_date: "" };

const AdminProjects: React.FC = () => {
  const { projects, refetch, loading } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = projects.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (debouncedQuery === "" || r.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.category.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.id.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);
  const vis = useColumnVisibility(tableColumns);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateProject(id, { status: newStatus }, user?.name || "System");
      toast.success(`Project status: ${newStatus}`);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
  };

  const getWorkflowActions = (status: string) => {
    const next: Record<string, { label: string; next: string; color: string }[]> = {
      Planned: [{ label: "Start Project", next: "Ongoing", color: "bg-amber-600 hover:bg-amber-700 text-white" }],
      Ongoing: [
        { label: "Mark Completed", next: "Completed", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
        { label: "Revert to Planned", next: "Planned", color: "bg-blue-100 hover:bg-blue-200 text-blue-700" },
      ],
      Completed: [{ label: "Reopen", next: "Ongoing", color: "bg-amber-100 hover:bg-amber-200 text-amber-700" }],
    };
    return next[status] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const payload = {
        id: editing ? editing.id : genId("PRJ"),
        title: form.title,
        category: form.category,
        budget: form.budget ? Number(form.budget) : 0,
        progress: form.progress ? Math.min(100, Math.max(0, Number(form.progress))) : 0,
        description: form.description,
        target_date: form.target_date,
      };
      if (editing) {
        await updateProject(editing.id, payload, user?.name || "System");
        toast.success("Project updated");
      } else {
        await insertProject(payload, user?.name || "System");
        toast.success("Project created");
      }
      setShowForm(false); setEditing(null); setForm(emptyForm);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId, user?.name || "System");
      toast.success("Project deleted");
      if (selected?.id === deleteId) setSelected(null);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
    finally { setDeleteId(null); }
  };

  const formatBudget = (n: number) => "₱" + n.toLocaleString();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} total · {total} showing</p>
        </div>
        <div className="flex gap-2">
          <ColumnToggle columns={vis.columns} hidden={vis.hidden} onToggle={vis.toggle} onReset={vis.showAll} />
          <button onClick={() => csvExport(projects.map(r => ({ ID: r.id, Title: r.title, Category: r.category, Status: r.status, Budget: r.budget.toString(), Progress: r.progress + "%", "Target Date": r.target_date })), "projects.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus size={14} /> Add Project
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-projects" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "Planned", "Ongoing", "Completed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${statusFilter === s ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
              {s === "All" ? "All" : (statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-2 py-3 w-10"></th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("title") ? "hidden" : ""}`} onClick={() => toggleSort("title")}>Title{sortKey === "title" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none ${vis.isHidden("category") ? "hidden" : ""}`} onClick={() => toggleSort("category")}>Category{sortKey === "category" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("status") ? "hidden" : ""}`} onClick={() => toggleSort("status")}>Status{sortKey === "status" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell cursor-pointer select-none ${vis.isHidden("budget") ? "hidden" : ""}`} onClick={() => toggleSort("budget")}>Budget{sortKey === "budget" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell cursor-pointer select-none ${vis.isHidden("progress") ? "hidden" : ""}`} onClick={() => toggleSort("progress")}>Progress{sortKey === "progress" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><TableLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><TableEmpty message="No projects found" /></td></tr>
              ) : (paginatedData.map((proj) => {
                const st = statusConfig[proj.status];
                return (
                  <tr key={proj.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-2 py-3"></td>
                    <td className={`px-4 py-3 ${vis.isHidden("title") ? "hidden" : ""}`}>
                      <button onClick={() => setSelected(proj)} className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors text-left">{proj.title}</button>
                    </td>
                    <td className={`px-4 py-3 text-xs text-muted-foreground hidden md:table-cell ${vis.isHidden("category") ? "hidden" : ""}`}>{proj.category}</td>
                    <td className={`px-4 py-3 ${vis.isHidden("status") ? "hidden" : ""}`}>
                      {st && <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>}
                    </td>
                    <td className={`px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell font-mono ${vis.isHidden("budget") ? "hidden" : ""}`}>{formatBudget(proj.budget)}</td>
                    <td className={`px-4 py-3 hidden lg:table-cell ${vis.isHidden("progress") ? "hidden" : ""}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${proj.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{proj.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(proj); setForm({ title: proj.title, category: proj.category, budget: String(proj.budget), progress: String(proj.progress), description: proj.description, target_date: proj.target_date }); setShowForm(true); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(proj.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded-lg border border-border bg-white dark:bg-card text-xs">
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

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-foreground">{selected.title}</h2>
                    <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{selected.id}</span>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 mb-4">
                    {[
                      { label: "Category", value: selected.category },
                      { label: "Status", value: statusConfig[selected.status]?.label || selected.status },
                      { label: "Budget", value: formatBudget(selected.budget) },
                      { label: "Progress", value: `${selected.progress}%` },
                      { label: "Target Date", value: selected.target_date || "—" },
                      { label: "Created", value: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${selected.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 block text-right">{selected.progress}%</span>
                  </div>
                  {selected.description && (
                    <div className="mb-4">
                      <span className="text-xs text-muted-foreground">Description:</span>
                      <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{selected.description}</p>
                    </div>
                  )}
                  <div className="flex gap-3 mb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {selected.reactions.likes}</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> {selected.reactions.hearts}</span>
                  </div>
                  <div className="space-y-2">
                    {getWorkflowActions(selected.status).map(action => (
                      <button key={action.next} onClick={() => updateStatus(selected.id, action.next)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => { setShowForm(false); setEditing(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="p-6">
                  <h2 className="font-bold text-foreground mb-4">{editing ? "Edit Project" : "New Project"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="proj-title" className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                      <input id="proj-title" name="proj-title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="proj-category" className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                        <select id="proj-category" name="proj-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="proj-target" className="block text-xs font-medium text-muted-foreground mb-1">Target Date</label>
                        <input id="proj-target" name="proj-target" type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="proj-budget" className="block text-xs font-medium text-muted-foreground mb-1">Budget (₱)</label>
                        <input id="proj-budget" name="proj-budget" type="number" min="0" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      </div>
                      <div>
                        <label htmlFor="proj-progress" className="block text-xs font-medium text-muted-foreground mb-1">Progress (0–100%)</label>
                        <input id="proj-progress" name="proj-progress" type="number" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="proj-description" className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                      <textarea id="proj-description" name="proj-description" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
                        {submitting ? "Saving…" : editing ? "Update Project" : "Create Project"}
                      </button>
                      <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminProjects;
