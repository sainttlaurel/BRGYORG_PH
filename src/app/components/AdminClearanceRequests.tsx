import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { useAuth } from "./AuthContext";
import { updateClearanceRequest } from "@/lib/supabaseWrite";
import { useSort } from "@/lib/hooks/useSort";
import { usePagination } from "@/lib/hooks/usePagination";
import { useColumnVisibility } from "@/lib/hooks/useColumnVisibility";
import type { ColumnDef } from "@/lib/hooks/useColumnVisibility";
import { TableLoading, TableEmpty } from "./ui/table-state";
import ColumnToggle from "@/app/components/ui/column-toggle";
import type { ClearanceRequest } from "@/lib/useSupabaseData";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", label: "Pending" },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", label: "Rejected" },
};

const tableColumns: ColumnDef[] = [
  { key: "control_number", label: "Control #" },
  { key: "full_name", label: "Name" },
  { key: "doc_type", label: "Doc Type" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date" },
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

const AdminClearanceRequests: React.FC = () => {
  const { clearanceRequests, refetch, loading } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<ClearanceRequest | null>(null);

  const filtered = clearanceRequests.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (debouncedQuery === "" || r.control_number.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.full_name.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.doc_type.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.purpose.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const { sortKey, sortDir, toggleSort, sortedData } = useSort(filtered);
  const { page, pageSize, setPage, setPageSize, totalPages, total, paginatedData } = usePagination(sortedData);
  const vis = useColumnVisibility(tableColumns);

  const updateStatus = async (id: string, newStatus: string) => {
    const data: Record<string, unknown> = { status: newStatus };
    if (newStatus === "approved") data.approved_at = new Date().toISOString();
    if (newStatus === "rejected") data.rejected_at = new Date().toISOString();
    try {
      await updateClearanceRequest(id, data, user?.name || "System");
      toast.success(`Clearance ${newStatus}`);
      if (selected?.id === id) setSelected(s => s ? { ...s, status: newStatus } : null);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
  };

  const printClearance = (req: ClearanceRequest) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const dateStr = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    w.document.write(`<!DOCTYPE html>
<html><head><title>Clearance - ${req.control_number}</title>
<style>
  body{font-family:'Times New Roman',serif;padding:60px;text-align:center;}
  h1{font-size:22px;margin-bottom:4px;}
  .seal{font-size:48px;margin:20px 0;}
  .content{max-width:500px;margin:auto;text-align:justify;font-size:14px;line-height:1.8;}
  .sig{margin-top:50px;}
  .sig-line{border-top:1px solid #000;width:220px;margin:auto;padding-top:6px;}
  .meta{font-size:12px;color:#666;margin-bottom:20px;}
</style></head><body>
  <h1>Republic of the Philippines</h1>
  <p style="font-size:16px;margin:0;">Barangay Payatas, Quezon City</p>
  <div class="seal">&#9878;</div>
  <h2>${req.doc_type.toUpperCase()}</h2>
  <div class="meta">Control No: ${req.control_number} | Verification: ${req.verification_code}</div>
  <div class="content">
    <p>This is to certify that <strong>${req.full_name}</strong>, a resident of ${req.address}, has requested a ${req.doc_type} for the purpose of ${req.purpose}.</p>
    <p>This clearance is issued upon the request of the interested party for whatever legal purpose it may serve.</p>
  </div>
  <div class="sig">
    <p>Issued this ${dateStr} at Barangay Payatas, Quezon City.</p>
    <div class="sig-line"><strong>Barangay Secretary</strong></div>
    <p style="font-size:11px;color:#666;margin-top:8px;">Not valid without seal</p>
  </div>
</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Clearance Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clearanceRequests.length} total · {total} showing</p>
        </div>
        <div className="flex gap-2">
          <ColumnToggle columns={vis.columns} hidden={vis.hidden} onToggle={vis.toggle} onReset={vis.showAll} />
          <button onClick={() => csvExport(clearanceRequests.map(r => ({ "Control #": r.control_number, Name: r.full_name, "Doc Type": r.doc_type, Purpose: r.purpose, Status: r.status, Contact: r.contact, "Verification Code": r.verification_code, "Date Filed": r.created_at ? new Date(r.created_at).toLocaleDateString() : "" })), "clearance-requests.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-clearance" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, control #, doc type…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
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
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("control_number") ? "hidden" : ""}`} onClick={() => toggleSort("control_number")}>Control #{sortKey === "control_number" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("full_name") ? "hidden" : ""}`} onClick={() => toggleSort("full_name")}>Name{sortKey === "full_name" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none ${vis.isHidden("doc_type") ? "hidden" : ""}`} onClick={() => toggleSort("doc_type")}>Doc Type{sortKey === "doc_type" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none ${vis.isHidden("status") ? "hidden" : ""}`} onClick={() => toggleSort("status")}>Status{sortKey === "status" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell cursor-pointer select-none ${vis.isHidden("created_at") ? "hidden" : ""}`} onClick={() => toggleSort("created_at")}>Date{sortKey === "created_at" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><TableEmpty message="No clearance requests found" /></td></tr>
              ) : (paginatedData.map((req) => {
                const st = statusConfig[req.status];
                return (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className={`px-4 py-3 text-xs font-mono text-muted-foreground ${vis.isHidden("control_number") ? "hidden" : ""}`}>{req.control_number}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-foreground ${vis.isHidden("full_name") ? "hidden" : ""}`}>{req.full_name}</td>
                    <td className={`px-4 py-3 text-xs text-muted-foreground hidden md:table-cell ${vis.isHidden("doc_type") ? "hidden" : ""}`}>{req.doc_type}</td>
                    <td className={`px-4 py-3 ${vis.isHidden("status") ? "hidden" : ""}`}>
                      {st && <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>}
                    </td>
                    <td className={`px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell ${vis.isHidden("created_at") ? "hidden" : ""}`}>{req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(req)} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                          <Eye size={14} />
                        </button>
                        {req.status === "approved" && (
                          <button onClick={() => printClearance(req)} className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <Download size={14} />
                          </button>
                        )}
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
                    <h2 className="font-bold text-foreground">Clearance Details</h2>
                    <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                    {[
                      { label: "Control #", value: selected.control_number },
                      { label: "Name", value: selected.full_name },
                      { label: "Document Type", value: selected.doc_type },
                      { label: "Purpose", value: selected.purpose },
                      { label: "Address", value: selected.address || "—" },
                      { label: "Contact", value: selected.contact || "—" },
                      { label: "Status", value: statusConfig[selected.status]?.label || selected.status },
                      { label: "Verification Code", value: selected.verification_code },
                      { label: "Date Filed", value: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {selected.notes && (
                    <div className="mb-4">
                      <span className="text-xs text-muted-foreground">Admin Notes:</span>
                      <p className="text-xs text-foreground mt-0.5 bg-muted/50 rounded-xl p-3">{selected.notes}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selected.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(selected.id, "approved")} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button onClick={() => updateStatus(selected.id, "rejected")} className="w-full py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    {selected.status === "approved" && (
                      <>
                        <button onClick={() => printClearance(selected)} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                          <Download size={14} /> Print Clearance
                        </button>
                        <button onClick={() => updateStatus(selected.id, "pending")} className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold transition-all">Revert to Pending</button>
                      </>
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
    </div>
  );
};

export default AdminClearanceRequests;
