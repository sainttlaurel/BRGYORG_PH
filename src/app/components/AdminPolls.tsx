import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Edit, Trash2, Users, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import type { Poll } from "@/lib/useSupabaseData";
import { useAuth } from "./AuthContext";
import { insertPoll, updatePollStatus, updatePoll, deletePoll as deletePollDb } from "@/lib/supabaseWrite";
import { TableLoading, TableEmpty } from "./ui/table-state";


const AdminPolls: React.FC = () => {
  const { polls: livePolls, loading } = useData();
  const { user } = useAuth();
  const [pollOverrides, setPollOverrides] = useState<Record<string, Partial<Poll>>>({});
  const pollsList = React.useMemo(() =>
    livePolls.map(p => {
      const o = pollOverrides[p.id];
      return o ? { ...p, ...o } : p;
    }),
    [livePolls, pollOverrides]
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Governance", description: "", endDate: "", options: ["", ""] });
  const [showEditId, setShowEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "Governance", description: "", endDate: "", options: ["", ""] });

  const getPercent = (v: number, t: number) => t === 0 ? 0 : Math.round((v / t) * 100);

  const handleCreate = async () => {
    const opts = form.options.map(o => o.trim()).filter(Boolean);
    if (opts.length < 2) { toast.error("At least 2 options required"); return; }
    try {
      await insertPoll({
        question: form.title,
        options: opts,
        expires_at: form.endDate || null,
      }, user?.name || "System");
      setForm({ title: "", category: "Governance", description: "", endDate: "", options: ["", ""] });
      setShowForm(false);
      toast.success("Poll created!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create poll"); }
  };

  const openEdit = (poll: typeof pollsList[0]) => {
    setEditForm({ title: poll.title, category: poll.category, description: poll.description, endDate: poll.endDate, options: poll.options.map(o => o.label) });
    setShowEditId(poll.id);
  };

  const handleEdit = async () => {
    if (!showEditId) return;
    const opts = editForm.options.map(o => o.trim()).filter(Boolean);
    if (opts.length < 2) { toast.error("At least 2 options required"); return; }
    try {
      await updatePoll(showEditId, {
        question: editForm.title,
        options: opts,
        expires_at: editForm.endDate || null,
      }, user?.name || "System");
      setShowEditId(null);
      toast.success("Poll updated");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update poll"); }
  };

  const closePoll = async (id: string) => {
    setPollOverrides(o => ({ ...o, [id]: { status: "closed" } }));
    try {
      await updatePollStatus(id, "closed", user?.name || "System");
      toast.success("Poll closed");
    } catch (err) {
      setPollOverrides(o => { const n = { ...o }; delete n[id]; return n; });
      toast.error(err instanceof Error ? err.message : "Failed to close poll");
    }
  };

  const deletePoll = async (id: string) => {
    try {
      await deletePollDb(id, user?.name || "System");
      toast.success("Poll deleted");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete poll"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Community Polls</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{pollsList.filter(p => p.status === "active").length} active · {pollsList.filter(p => p.status === "closed").length} closed</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
          <Plus size={14} /> Create Poll
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">New Poll</h2>
          <div className="space-y-3">
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Poll question…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
                {["Governance", "Infrastructure", "Budget", "Ordinance", "Services"].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            </div>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Options <span className="text-red-500">*</span> (at least 2)</label>
              <div className="space-y-1.5">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={opt} onChange={e => setForm(f => { const o = [...f.options]; o[i] = e.target.value; return { ...f, options: o }; })} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
                    {form.options.length > 2 && (
                      <button onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-xs">Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setForm(f => ({ ...f, options: [...f.options, ""] }))} className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">+ Add option</button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">Create</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit form */}
      {showEditId && (() => {
        const poll = pollsList.find(p => p.id === showEditId);
        if (!poll) return null;
        return (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4 text-sm">Edit Poll — {poll.title}</h2>
            <div className="space-y-3">
              <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Poll question…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                  {["Governance", "Infrastructure", "Budget", "Ordinance", "Services"].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              </div>
              <textarea rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description…" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Options</label>
                <div className="space-y-1.5">
                  {editForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={opt} onChange={e => setEditForm(f => { const o = [...f.options]; o[i] = e.target.value; return { ...f, options: o }; })} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
                      {editForm.options.length > 2 && (
                        <button onClick={() => setEditForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-xs">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setEditForm(f => ({ ...f, options: [...f.options, ""] }))} className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">+ Add option</button>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowEditId(null)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleEdit} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-all">Update</button>
              </div>
            </div>
          </motion.div>
        );
      })()}

      <div className="space-y-4">
        {loading ? (
          <TableLoading />
        ) : pollsList.length === 0 ? (
          <TableEmpty message="No polls found" />
        ) : (pollsList.map((poll, i) => (
          <motion.div key={poll.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">{poll.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${poll.status === "active" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {poll.status === "active" ? "Active" : "Closed"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{poll.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={10} /> {poll.totalVotes.toLocaleString()} votes</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Ends {poll.endDate}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {poll.status === "active" && (
                    <button onClick={() => closePoll(poll.id)} className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium transition-colors">
                      Close Poll
                    </button>
                  )}
                  <button onClick={() => openEdit(poll)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => deletePoll(poll.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-2">
                {poll.options.map(opt => {
                  const pct = getPercent(opt.votes, poll.totalVotes);
                  const isWinner = poll.status === "closed" && opt.votes === Math.max(...poll.options.map(o => o.votes));
                  return (
                    <div key={opt.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          {isWinner && <Trophy size={11} className="text-amber-500" />}
                          <span className={isWinner ? "font-semibold text-foreground" : "text-muted-foreground"}>{opt.label}</span>
                        </div>
                        <span className="font-medium text-foreground">{pct}% ({opt.votes.toLocaleString()})</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${isWinner ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-sky-400 to-sky-500"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )))}
      </div>
    </div>
  );
};

export default AdminPolls;
