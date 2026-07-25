import React, { useState } from "react";
import { motion } from "motion/react";
import { UserCog, Plus, Edit, Trash2, Search, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { createUser, updateUser, setUserStatus, deleteUser } from "@/lib/supabase";

const roleColors: Record<string, string> = {
  captain: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  secretary: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  treasurer: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  staff: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const avatarColors = [
  "from-emerald-400 to-emerald-600", "from-sky-400 to-sky-600",
  "from-purple-400 to-purple-600", "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600", "from-teal-400 to-teal-600",
];

const AdminUsers: React.FC = () => {
  const { adminUsers: users, refetch } = useData();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEditId, setShowEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "staff", initials: "" });

  const filtered = users.filter(u =>
    query === "" || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  const resetForm = () => setForm({ name: "", username: "", email: "", password: "", role: "staff", initials: "" });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) { toast.error("Name, username, and password required"); return; }
    const nextId = Math.max(...users.map(u => u.id), 0) + 1;
    try {
      await createUser({ id: nextId, name: form.name, username: form.username, email: form.email, password: form.password, role: form.role, initials: form.initials || form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) });
      resetForm();
      setShowForm(false);
      toast.success("User created");
      refetch();
    } catch { toast.error("Failed to create user"); }
  };

  const openEdit = (user: typeof users[0]) => {
    setForm({ name: user.name, username: user.username || "", email: user.email, password: "", role: user.role, initials: "" });
    setShowEditId(user.id);
  };

  const handleEdit = async () => {
    if (showEditId === null) return;
    if (!form.name.trim()) { toast.error("Name required"); return; }
    try {
      await updateUser({ id: showEditId, name: form.name, username: form.username || form.name.toLowerCase().replace(/\s/g, "."), email: form.email, role: form.role, initials: form.initials || form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) });
      setShowEditId(null);
      resetForm();
      toast.success("User updated");
      refetch();
    } catch { toast.error("Failed to update user"); }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await setUserStatus(id, nextStatus);
      toast.success(`User ${nextStatus === "active" ? "activated" : "suspended"}`);
      refetch();
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user ${name}?`)) return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      refetch();
    } catch { toast.error("Failed to delete user"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-bold text-foreground text-[1.3rem]">User Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} system users</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setShowEditId(null); resetForm(); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm">
          <Plus size={14} /> {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* Add/Edit form */}
      {(showForm || showEditId !== null) && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">{showEditId !== null ? "Edit User" : "New User"}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username *" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={showEditId !== null ? "Leave blank to keep current" : "Password *"} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all">
              <option value="captain">Captain</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <input type="text" value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value }))} placeholder="Initials (auto)" className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setShowEditId(null); resetForm(); }} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={showEditId !== null ? handleEdit : handleAdd} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
              {showEditId !== null ? "Update" : "Create"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users…" className="w-full max-w-xs pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all" />
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No users found</td></tr>
              ) : (filtered.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[user.role] || "bg-muted text-muted-foreground"}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{user.position}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} /> {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400" : "bg-gray-100 text-gray-600"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleStatus(user.id, user.status)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        <Shield size={14} />
                      </button>
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(user.id, user.name)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
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

      <div className="mt-5 bg-white dark:bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-foreground mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries({ captain: "All modules, full control", secretary: "Residents, Requests, Announcements, Blotter", treasurer: "Reports, Requests, Residents", staff: "Assigned modules only", admin: "System settings, User management" }).map(([role, perms]) => (
            <div key={role} className="text-center">
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[role]}`}>{role}</span>
              <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{perms}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
