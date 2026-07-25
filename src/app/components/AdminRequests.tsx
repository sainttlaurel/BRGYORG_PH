import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Search, CheckCircle, Clock, XCircle, Eye, Printer, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { updateDocumentStatus } from "@/lib/supabaseWrite";
import { TableLoading, TableEmpty } from "./ui/table-state";

const statusConfig: Record<string, { color: string; label: string; icon: React.FC<any> }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", label: "Pending", icon: Clock },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", label: "Approved", icon: CheckCircle },
  processing: { color: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-400", label: "Processing", icon: Clock },
  ready: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400", label: "Ready", icon: CheckCircle },
  released: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Released", icon: CheckCircle },
  rejected: { color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", label: "Rejected", icon: XCircle },
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

const AdminRequests: React.FC = () => {
  const { docRequests, loading } = useData();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const requests = React.useMemo(() =>
    docRequests.map(r => {
      const s = statusOverrides[r.id];
      return s ? { ...r, status: s } : r;
    }),
    [docRequests, statusOverrides]
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<typeof docRequests[0] | null>(null);

  const filtered = requests.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (query === "" || r.id.toLowerCase().includes(query.toLowerCase()) || r.resident.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase()))
  );

  const updateStatus = async (id: string, newStatus: string) => {
    setStatusOverrides(o => ({ ...o, [id]: newStatus }));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: newStatus } : null);
    try {
      await updateDocumentStatus(id, newStatus);
      toast.success(`Request ${id} updated to ${newStatus}`);
    } catch { toast.error("Failed to update status"); }
  };

  const getWorkflowActions = (status: string) => {
    const next: Record<string, { label: string; next: string; color: string }[]> = {
      pending: [{ label: "Approve", next: "approved", color: "bg-emerald-600 hover:bg-emerald-700 text-white" }, { label: "Reject", next: "rejected", color: "bg-red-100 hover:bg-red-200 text-red-700" }],
      approved: [{ label: "Start Processing", next: "processing", color: "bg-sky-600 hover:bg-sky-700 text-white" }],
      processing: [{ label: "Mark Ready", next: "ready", color: "bg-purple-600 hover:bg-purple-700 text-white" }],
      ready: [{ label: "Mark Released", next: "released", color: "bg-gray-600 hover:bg-gray-700 text-white" }],
      rejected: [],
    };
    return next[status] || [];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Document Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{requests.length} total · {filtered.length} showing</p>
        </div>
        <button onClick={() => csvExport(requests.map(r => ({ ID: r.id, Resident: r.resident, Type: r.type, Purpose: r.purpose, Status: r.status, Date: r.date, Contact: r.contact || "", Fee: r.fee })), "document-requests.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by ID, name, or type…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "pending", "approved", "processing", "ready", "released", "rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${statusFilter === s ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-emerald-300"}`}>
              {s === "All" ? "All" : (statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Request</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Resident</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableLoading /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><TableEmpty message="No document requests found" /></td></tr>
              ) : (filtered.map((req, i) => {
                const st = statusConfig[req.status];
                return (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{req.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{req.resident}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{req.type}</td>
                    <td className="px-4 py-3">
                      {st && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{req.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(req)} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>Print ${req.id}</title><style>body{font-family:sans-serif;padding:40px;}h1{font-size:18px;}.field{margin:8px 0;}.lbl{font-weight:600;color:#555;}</style></head><body><h1>Document Request — ${req.id}</h1><div class="field"><span class="lbl">Resident:</span> ${req.resident}</div><div class="field"><span class="lbl">Type:</span> ${req.type}</div><div class="field"><span class="lbl">Purpose:</span> ${req.purpose}</div><div class="field"><span class="lbl">Status:</span> ${req.status}</div><div class="field"><span class="lbl">Date:</span> ${req.date}</div><div class="field"><span class="lbl">Contact:</span> ${req.contact || "—"}</div></body></html>`); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 300); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                          <Printer size={14} />
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

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-foreground">Request Details</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><XCircle size={16} /></button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-foreground font-mono">{selected.id}</span>
                    {(() => { const st = statusConfig[selected.status]; return st ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span> : null; })()}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: "Resident", value: selected.resident },
                      { label: "Document Type", value: selected.type },
                      { label: "Purpose", value: selected.purpose },
                      { label: "Date Filed", value: selected.date },
                      { label: "Contact", value: selected.contact || "—" },
                      { label: "Fee", value: selected.fee },
                      { label: "Processed by", value: selected.processor || "—" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate preview */}
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-5">
                  <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Certificate Preview</h3>
                  <div className="bg-white dark:bg-card rounded-lg border border-border p-3 text-center">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">Republic of the Philippines</div>
                    <div className="text-xs text-muted-foreground">Barangay Payatas, Quezon City</div>
                    <div className="border-t border-b border-border py-2 my-2">
                      <div className="text-xs font-bold text-foreground">{selected.type.toUpperCase()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">This certifies that <strong className="text-foreground">{selected.resident}</strong> is a bona fide resident...</div>
                  </div>
                </div>

                {/* Uploaded ID */}
                {selected.id_upload && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">Uploaded Valid ID</h3>
                    <img src={selected.id_upload} alt="Valid ID" className="w-full rounded-xl border border-border object-contain max-h-48" />
                  </div>
                )}

                {/* Workflow actions */}
                <div className="space-y-2">
                  {getWorkflowActions(selected.status).map(action => (
                    <button key={action.next} onClick={() => updateStatus(selected.id, action.next)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}>
                      {action.label}
                    </button>
                  ))}
                  {selected.status === "released" && (
                    <button onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${selected.id}</title><style>body{font-family:'Times New Roman',serif;padding:60px;text-align:center;}h1{font-size:22px;margin-bottom:4px;}.seal{font-size:48px;margin:20px 0;}.content{max-width:500px;margin:auto;text-align:justify;font-size:14px;line-height:1.8;}.sig{margin-top:50px;}.sig-line{border-top:1px solid #000;width:220px;margin:auto;padding-top:6px;}</style></head><body><h1>Republic of the Philippines</h1><p style="font-size:16px;margin:0;">Barangay Payatas, Quezon City</p><div class="seal">&#9878;</div><h2>${selected.type.toUpperCase()}</h2><div class="content"><p>This is to certify that <strong>${selected.resident}</strong> is a bona fide resident of Barangay Payatas, Quezon City, and has filed a request for <strong>${selected.type}</strong> on ${selected.date}.</p><p>This certificate is issued upon the request of the interested party for whatever legal purpose it may serve.</p></div><div class="sig"><p>Issued this ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} at Barangay Payatas, Quezon City.</p><div class="sig-line"><strong>Barangay Secretary</strong></div></div></body></html>`); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 300); }} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Printer size={14} /> Print Certificate
                    </button>
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

export default AdminRequests;
