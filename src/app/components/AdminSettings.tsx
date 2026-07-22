import React, { useState, useEffect } from "react";
import { Settings, Save, Bell, Shield, FileText, DollarSign, Leaf, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase, dbFetch, dbUpdate } from "@/lib/supabase";

const tabs = [
  { id: "profile", label: "Barangay Profile", icon: Leaf },
  { id: "fees", label: "Service Fees", icon: DollarSign },
  { id: "templates", label: "Certificate Templates", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "system", label: "System", icon: Settings },
];

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all";

async function saveSettings(key: string, value: string) {
  if (!supabase) return;
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: "", municipality: "", captain: "", hotline: "", email: "",
    address: "", office_hours: "", vision: "", mission: "",
  });
  const [fees, setFees] = useState<{ id: number; service: string; fee: number }[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});

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
        });
        setFees(feeRows.map(r => ({ id: Number(r.id ?? 0), service: String(r.service ?? ""), fee: Number(r.fee ?? 0) })));
        const sm: Record<string, string> = {};
        settingsRows.forEach(r => { sm[String(r.key ?? "")] = String(r.value ?? ""); });
        setSettingsMap(sm);
      } catch { toast.error("Failed to load settings"); }
      setLoading(false);
    })();
  }, []);

  const mark = (key: string) => setModified(m => ({ ...m, [key]: true }));

  const saveProfile = async () => {
    try {
      await dbUpdate("barangay_info", 1, profileForm);
      toast.success("Profile saved");
      setModified({});
    } catch { toast.error("Failed to save profile"); }
  };

  const saveFee = async (id: number) => {
    const item = fees.find(f => f.id === id);
    if (!item) return;
    try {
      await dbUpdate("service_fees", id, { fee: item.fee });
      toast.success(`${item.service} fee updated`);
      setModified(m => ({ ...m, [`fee-${id}`]: false }));
    } catch { toast.error("Failed to update fee"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-bold text-foreground" style={{ fontSize: "1.3rem" }}>Settings</h1>
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
                      <label className="block text-xs text-muted-foreground mb-1.5">Barangay Name</label>
                      <input type="text" value={profileForm.name} onChange={e => { setProfileForm(f => ({ ...f, name: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Municipality / City</label>
                      <input type="text" value={profileForm.municipality} onChange={e => { setProfileForm(f => ({ ...f, municipality: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Barangay Captain</label>
                    <input type="text" value={profileForm.captain} onChange={e => { setProfileForm(f => ({ ...f, captain: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Hotline</label>
                      <input type="text" value={profileForm.hotline} onChange={e => { setProfileForm(f => ({ ...f, hotline: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                      <input type="email" value={profileForm.email} onChange={e => { setProfileForm(f => ({ ...f, email: e.target.value })); mark("profile"); }} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Address</label>
                    <input type="text" value={profileForm.address} onChange={e => { setProfileForm(f => ({ ...f, address: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Office Hours</label>
                    <input type="text" value={profileForm.office_hours} onChange={e => { setProfileForm(f => ({ ...f, office_hours: e.target.value })); mark("profile"); }} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Vision</label>
                    <textarea rows={3} value={profileForm.vision} onChange={e => { setProfileForm(f => ({ ...f, vision: e.target.value })); mark("profile"); }} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Mission</label>
                    <textarea rows={3} value={profileForm.mission} onChange={e => { setProfileForm(f => ({ ...f, mission: e.target.value })); mark("profile"); }} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Barangay Seal / Logo</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                      <Upload size={18} className="mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Upload official seal (PNG, SVG)</p>
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
                      <label className="text-sm text-foreground flex-1">{item.service}</label>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-muted-foreground">₱</span>
                        <input
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
                <div className="space-y-3">
                  {["Barangay Clearance", "Barangay Certificate", "Certificate of Indigency", "Certificate of Residency", "Business Clearance", "Good Moral Certificate"].map(template => (
                    <div key={template} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={15} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-foreground truncate">{template}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => toast.info(`Preview ${template}`)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">Preview</button>
                        <button onClick={() => toast.info(`Edit ${template} template`)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
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
                              await saveSettings(notif.key, String(next));
                              setSettingsMap(m => ({ ...m, [notif.key]: String(next) }));
                              toast.success(`${notif.label} ${next ? "enabled" : "disabled"}`);
                            } catch { toast.error("Failed to update"); }
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
                    <label className="block text-xs text-muted-foreground mb-1.5">Session Timeout</label>
                    <select value={settingsMap["session_timeout"] ?? "30"} onChange={async e => { try { await saveSettings("session_timeout", e.target.value); setSettingsMap(m => ({ ...m, session_timeout: e.target.value })); toast.success("Session timeout updated"); } catch { toast.error("Failed to update"); } }} className={inputCls}>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="120">120 minutes</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Password Expiry Policy</label>
                    <select value={settingsMap["password_expiry"] ?? "90"} onChange={async e => { try { await saveSettings("password_expiry", e.target.value); setSettingsMap(m => ({ ...m, password_expiry: e.target.value })); toast.success("Password expiry updated"); } catch { toast.error("Failed to update"); } }} className={inputCls}>
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
                              await saveSettings(item.key, String(next));
                              setSettingsMap(m => ({ ...m, [item.key]: String(next)}));
                              toast.success(`${item.label} ${next ? "enabled" : "disabled"}`);
                            } catch { toast.error("Failed to update"); }
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
                    <label className="block text-xs text-muted-foreground mb-1.5">Default Language</label>
                    <select value={settingsMap["language"] ?? "en"} onChange={async e => { try { await saveSettings("language", e.target.value); setSettingsMap(m => ({ ...m, language: e.target.value })); toast.success("Language updated"); } catch { toast.error("Failed to update"); } }} className={inputCls}>
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Date Format</label>
                    <select value={settingsMap["date_format"] ?? "MM/DD/YYYY"} onChange={async e => { try { await saveSettings("date_format", e.target.value); setSettingsMap(m => ({ ...m, date_format: e.target.value })); toast.success("Date format updated"); } catch { toast.error("Failed to update"); } }} className={inputCls}>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Time Zone</label>
                    <select className={inputCls} disabled>
                      <option>Asia/Manila (UTC+8)</option>
                    </select>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-2">Danger Zone</h3>
                    <p className="text-amber-600/80 dark:text-amber-400/80 text-xs mb-3">Irreversible actions. Proceed with extreme caution.</p>
                    <button onClick={() => toast.error("This action requires IT Admin confirmation")} className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors">
                      Clear Test Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
