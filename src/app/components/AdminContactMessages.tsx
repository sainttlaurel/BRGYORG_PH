import React, { useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Mail, Trash2, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase, getSessionToken } from "@/lib/supabase";
import { ConfirmDialog } from "./ui/confirm-dialog";

interface ContactMessage {
  id: string; name: string; email: string; subject: string;
  message: string; created_at: string;
}

const AdminContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const fetch = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setMessages(data as ContactMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleDeleteMessage = async (id: string) => {
    const token = getSessionToken();
    if (!token || !supabase) return;
    const { error } = await supabase.rpc('admin_delete_contact_message', { p_token: token, p_id: id, p_logged_in_user: "Admin" });
    if (error) toast.error("Failed to delete");
    else { toast.success("Message deleted"); setMessages(m => m.filter(x => x.id !== id)); setSelected(s => s?.id === id ? null : s); }
  };

  const filtered = messages.filter(m =>
    !debouncedSearch || m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    m.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">Contact Messages</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{messages.length} total submissions</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="search-messages" name="search" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading messages…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No messages found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map(msg => (
              <button key={msg.id} onClick={() => setSelected(msg)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === msg.id ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "border-border bg-white dark:bg-card hover:border-emerald-300"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
                    <span className="text-[0.6rem] font-bold text-emerald-600 dark:text-emerald-300">{msg.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{msg.name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                <p className="text-[0.6rem] text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-500" />
                    <h2 className="font-semibold text-foreground text-sm">{selected.subject}</h2>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                  <Mail size={12} />
                  <span>{selected.email}</span>
                  <span className="text-border">|</span>
                  <span>{new Date(selected.created_at).toLocaleString()}</span>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-48">
                <p className="text-sm text-muted-foreground">Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Message"
        description={`Are you sure you want to delete the message from "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteTarget && handleDeleteMessage(deleteTarget.id)}
      />
    </div>
  );
};

export default AdminContactMessages;
