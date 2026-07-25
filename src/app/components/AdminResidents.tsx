import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Search, Plus, Download, Upload, Filter, X, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { TableLoading, TableEmpty } from "./ui/table-state";
import { deleteResident, insertResident, updateResident } from "@/lib/supabaseWrite";

const statusColors: Record<string, string> = {
  "Registered Voter": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "Senior Citizen": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Minor": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

const avatarColors = [
  "from-emerald-400 to-emerald-600", "from-sky-400 to-sky-600",
  "from-purple-400 to-purple-600", "from-amber-400 to-amber-600",
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

const AdminResidents: React.FC = () => {
  const { residents, loading } = useData();
  const [query, setQuery] = useState("");
  const [purokFilter, setPurokFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<typeof residents[0] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ fname: "", lname: "", purok: "Purok 1", contact: "", address: "", gender: "Male", dob: "" });
  const [showEditId, setShowEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fname: "", lname: "", purok: "Purok 1", contact: "", address: "", gender: "Male", dob: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const puroks = ["All", ...Array.from(new Set(residents.map(r => r.purok)))];
  const statuses = ["All", "Registered Voter", "Senior Citizen", "Minor"];

  const handleAddResident = async () => {
    if (!addForm.fname.trim() || !addForm.lname.trim()) { toast.error("First and last name required"); return; }
    try {
      await insertResident(addForm);
      setAddForm({ fname: "", lname: "", purok: "Purok 1", contact: "", address: "", gender: "Male", dob: "" });
      setShowAddForm(false);
      toast.success("Resident added");
    } catch { toast.error("Failed to add resident"); }
  };

  const openEdit = (res: typeof residents[0]) => {
    setEditForm({ fname: res.name.split(" ")[0] ?? "", lname: res.name.split(" ").slice(1).join(" ") || "", purok: res.purok, contact: res.contact, address: res.address, gender: res.gender, dob: "" });
    setShowEditId(res.id);
    setSelected(null);
  };

  const handleEditResident = async () => {
    if (!showEditId) return;
    if (!editForm.fname.trim() || !editForm.lname.trim()) { toast.error("First and last name required"); return; }
    try {
      await updateResident(showEditId, {
        name: `${editForm.fname} ${editForm.lname}`.trim(),
        purok: editForm.purok,
        contact: editForm.contact,
        address: editForm.address,
        gender: editForm.gender,
        dob: editForm.dob || null,
      });
      setShowEditId(null);
      toast.success("Resident updated");
    } catch { toast.error("Failed to update"); }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV must have header + data rows"); return; }
      const headerLine = lines[0];
      if (!headerLine) { toast.error("Invalid CSV format"); return; }
      const headers = headerLine.split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
        await insertResident({
          fname: row.firstname || row.fname || "",
          lname: row.lastname || row.lname || "",
          purok: row.purok || "Purok 1",
          contact: row.contact || "",
          address: row.address || "",
          gender: row.gender || "Male",
          dob: row.dob || row.birthdate || "",
        });
        count++;
      }
      toast.success(`${count} residents imported`);
    } catch { toast.error("CSV import failed"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <TableLoading />;

  const filtered = residents.filter(r =>
    (purokFilter === "All" || r.purok === purokFilter) &&
    (statusFilter === "All" || r.status === statusFilter) &&
    (query === "" || 
      r.name.toLowerCase().includes(query.toLowerCase()) || 
      r.id.toLowerCase().includes(query.toLowerCase()) ||
      r.address.toLowerCase().includes(query.toLowerCase()))
  );

  const printIdCard = (res: typeof residents[0]) => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up blocked"); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${res.name}</title>
      <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f0f0f0;}.card{width:340px;background:linear-gradient(135deg,#059669,#065f46);border-radius:16px;padding:24px 20px;color:#fff;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);}.avatar{width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:32px;font-weight:bold;}.name{font-size:18px;font-weight:bold;}.id{font-size:12px;opacity:0.8;margin:4px 0 16px;}.row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.15);}.label{opacity:0.75;}.val{font-weight:500;}</style></head><body>
      <div class="card"><div class="avatar">${res.name.charAt(0)}</div><div class="name">${res.name}</div><div class="id">${res.id}</div>
      <div class="row"><span class="label">Age</span><span class="val">${res.age}</span></div>
      <div class="row"><span class="label">Gender</span><span class="val">${res.gender}</span></div>
      <div class="row"><span class="label">Address</span><span class="val">${res.address}</span></div>
      <div class="row"><span class="label">Purok</span><span class="val">${res.purok}</span></div>
      <div class="row"><span class="label">Contact</span><span class="val">${res.contact}</span></div>
      </div></body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Residents Registry</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{residents.length.toLocaleString()} total residents · {filtered.length} showing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => csvExport(filtered.map(r => ({ ID: r.id, Name: r.name, Age: String(r.age), Gender: r.gender, Status: r.status, Address: r.address, Purok: r.purok, Contact: r.contact })), "residents.csv")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
            <Plus size={14} /> Add Resident
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">New Resident</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input type="text" value={addForm.fname} onChange={e => setAddForm(f => ({ ...f, fname: e.target.value }))} placeholder="First name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input type="text" value={addForm.lname} onChange={e => setAddForm(f => ({ ...f, lname: e.target.value }))} placeholder="Last name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <select value={addForm.purok} onChange={e => setAddForm(f => ({ ...f, purok: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
              {["Purok 1","Purok 2","Purok 3","Purok 4","Purok 5"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input type="text" value={addForm.contact} onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input type="text" value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <div className="grid grid-cols-2 gap-3">
              <select value={addForm.gender} onChange={e => setAddForm(f => ({ ...f, gender: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
                <option>Male</option><option>Female</option>
              </select>
              <input type="date" value={addForm.dob} onChange={e => setAddForm(f => ({ ...f, dob: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleAddResident} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">Save Resident</button>
          </div>
        </motion.div>
      )}

      {/* Edit form */}
      {showEditId && (() => {
        const res = residents.find(r => r.id === showEditId);
        if (!res) return null;
        return (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4 text-sm">Edit Resident — {res.name}</h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input type="text" value={editForm.fname} onChange={e => setEditForm(f => ({ ...f, fname: e.target.value }))} placeholder="First name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <input type="text" value={editForm.lname} onChange={e => setEditForm(f => ({ ...f, lname: e.target.value }))} placeholder="Last name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <select value={editForm.purok} onChange={e => setEditForm(f => ({ ...f, purok: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                {["Purok 1","Purok 2","Purok 3","Purok 4","Purok 5"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input type="text" value={editForm.contact} onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                  <option>Male</option><option>Female</option>
                </select>
                <input type="date" value={editForm.dob} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowEditId(null)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleEditResident} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-all">Update Resident</button>
            </div>
          </motion.div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
          />
        </div>
        <select value={purokFilter} onChange={e => setPurokFilter(e.target.value)} aria-label="Filter by purok" className="px-3 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
          {puroks.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" className="px-3 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Resident</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Purok</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><TableEmpty message="No matching residents" /></td></tr>
              ) : (filtered.map((res, i) => (
                <motion.tr
                  key={res.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {res.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{res.name}</div>
                        <div className="text-xs text-muted-foreground">{res.age} · {res.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{res.id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{res.address}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[res.status] || "bg-muted text-muted-foreground"}`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{res.purok}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setSelected(res)} aria-label={`View ${res.name}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEdit(res)} aria-label={`Edit ${res.name}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={async () => { if (confirm(`Delete ${res.name}?`)) { try { await deleteResident(res.id); toast.success("Resident deleted"); } catch { toast.error("Failed to delete"); } } }} aria-label={`Delete ${res.name}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-foreground">Resident Profile</h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
                </div>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
                    {selected.name.charAt(0)}
                  </div>
                  <div className="font-bold text-foreground">{selected.name}</div>
                  <div className="text-muted-foreground text-sm">{selected.id}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${statusColors[selected.status] || "bg-muted text-muted-foreground"}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Age", value: `${selected.age} years old` },
                    { label: "Gender", value: selected.gender },
                    { label: "Civil Status", value: selected.civilStatus },
                    { label: "Address", value: selected.address },
                    { label: "Purok", value: selected.purok },
                    { label: "Household", value: selected.household },
                    { label: "Occupation", value: selected.occupation },
                    { label: "Contact", value: selected.contact },
                    { label: "Registered", value: new Date(selected.registered).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between border-b border-border pb-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium text-foreground text-right max-w-40">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => { setSelected(null); openEdit(selected); }} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
                    Edit Record
                  </button>
                  <button onClick={() => printIdCard(selected)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                    Print ID
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

export default AdminResidents;
