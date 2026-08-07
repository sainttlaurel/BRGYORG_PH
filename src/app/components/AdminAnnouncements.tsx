import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion } from "motion/react";
import { Plus, Edit, Trash2, Search, Clock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { insertAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/supabaseWrite";
import { TableLoading, TableEmpty } from "./ui/table-state";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { announcementSchema } from "@/lib/validations";
import { ConfirmDialog } from "./ui/confirm-dialog";

const catColors: Record<string, string> = {
  Health: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  Governance: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  "Social Services": "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  Environment: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
  Livelihood: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
};

const AdminAnnouncements: React.FC = () => {
  const { announcements: liveAnnouncements, loading } = useData();
  const { user } = useAuth();
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});
  const announcements = React.useMemo(() =>
    liveAnnouncements.map(a => ({
      ...a,
      visible: visibilityOverrides[a.id] !== undefined ? visibilityOverrides[a.id] : a.visible,
    })),
    [liveAnnouncements, visibilityOverrides]
  );
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Governance", content: "", priority: "normal" });
  const [showEditId, setShowEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "Governance", content: "", priority: "normal" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const filtered = announcements.filter(a =>
    debouncedQuery === "" || a.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);

  const handleCreate = async () => {
    const parsed = announcementSchema.safeParse(form);
    if (!parsed.success) {
      parsed.error.issues.forEach(i => toast.error(i.message));
      return;
    }
    try {
      await insertAnnouncement({
        title: form.title,
        category: form.category,
        content: form.content,
        date: (new Date().toISOString().split("T")[0] ?? ""),
        priority: form.priority,
      }, user?.name || "System");
      setForm({ title: "", category: "Governance", content: "", priority: "normal" });
      setShowForm(false);
      toast.success("Announcement published!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to publish"); }
  };

  const toggleVisibility = async (id: string) => {
    const ann = liveAnnouncements.find(a => a.id === id);
    if (!ann) return;
    const nextVisible = !ann.visible;
    setVisibilityOverrides(o => ({ ...o, [id]: nextVisible }));
    try {
      await updateAnnouncement(id, { visible: nextVisible }, user?.name || "System");
      toast.success(nextVisible ? "Announcement visible" : "Announcement hidden");
    } catch (err) {
      setVisibilityOverrides(o => ({ ...o, [id]: ann.visible }));
      toast.error(err instanceof Error ? err.message : "Failed to update visibility");
    }
  };

  const openEdit = (ann: typeof announcements[0]) => {
    setEditForm({ title: ann.title, category: ann.category, content: ann.content, priority: ann.priority });
    setShowEditId(ann.id);
  };

  const handleEdit = async () => {
    if (!showEditId) return;
    const parsed = announcementSchema.safeParse(editForm);
    if (!parsed.success) {
      parsed.error.issues.forEach(i => toast.error(i.message));
      return;
    }
    try {
      await updateAnnouncement(showEditId, {
        title: editForm.title,
        category: editForm.category,
        content: editForm.content,
        priority: editForm.priority,
      }, user?.name || "System");
      setShowEditId(null);
      toast.success("Announcement updated");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
  };

  const deleteAnn = async (id: string) => {
    try {
      await deleteAnnouncement(id, user?.name || "System");
      toast.success("Announcement deleted");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Announcements CMS</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{announcements.length} announcements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
          <Plus size={14} /> New Announcement
        </button>
      </div>

      { }
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">Create New Announcement</h2>
          <div className="space-y-3">
            <input id="announcement-title" name="title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <div className="grid grid-cols-2 gap-3">
              <select id="announcement-category" name="category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} aria-label="Select category" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
                {["Governance", "Health", "Social Services", "Environment", "Livelihood"].map(c => <option key={c}>{c}</option>)}
              </select>
              <select id="announcement-priority" name="priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} aria-label="Select priority" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <textarea id="announcement-content" name="content" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Announcement content…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">Publish</button>
            </div>
          </div>
        </motion.div>
      )}

      { }
      {showEditId && (() => {
        const ann = announcements.find(a => a.id === showEditId);
        if (!ann) return null;
        return (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4 text-sm">Edit Announcement — {ann.title}</h2>
            <div className="space-y-3">
              <input id="edit-announcement-title" name="title" type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <div className="grid grid-cols-2 gap-3">
                <select id="edit-announcement-category" name="category" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} aria-label="Select category" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                  {["Governance", "Health", "Social Services", "Environment", "Livelihood"].map(c => <option key={c}>{c}</option>)}
                </select>
                <select id="edit-announcement-priority" name="priority" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} aria-label="Select priority" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <textarea id="edit-announcement-content" name="content" rows={4} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} placeholder="Announcement content…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowEditId(null)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleEdit} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-all">Update</button>
              </div>
            </div>
          </motion.div>
        );
      })()}

      { }
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input id="search-announcements-admin" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search announcements…" className="w-full sm:max-w-xs pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
      </div>

      { }
      <div className="flex gap-2 mb-3">
        <span className="text-xs text-muted-foreground self-center">Sort by:</span>
        {["title", "date", "category", "priority"].map(key => (
          <button key={key} onClick={() => toggleSort(key as keyof typeof announcements[0])} className={`px-2 py-1 rounded-lg text-xs border transition-all ${sortKey === key ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        ))}
      </div>

      { }
      <div className="space-y-3">
        {loading ? (
          <TableLoading />
        ) : filtered.length === 0 ? (
          <TableEmpty message="No announcements found" />
        ) : (paginatedData.map((ann, i) => (
          <motion.div key={ann.id} initial={{ opacity: 0 }} animate={{ opacity: ann.visible ? 1 : 0.5 }} transition={{ delay: i * 0.04 }}>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[ann.category] || "bg-muted text-muted-foreground"}`}>{ann.category}</span>
                    {ann.priority === "high" && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">Important</span>}
                    {!ann.visible && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">Hidden</span>}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{ann.title}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">{ann.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={11} /> {ann.date}</span>
                    <span>By {ann.author}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleVisibility(ann.id)} className={`p-1.5 rounded-lg transition-colors ${ann.visible ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" : "text-muted-foreground hover:bg-muted"}`}>
                    {ann.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(ann)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(ann)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )))}
      </div>

      { }
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={() => deleteTarget && deleteAnn(deleteTarget.id)}
      />
    </div>
  );
};

export default AdminAnnouncements;
