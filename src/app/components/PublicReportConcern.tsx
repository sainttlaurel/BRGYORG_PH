import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle, Search, Clock, Copy, Loader2 } from "lucide-react";
import { insertReport, getReportByRef, genId } from "../../lib/supabaseWrite";
import SeoHead from "./SeoHead";

type Step = "form" | "success" | "track";

const urgencyLevels = [
  { id: "low", label: "Low", desc: "Non-urgent, general concern", color: "border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
  { id: "medium", label: "Medium", desc: "Needs attention within a week", color: "border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  { id: "high", label: "High", desc: "Urgent, needs immediate action", color: "border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
];

const categories = ["Illegal Dumping", "Road/Sidewalk Damage", "Broken Street Light", "Noise Complaint", "Health Hazard", "Drug Activity", "Illegal Structure", "Water Leak", "Flooding", "Other"];

const generateRef = () => genId('RPT');

const barangayHotline = "(02) 8-1234-5678";

const PublicReportConcern: React.FC = () => {
  const [view, setView] = useState<"form" | "track">("form");
  const [step, setStep] = useState<Step>("form");
  const [refNumber, setRefNumber] = useState("");
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState<Record<string, string> | null | "not_found">(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "", description: "", location: "", urgency: "",
    reporterName: "", reporterContact: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Please select a category";
    if (!form.description.trim() || form.description.length < 20) e.description = "Minimum 20 characters";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.urgency) e.urgency = "Please select urgency level";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setError("");
    try {
      const ref = generateRef();
      await insertReport({
        id: ref, category: form.category, description: form.description,
        location: form.location, urgency: form.urgency,
        reporter_name: form.reporterName || undefined,
        reporter_contact: form.reporterContact || undefined,
      });
      setRefNumber(ref);
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = trackQuery.trim().toUpperCase();
    if (!q) return;
    setTrackLoading(true);
    try {
      const variations = [q];
      if (!q.startsWith('RPT-')) variations.push(`RPT-${q}`, `RPT${q}`, q.replace(/^0+/, ''));
      if (q.startsWith('RPT-')) variations.push(q.replace('RPT-', ''), q.replace('RPT-', 'RPT'));
      const stripped = q.replace(/[^A-Z0-9]/g, '');
      if (stripped !== q) variations.push(stripped);
      let result: Record<string, string> | null = null;
      for (const v of [...new Set(variations)]) {
        result = await getReportByRef(v) as Record<string, string> | null;
        if (result) break;
      }
      setTrackResult(result || "not_found");
    } catch {
      setTrackResult("not_found");
    } finally {
      setTrackLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 ${
      errors[field] ? "border-red-400" : "border-border"
    }`;

  return (
    <>
      <SeoHead title="Report a Concern" description="Report a concern, issue, or incident to Barangay Payatas authorities." path="/report-concern" />
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-700 to-red-900 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-medium mb-4">
          <AlertTriangle size={11} /> Community Safety
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Report a Concern</h1>
        <p className="text-orange-200/60 text-sm max-w-lg mx-auto">Report issues in your community. Your report helps us maintain a safe and livable barangay.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {[
            { key: "form", label: "Submit Report", icon: AlertTriangle },
            { key: "track", label: "Track Report", icon: Search },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setView(t.key as "form" | "track"); setTrackResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                view === t.key ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {view === "form" ? (
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm text-muted-foreground mb-1.5">Concern Type <span className="text-red-500">*</span></label>
                      <select id="category" name="category" value={form.category} onChange={e => set("category", e.target.value)} className={inputCls("category")}>
                        <option value="">Select concern type…</option>
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                      {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>

                    {/* Urgency */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Urgency Level <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {urgencyLevels.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => set("urgency", u.id)}
                            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                              form.urgency === u.id ? u.color : "border-border text-muted-foreground hover:border-gray-300"
                            }`}
                          >
                            <div>{u.label}</div>
                            <div className="opacity-70 mt-0.5" style={{ fontSize: "0.65rem" }}>{u.desc}</div>
                          </button>
                        ))}
                      </div>
                      {errors.urgency && <p className="text-red-500 text-xs mt-1">{errors.urgency}</p>}
                    </div>

                    {/* Location */}
                    <div>
                      <label htmlFor="location" className="block text-sm text-muted-foreground mb-1.5">Location / Address <span className="text-red-500">*</span></label>
                      <input id="location" name="location" type="text" value={form.location} onChange={e => set("location", e.target.value)} className={inputCls("location")} placeholder="Exact address or landmark" />
                      {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm text-muted-foreground mb-1.5">Description <span className="text-red-500">*</span></label>
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                        placeholder="Describe the concern in detail. Include when it started, what happened, and any relevant information."
                        className={`${inputCls("description")} resize-none`}
                      />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Optional reporter info */}
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Contact Information (Optional – for follow-up only)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input id="reporterName" name="reporterName" type="text" value={form.reporterName} onChange={e => set("reporterName", e.target.value)} className={inputCls("reporterName")} placeholder="Your name" />
                        <input id="reporterContact" name="reporterContact" type="tel" value={form.reporterContact} onChange={e => set("reporterContact", e.target.value)} className={inputCls("reporterContact")} placeholder="Your contact no." />
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition-all disabled:opacity-50">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />} {loading ? "Submitting…" : "Submit Report"}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="font-bold text-foreground mb-2" style={{ fontSize: "1.3rem" }}>Report Submitted!</h2>
                  <p className="text-muted-foreground text-sm mb-6">Your concern has been recorded. Use the reference number below to track its status.</p>
                  <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-5">
                    <div className="text-xs text-muted-foreground mb-1">Reference Number</div>
                    <div className="font-bold text-2xl text-orange-700 dark:text-orange-300 mb-2 tracking-wider">{refNumber}</div>
                    <button onClick={() => { navigator.clipboard.writeText(refNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-medium">
                      <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground mb-5 flex items-center gap-2">
                    <Clock size={12} className="text-orange-500 shrink-0" />
                    Expect a response within 3–5 business days. For urgent matters, call {barangayHotline}.
                  </div>
                  <button onClick={() => { setStep("form"); setForm({ category: "", description: "", location: "", urgency: "", reporterName: "", reporterContact: "" }); }} className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-all">
                    Submit Another Report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm mb-5">
              <h2 className="font-bold text-foreground mb-4">Track Your Report</h2>
              <form onSubmit={handleTrack} className="flex gap-2">
                <input
                  id="trackQuery"
                  name="trackQuery"
                  type="text"
                  value={trackQuery}
                  onChange={e => setTrackQuery(e.target.value)}
                  placeholder="Enter reference number (e.g. RPT-2026-1234)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
                <button type="submit" disabled={trackLoading} className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-all disabled:opacity-50">
                  {trackLoading ? <Loader2 size={14} className="animate-spin" /> : "Track"}
                </button>
              </form>
            </div>

            {trackResult !== null && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {trackResult === "not_found" ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Report not found</p>
                    <p className="text-xs mt-1">Check your reference number and try again.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-foreground">{trackQuery.toUpperCase()}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        trackResult.status === "resolved" || trackResult.status === "Action Taken" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      }`}>{trackResult.status}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Category: <span className="text-foreground font-medium">{trackResult.category}</span></div>
                      <div>Location: <span className="text-foreground font-medium">{trackResult.location}</span></div>
                      <div>Urgency: <span className="text-foreground font-medium capitalize">{trackResult.urgency}</span></div>
                      <div>Filed: <span className="text-foreground font-medium">{trackResult.created_at ? new Date(trackResult.created_at).toLocaleDateString() : "—"}</span></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default PublicReportConcern;
