import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Search, X, ChevronDown, Filter, Send } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { updateSuggestionStatus, updateSuggestionReply } from "../../lib/supabaseWrite";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  published: { label: "Published", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const AdminSuggestions: React.FC = () => {
  const { suggestions, refetch } = useData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<typeof suggestions[0] | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = suggestions.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.content.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    try {
      await updateSuggestionReply(selected.id, replyText.trim());
      toast.success("Reply published");
      setReplyText("");
      refetch();
    } catch { toast.error("Failed to send reply"); }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateSuggestionStatus(id, "archived");
      toast.success("Suggestion archived");
      refetch();
      if (selected?.id === id) setSelected(null);
    } catch { toast.error("Failed to archive"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Suggestions & Feedback</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{suggestions.length} total submissions</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feedback…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
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
        <div className="text-center py-20 text-muted-foreground"><MessageSquare size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No feedback found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <button key={s.id} onClick={() => { setSelected(s); setReplyText(""); }} className="w-full text-left bg-white dark:bg-card border border-border rounded-xl p-4 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-foreground text-sm capitalize">{s.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[300px]">{s.content}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(statusConfig[s.status] ?? statusConfig.pending).color}`}>{(statusConfig[s.status] ?? statusConfig.pending).label}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
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
            <motion.div className="relative bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", duration: 0.4 }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-foreground">Feedback Details</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Category</span>
                      <div className="text-sm font-bold text-foreground capitalize">{selected.name}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${(statusConfig[selected.status] ?? statusConfig.pending).color}`}>{(statusConfig[selected.status] ?? statusConfig.pending).label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Submitted {new Date(selected.created_at).toLocaleString()}</div>
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">Message</h3>
                  <div className="bg-muted rounded-xl p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.content}</div>
                </div>

                {selected.admin_reply && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2">Your Reply</h3>
                    <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-foreground leading-relaxed">{selected.admin_reply}</div>
                  </div>
                )}

                {selected.status !== "archived" && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Write a public reply…" className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    <div className="flex gap-2">
                      <button onClick={handleReply} disabled={!replyText.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50"><Send size={14} /> Publish Reply</button>
                      <button onClick={() => handleArchive(selected.id)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-all">Archive</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSuggestions;
