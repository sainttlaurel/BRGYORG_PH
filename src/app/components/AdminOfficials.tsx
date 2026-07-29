import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion } from "motion/react";
import { Plus, Edit, Trash2, Search, Phone, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { insertOfficial, updateOfficial, deleteOfficial } from "@/lib/supabaseWrite";
import { TableLoading } from "./ui/table-state";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { officialSchema } from "@/lib/validations";

const positionColors: Record<string, string> = {
  "Barangay Captain": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Barangay Kagawad": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
  "SK Chairperson": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  "Barangay Secretary": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  "Barangay Treasurer": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
};

const avatarColors = [
  "from-emerald-400 to-emerald-600", "from-sky-400 to-sky-600",
  "from-purple-400 to-purple-600", "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600", "from-teal-400 to-teal-600",
];

const positions = ["Barangay Captain", "Barangay Kagawad", "Barangay Secretary", "Barangay Treasurer", "SK Chairperson"];

function csvExport(data: Record<string, string>[], filename: string) {
  const headers = Object.keys(data[0] ?? {});
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const AdminOfficials: React.FC = () => {
  const { officials: officialsList, loading } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [showForm, setShowForm] = useState(false);
  const [showEditId, setShowEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", position: "Barangay Kagawad", committee: "", contact: "", email: "", since: String(new Date().getFullYear()), bio: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const filtered = officialsList.filter(o =>
    debouncedQuery === "" || o.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || o.position.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);

  const resetForm = () => setForm({ name: "", position: "Barangay Kagawad", committee: "", contact: "", email: "", since: String(new Date().getFullYear()), bio: "" });

  const handleAdd = async () => {
    const parsed = officialSchema.safeParse(form);
    if (!parsed.success) { parsed.error.issues.forEach(i => toast.error(i.message)); return; }
    try {
      await insertOfficial(form, user?.name || "System");
      resetForm();
      setShowForm(false);
      toast.success("Official added");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to add"); }
  };

  const openEdit = (official: typeof officialsList[0]) => {
    setForm({ name: official.name, position: official.position, committee: official.committee, contact: official.contact, email: official.email, since: official.since, bio: official.bio });
    setShowEditId(official.id);
  };

  const handleEdit = async () => {
    if (showEditId === null) return;
    const parsed = officialSchema.safeParse(form);
    if (!parsed.success) { parsed.error.issues.forEach(i => toast.error(i.message)); return; }
    try {
      await updateOfficial(showEditId, form, user?.name || "System");
      setShowEditId(null);
      resetForm();
      toast.success("Official updated");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOfficial(deleteTarget.id, user?.name || "System");
      toast.success("Official removed");
      setDeleteTarget(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to remove"); }
  };

  if (loading) return <div className="p-6 max-w-6xl mx-auto"><TableLoading /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Officials Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{officialsList.length} officials on record</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => csvExport(officialsList.map(o => ({
            Name: o.name, Position: o.position, Committee: o.committee,
            Contact: o.contact, Email: o.email, "Since": o.since, Bio: o.bio
          })), "officials.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowEditId(null); resetForm(); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
            <Plus size={14} /> {showForm ? "Cancel" : "Add Official"}
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {(showForm || showEditId !== null) && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">{showEditId !== null ? "Edit Official" : "Add Official"}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input id="official-name" name="name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <select id="official-position" name="position" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
              {positions.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input id="official-committee" name="committee" type="text" value={form.committee} onChange={e => setForm(f => ({ ...f, committee: e.target.value }))} placeholder="Committee" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input id="official-contact" name="contact" type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input id="official-email" name="email" type="text" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input id="official-since" name="since" type="text" value={form.since} onChange={e => setForm(f => ({ ...f, since: e.target.value }))} placeholder="Year (e.g. 2022)" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
          </div>
          <textarea id="official-bio" name="bio" rows={2} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio / description…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all mb-3" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setShowEditId(null); resetForm(); }} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={showEditId !== null ? handleEdit : handleAdd} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
              {showEditId !== null ? "Update" : "Save"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input id="search-officials" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search officials…" className="w-full max-w-xs pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        <span className="text-xs text-muted-foreground self-center">Sort by:</span>
        {["name", "position", "committee", "since"].map(key => (
          <button key={key} onClick={() => toggleSort(key as keyof typeof officialsList[0])} className={`px-2 py-1 rounded-lg text-xs border transition-all ${sortKey === key ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No officials found</div>
        ) : (paginatedData.map((official, i) => (
          <motion.div key={official.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold shrink-0`}>
                    {official.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{official.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${positionColors[official.position] || "bg-muted text-muted-foreground"}`}>
                      {official.position}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(official)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: official.id, name: official.name })} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2 leading-relaxed">{official.bio}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">{official.committee}</div>
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone size={11} /> {official.contact}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail size={11} /> {official.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Since {official.since}</div>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Remove Official"
        description={`Are you sure you want to remove ${deleteTarget?.name}?`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminOfficials;
