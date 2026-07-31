import React, { useState, useEffect } from "react";
import { Settings, Save, Bell, Shield, FileText, DollarSign, Leaf, Upload, Check, Eye, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase, dbFetch, getSessionToken } from "@/lib/supabase";
import { uploadLogo } from "@/lib/supabaseWrite";
import { useAuth } from "./AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { ConfirmDialog } from "./ui/confirm-dialog";

const tabs = [
  { id: "profile", label: "Barangay Profile", icon: Leaf },
  { id: "fees", label: "Service Fees", icon: DollarSign },
  { id: "templates", label: "Certificate Templates", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "system", label: "System", icon: Settings },
];

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all";

async function saveSettings(key: string, value: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const token = getSessionToken();
  if (!token) throw new Error('No active session');
  const { error } = await supabase.rpc('admin_upsert_setting', { p_token: token, p_key: key, p_value: value, p_logged_in_user: loggedInUser });
  if (error) throw new Error(error.message);
}

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  const [templateEditor, setTemplateEditor] = useState<{ name: string; header: string; footer: string; officer: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", municipality: "", captain: "", hotline: "", email: "",
    address: "", office_hours: "", vision: "", mission: "", seal_url: "",
  });
  const [fees, setFees] = useState<{ id: number; service: string; fee: number }[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});
  const [dangerAction, setDangerAction] = useState<"clear-documents" | "clear-residents" | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [infoRows, feeRows, settingsRows] = await Promise.all([
          dbFetch<Record<string, unknown>>("barangay_info"),
          dbFetch<Record<string, unknown>>("service_fees"),
          dbFetch<Record<string, unknown>>("settings"),
        ]);
        const info = infoRows[0] ?? {};
        setProfileForm({
          name: String(info.name ?? ""),
          municipality: String(info.municipality ?? ""),
          captain: String(info.captain ?? ""),
          hotline: String(info.hotline ?? ""),
          email: String(info.email ?? ""),
          address: String(info.address ?? ""),
          office_hours: String(info.office_hours ?? ""),
          vision: String(info.vision ?? ""),
          mission: String(info.mission ?? ""),
          seal_url: String(info.seal_url ?? ""),
        });
        setFees(feeRows.map(r => ({ id: Number(r.id ?? 0), service: String(r.service ?? ""), fee: Number(r.fee ?? 0) })));
        const sm: Record<string, string> = {};
        settingsRows.forEach(r => { sm[String(r.key ?? "")] = String(r.value ?? ""); });
        setSettingsMap(sm);
      } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to load settings"); }
      setLoading(false);
    })();
  }, []);

  const mark = (key: string) => setModified(m => ({ ...m, [key]: true }));

  const saveProfile = async () => {
    try {
      const token = getSessionToken();
      if (!token || !supabase) throw new Error('No active session');
      const { error } = await supabase.rpc('admin_update_barangay_info', { p_token: token, p_data: profileForm, p_logged_in_user: user?.name || "System" });
      if (error) throw new Error(error.message);
      toast.success("Profile saved");
      setModified({});
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save profile"); }
  };

  const saveFee = async (id: number) => {
    const item = fees.find(f => f.id === id);
    if (!item) return;
    try {
      const token = getSessionToken();
      if (!token || !supabase) throw new Error('No active session');
      const { error } = await supabase.rpc('admin_update_service_fee', { p_token: token, p_id: id, p_fee: item.fee, p_logged_in_user: user?.name || "System" });
      if (error) throw new Error(error.message);
      toast.success(`${item.service} fee updated`);
      setModified(m => ({ ...m, [`fee-${id}`]: false }));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update fee"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-bold text-foreground text-[1.3rem]">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your barangay platform</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading settings…</div>
      ) : (
        <div className="flex gap-5 flex-col md:flex-row">
          <div className="md:w-44 shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : "text-muted-foreground hover:bg-muted"}`}>
                  <tab.icon size={15} /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">Barangay Profile</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="barangay-name" className="block text-xs text-muted-foreground mb-1.5">Barangay Name</label>
                      <input id="barangay-name" name="name" type="text" value={profileForm.name} onChange={e => { setProfileForm(f => ({ ...f, name: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="municipality" className="block text-xs text-muted-foreground mb-1.5">Municipality / City</label>
                      <input id="municipality" name="municipality" type="text" value={profileForm.municipality} onChange={e => { setProfileForm(f => ({ ...f, municipality: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="captain" className="block text-xs text-muted-foreground mb-1.5">Barangay Captain</label>
                    <input id="captain" name="captain" type="text" value={profileForm.captain} onChange={e => { setProfileForm(f => ({ ...f, captain: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="hotline" className="block text-xs text-muted-foreground mb-1.5">Hotline</label>
                      <input id="hotline" name="hotline" type="text" value={profileForm.hotline} onChange={e => { setProfileForm(f => ({ ...f, hotline: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="profile-email" className="block text-xs text-muted-foreground mb-1.5">Email</label>
                      <input id="profile-email" name="email" type="email" value={profileForm.email} onChange={e => { setProfileForm(f => ({ ...f, email: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="profile-address" className="block text-xs text-muted-foreground mb-1.5">Address</label>
                    <input id="profile-address" name="address" type="text" value={profileForm.address} onChange={e => { setProfileForm(f => ({ ...f, address: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="office-hours" className="block text-xs text-muted-foreground mb-1.5">Office Hours</label>
                    <input id="office-hours" name="office_hours" type="text" value={profileForm.office_hours} onChange={e => { setProfileForm(f => ({ ...f, office_hours: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="vision" className="block text-xs text-muted-foreground mb-1.5">Vision</label>
                    <textarea id="vision" name="vision" rows={3} value={profileForm.vision} onChange={e => { setProfileForm(f => ({ ...f, vision: e.target.value })); mark("profile"); }} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label htmlFor="mission" className="block text-xs text-muted-foreground mb-1.5">Mission</label>
                    <textarea id="mission" name="mission" rows={3} value={profileForm.mission} onChange={e => { setProfileForm(f => ({ ...f, mission: e.target.value })); mark("profile"); }} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Barangay Seal / Logo</label>
                    <div className="flex items-center gap-3">
                      {profileForm.seal_url ? (
                        <img src={profileForm.seal_url} alt="Seal" className="w-16 h-16 rounded-xl object-contain border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                          <Upload size={16} className="text-muted-foreground" />
                        </div>
                      )}
                      <label className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted cursor-pointer transition-colors">
                        {profileForm.seal_url ? "Change" : "Upload"} (PNG/SVG)
                        <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadLogo(file);
                            setProfileForm(f => ({ ...f, seal_url: url }));
                            mark("profile");
                            toast.success("Logo uploaded");
                          } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to upload logo"); }
                        }} />
                      </label>
                      {profileForm.seal_url && (
                        <button onClick={() => { setProfileForm(f => ({ ...f, seal_url: "" })); mark("profile"); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                          <XIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={saveProfile} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all">
                    <Save size={14} /> {modified["profile"] ? "Save Changes" : "Saved"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">Service Fees (₱)</h2>
                <div className="space-y-3 mb-5">
                  {fees.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-1">
                      <label htmlFor={`fee-${item.id}`} className="text-sm text-foreground flex-1">{item.service}</label>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-muted-foreground">₱</span>
                        <input
                          id={`fee-${item.id}`}
                          name={`fee-${item.id}`}
                          type="number"
                          value={item.fee}
                          onChange={e => { setFees(fs => fs.map(f => f.id === item.id ? { ...f, fee: parseInt(e.target.value) || 0 } : f)); mark(`fee-${item.id}`); }}
                          className="w-24 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                          min="0"
                        />
                        {modified[`fee-${item.id}`] && (
                          <button onClick={() => saveFee(item.id)} className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">Certificate Templates</h2>
                {templateEditor ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground text-sm">Editing: {templateEditor.name}</h3>
                      <button onClick={() => setTemplateEditor(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <XIcon size={15} />
                      </button>
                    </div>
                    <div>
                      <label htmlFor="template-header" className="block text-xs text-muted-foreground mb-1.5">Header Text</label>
                      <input id="template-header" name="header" type="text" value={templateEditor.header} onChange={e => setTemplateEditor(t => ({ ...t!, header: e.target.value }))} className={inputCls} placeholder="Republic of the Philippines" />
                    </div>
                    <div>
                      <label htmlFor="template-footer" className="block text-xs text-muted-foreground mb-1.5">Footer Text</label>
                      <input id="template-footer" name="footer" type="text" value={templateEditor.footer} onChange={e => setTemplateEditor(t => ({ ...t!, footer: e.target.value }))} className={inputCls} placeholder="Not valid without seal" />
                    </div>
                    <div>
                      <label htmlFor="template-officer" className="block text-xs text-muted-foreground mb-1.5">Signing Officer Title</label>
                      <input id="template-officer" name="officer" type="text" value={templateEditor.officer} onChange={e => setTemplateEditor(t => ({ ...t!, officer: e.target.value }))} className={inputCls} placeholder="Barangay Captain" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-all"
                      >
                        <Eye size={13} /> Preview
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const key = `template_${templateEditor.name.toLowerCase().replace(/\s+/g, "_")}`;
                            await Promise.all([
                              saveSettings(`${key}_header`, templateEditor.header, user?.name || "System"),
                              saveSettings(`${key}_footer`, templateEditor.footer, user?.name || "System"),
                              saveSettings(`${key}_officer`, templateEditor.officer, user?.name || "System"),
                            ]);
                            toast.success(`${templateEditor.name} template saved`);
                            setTemplateEditor(null);
                          } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save template"); }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all"
                      >
                        <Save size={13} /> Save Template
                      </button>
                      <button onClick={() => setTemplateEditor(null)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {["Barangay Clearance", "Barangay Certificate", "Certificate of Indigency", "Certificate of Residency", "Business Clearance", "Good Moral Certificate"].map(template => {
                      const key = `template_${template.toLowerCase().replace(/\s+/g, "_")}`;
                      const savedHeader = settingsMap[`${key}_header`];
                      const savedFooter = settingsMap[`${key}_footer`];
                      const savedOfficer = settingsMap[`${key}_officer`];
                      return (
                        <div key={template} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={15} className="text-emerald-500 shrink-0" />
                            <span className="text-sm text-foreground truncate">{template}</span>
                            {(savedHeader || savedFooter) && <span className="text-[0.6rem] text-emerald-500 font-medium bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded">custom</span>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setTemplateEditor({
                                name: template,
                                header: savedHeader || "Republic of the Philippines",
                                footer: savedFooter || "Not valid without seal",
                                officer: savedOfficer || "Barangay Captain",
                              })}
                              className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: "notif_new_request", label: "New Document Request", desc: "Notify when a new request is submitted", default: true },
                    { key: "notif_ready", label: "Request Ready for Pick-up", desc: "Notify when a document is ready", default: true },
                    { key: "notif_blotter_update", label: "Blotter Case Updates", desc: "Notify on case status changes", default: true },
                    { key: "notif_new_blotter", label: "New Blotter Filing", desc: "Notify when a new case is filed", default: false },
                    { key: "notif_weekly", label: "Weekly Summary Report", desc: "Receive weekly digest every Monday", default: true },
                  ].map(notif => {
                    const enabled = settingsMap[notif.key] !== undefined ? settingsMap[notif.key] === "true" : notif.default;
                    return (
                      <div key={notif.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{notif.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{notif.desc}</div>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !enabled;
                            try {
                              await saveSettings(notif.key, String(next), user?.name || "System");
                              setSettingsMap(m => ({ ...m, [notif.key]: String(next) }));
                              toast.success(`${notif.label} ${next ? "enabled" : "disabled"}`);
                            } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-500" : "bg-muted"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="session-timeout" className="block text-xs text-muted-foreground mb-1.5">Session Timeout</label>
                    <select id="session-timeout" name="session_timeout" value={settingsMap["session_timeout"] ?? "30"} onChange={async e => { try { await saveSettings("session_timeout", e.target.value, user?.name || "System"); setSettingsMap(m => ({ ...m, session_timeout: e.target.value })); toast.success("Session timeout updated"); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); } }} className={inputCls}>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="120">120 minutes</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="password-expiry" className="block text-xs text-muted-foreground mb-1.5">Password Expiry Policy</label>
                    <select id="password-expiry" name="password_expiry" value={settingsMap["password_expiry"] ?? "90"} onChange={async e => { try { await saveSettings("password_expiry", e.target.value, user?.name || "System"); setSettingsMap(m => ({ ...m, password_expiry: e.target.value })); toast.success("Password expiry updated"); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); } }} className={inputCls}>
                      <option value="90">Every 90 days</option>
                      <option value="180">Every 180 days</option>
                      <option value="365">Every year</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                  {[
                    { key: "security_2fa", label: "Two-Factor Authentication", desc: "Require 2FA for all admin users", default: false },
                    { key: "security_ip_whitelist", label: "IP Whitelist", desc: "Only allow access from barangay network", default: false },
                    { key: "security_login_alerts", label: "Login Alerts", desc: "Email alert on login from new device", default: true },
                  ].map(item => {
                    const enabled = settingsMap[item.key] !== undefined ? settingsMap[item.key] === "true" : item.default;
                    return (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !enabled;
                            try {
                              await saveSettings(item.key, String(next), user?.name || "System");
                              setSettingsMap(m => ({ ...m, [item.key]: String(next)}));
                              toast.success(`${item.label} ${next ? "enabled" : "disabled"}`);
                            } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-500" : "bg-muted"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-foreground mb-5 text-sm">System Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="block text-xs text-muted-foreground mb-1.5">Default Language</label>
                    <select id="language" name="language" value={settingsMap["language"] ?? "en"} onChange={async e => { try { await saveSettings("language", e.target.value, user?.name || "System"); setSettingsMap(m => ({ ...m, language: e.target.value })); toast.success("Language updated"); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); } }} className={inputCls}>
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date-format" className="block text-xs text-muted-foreground mb-1.5">Date Format</label>
                    <select id="date-format" name="date_format" value={settingsMap["date_format"] ?? "MM/DD/YYYY"} onChange={async e => { try { await saveSettings("date_format", e.target.value, user?.name || "System"); setSettingsMap(m => ({ ...m, date_format: e.target.value })); toast.success("Date format updated"); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); } }} className={inputCls}>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timezone" className="block text-xs text-muted-foreground mb-1.5">Time Zone</label>
                    <select id="timezone" name="timezone" className={inputCls} disabled>
                      <option>Asia/Manila (UTC+8)</option>
                    </select>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-2">Danger Zone</h3>
                    <p className="text-amber-600/80 dark:text-amber-400/80 text-xs mb-3">Irreversible actions. Proceed with extreme caution.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDangerAction("clear-documents")}
                        className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors"
                      >
                        Clear Document Requests
                      </button>
                      <button
                        onClick={() => setDangerAction("clear-residents")}
                        className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors"
                      >
                        Clear Residents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">Certificate Preview</DialogTitle>
          <div className="border-2 border-double border-emerald-700 rounded-xl p-8 text-center bg-white font-serif">
            <div className="border-b-2 border-emerald-700 pb-3 mb-4">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileText size={24} className="text-emerald-600" />
              </div>
              {templateEditor && (
                <>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{templateEditor.header}</p>
                  <h3 className="text-lg font-bold text-foreground">{templateEditor.name}</h3>
                </>
              )}
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground italic">This certifies that</p>
              <p className="text-xl font-bold text-foreground">[Resident Name]</p>
              <p className="text-xs text-muted-foreground">
                is a legitimate resident of Barangay Payatas, Quezon City, and is hereby issued this certificate for whatever legal purpose it may serve.
              </p>
            </div>
            <div className="border-t-2 border-emerald-700 pt-4">
              <div className="w-32 h-0.5 bg-emerald-300 mx-auto mb-3" />
              {templateEditor && (
                <>
                  <p className="text-xs text-muted-foreground">{templateEditor.footer}</p>
                  <p className="text-sm font-semibold text-foreground mt-4">{templateEditor.officer}</p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={dangerAction !== null}
        onOpenChange={(v) => { if (!v) setDangerAction(null); }}
        title={dangerAction === "clear-documents" ? "Clear Document Requests" : "Delete All Residents"}
        description={dangerAction === "clear-documents" ? "Clear ALL document requests? This cannot be undone." : "Delete all resident records? This cannot be undone."}
        confirmLabel={dangerAction === "clear-documents" ? "Clear" : "Delete All"}
        onConfirm={async () => {
          if (!dangerAction) return;
          try {
            const token = getSessionToken();
            if (!token || !supabase) return;
            if (dangerAction === "clear-documents") {
              const { error } = await supabase.rpc("admin_clear_documents", { p_token: token, p_logged_in_user: user?.name || "System" });
              if (error) throw new Error(error.message);
              toast.success("Document requests cleared");
            } else {
              const { error } = await supabase.rpc("admin_clear_residents", { p_token: token, p_logged_in_user: user?.name || "System" });
              if (error) throw new Error(error.message);
              toast.success("Residents cleared");
            }
            setDangerAction(null);
          } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to clear data"); }
        }}
      />
    </div>
  );
};

export default AdminSettings;
