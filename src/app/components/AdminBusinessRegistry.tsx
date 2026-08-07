import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { insertBusiness, updateBusiness, deleteBusiness } from "@/lib/supabaseWrite";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { useColumnVisibility } from "@/lib/hooks/useColumnVisibility";
import type { ColumnDef } from "@/lib/hooks/useColumnVisibility";
import { TableLoading, TableEmpty } from "./ui/table-state";
import { ConfirmDialog } from "./ui/confirm-dialog";
import ColumnToggle from "@/app/components/ui/column-toggle";
import type { BusinessRegistry } from "@/lib/useSupabaseData";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", label: "Pending" },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", label: "Rejected" },
};

const categories = ["Retail", "Food", "Services", "Manufacturing", "Wholesale", "Other"];

const tableColumns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "owner", label: "Owner" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
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

const emptyForm = { name: "", owner: "", category: "Retail", contact: "", address: "", description: "" };

const AdminBusinessRegistry: React.FC = () => {
  const { businessRegistry, refetch, loading } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<BusinessRegistry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusinessRegistry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = businessRegistry.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (debouncedQuery === "" || r.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.owner.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.category.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);
  const vis = useColumnVisibility(tableColumns);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateBusiness(id, { status: newStatus }, user?.name || "System");
      toast.success(`Business ${newStatus}`);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.owner) { toast.error("Name and owner are required"); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await updateBusiness(editing.id, form, user?.name || "System");
        toast.success("Business updated");
      } else {
        await insertBusiness(form, user?.name || "System");
        toast.success("Business registered");
      }
      setShowForm(false); setEditing(null); setForm(emptyForm);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBusiness(deleteId, user?.name || "System");
      toast.success("Business deleted");
      if (selected?.id === deleteId) setSelected(null);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Business Registry</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{businessRegistry.length} total · {total} showing</p>
        </div>
        <div className="flex gap-2">
          <ColumnToggle columns={vis.columns} hidden={vis.hidden} onToggle={vis.toggle} onReset={vis.showAll} />
          <button onClick={() => csvExport(businessRegistry.map(r => ({ Name: r.name, Owner: r.owner, Category: r.category, Contact: r.contact, Status: r.status, Address: r.address })), "business-registry.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus size={14} /> Add Business
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-business" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, owner, category…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "pending", "approved", "rejected"].map(s => (
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
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("name") ? "hidden" : ""}`} onClick={() => toggleSort("name")}>Name{sortKey === "name" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("owner") ? "hidden" : ""}`} onClick={() => toggleSort("owner")}>Owner{sortKey === "owner" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none ${vis.isHidden("category") ? "hidden" : ""}`} onClick={() => toggleSort("category")}>Category{sortKey === "category" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("status") ? "hidden" : ""}`} onClick={() => toggleSort("status")}>Status{sortKey === "status" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><TableLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}><TableEmpty message="No business registrations found" /></td></tr>
              ) : (paginatedData.map((biz) => {
                const st = statusConfig[biz.status];
                return (
                  <tr key={biz.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className={`px-4 py-3 ${vis.isHidden("name") ? "hidden" : ""}`}>
                      <button onClick={() => setSelected(biz)} className="text-sm font-medium text-foreground hover:text-emerald-600 transition-colors text-left">{biz.name}</button>
                    </td>
                    <td className={`px-4 py-3 text-sm text-muted-foreground ${vis.isHidden("owner") ? "hidden" : ""}`}>{biz.owner}</td>
                    <td className={`px-4 py-3 text-xs text-muted-foreground hidden md:table-cell ${vis.isHidden("category") ? "hidden" : ""}`}>{biz.category}</td>
                    <td className={`px-4 py-3 ${vis.isHidden("status") ? "hidden" : ""}`}>
                      {st && <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(biz); setForm({ name: biz.name, owner: biz.owner, category: biz.category, contact: biz.contact, address: biz.address, description: biz.description }); setShowForm(true); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(biz.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-foreground">Business Details</h2>
                    <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
                    {[
                      { label: "Name", value: selected.name },
                      { label: "Owner", value: selected.owner },
                      { label: "Category", value: selected.category },
                      { label: "Contact", value: selected.contact || "—" },
                      { label: "Status", value: statusConfig[selected.status]?.label || selected.status },
                      { label: "Registered", value: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {selected.address && <div className="mb-3"><span className="text-xs text-muted-foreground">Address:</span><p className="text-xs text-foreground mt-0.5">{selected.address}</p></div>}
                  {selected.description && <div className="mb-4"><span className="text-xs text-muted-foreground">Description:</span><p className="text-xs text-foreground mt-0.5">{selected.description}</p></div>}
                  <div className="space-y-2">
                    {selected.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(selected.id, "approved")} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all">Approve</button>
                        <button onClick={() => updateStatus(selected.id, "rejected")} className="w-full py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold transition-all">Reject</button>
                      </>
                    )}
                    {selected.status === "approved" && (
                      <button onClick={() => updateStatus(selected.id, "pending")} className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold transition-all">Revert to Pending</button>
                    )}
                    {selected.status === "rejected" && (
                      <button onClick={() => updateStatus(selected.id, "pending")} className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold transition-all">Reopen</button>
                    )}
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
                  <h2 className="font-bold text-foreground mb-4">{editing ? "Edit Business" : "Register Business"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="biz-name" className="block text-xs font-medium text-muted-foreground mb-1">Business Name *</label>
                        <input id="biz-name" name="biz-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
                      </div>
                      <div>
                        <label htmlFor="biz-owner" className="block text-xs font-medium text-muted-foreground mb-1">Owner *</label>
                        <input id="biz-owner" name="biz-owner" type="text" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="biz-category" className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                        <select id="biz-category" name="biz-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="biz-contact" className="block text-xs font-medium text-muted-foreground mb-1">Contact</label>
                        <input id="biz-contact" name="biz-contact" type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="biz-address" className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                      <input id="biz-address" name="biz-address" type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <div>
                      <label htmlFor="biz-description" className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                      <textarea id="biz-description" name="biz-description" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
                        {submitting ? "Saving…" : editing ? "Update Business" : "Register Business"}
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
        title="Delete Business"
        description="Are you sure you want to delete this business registration?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminBusinessRegistry;
