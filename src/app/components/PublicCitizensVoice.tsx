import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, CheckCircle, Lock, Leaf, Loader2 } from "lucide-react";
import { insertSuggestion } from "../../lib/supabaseWrite";
import SeoHead from "./SeoHead";

type Category = "suggestion" | "complaint" | "commendation" | "inquiry";

const categories: { id: Category; label: string; color: string }[] = [
  { id: "suggestion", label: "Suggestion", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  { id: "complaint", label: "Complaint", color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" },
  { id: "commendation", label: "Commendation", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  { id: "inquiry", label: "Inquiry", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
];

const PublicCitizensVoice: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "" as Category | "", message: "", department: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Please select a category";
    if (!form.message.trim() || form.message.length < 20) e.message = "Message must be at least 20 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setError("");
    try {
      const dept = form.department ? `\n\nAddressed To: ${form.department}` : "";
      await insertSuggestion({ name: form.category, content: form.message + dept });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="Citizens' Voice" description="Share your suggestions and feedback with Barangay Payatas leadership." path="/citizens-voice" />
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
          <MessageSquare size={11} /> Anonymous Feedback
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Citizens' Voice</h1>
        <p className="text-emerald-200/60 text-sm max-w-lg mx-auto">Share your thoughts, suggestions, or concerns anonymously. Your voice helps shape our community.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Privacy notice */}
        <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
          <Lock size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-700 dark:text-emerald-300">
            <strong>100% Anonymous.</strong> No personal information is required. Your IP address is not recorded. All feedback is reviewed by barangay officials and may be used to improve services.
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-foreground mb-5" style={{ fontSize: "1.1rem" }}>Share Your Feedback</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Feedback Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => set("category", c.id)}
                          className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            form.category === c.id
                              ? `${c.color} border-current`
                              : "bg-muted text-muted-foreground border-transparent hover:border-border"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Addressed To (Optional)</label>
                    <select
                      value={form.department}
                      onChange={e => set("department", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                    >
                      <option value="">General / Barangay Council</option>
                      <option>Peace & Order Committee</option>
                      <option>Health & Sanitation</option>
                      <option>Education & Youth</option>
                      <option>Infrastructure & Environment</option>
                      <option>Social Services & Welfare</option>
                      <option>Livelihood & Enterprise</option>
                      <option>Barangay Administration</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Your Message <span className="text-red-500">*</span></label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={e => set("message", e.target.value)}
                      placeholder="Write your feedback, suggestion, or concern here. Be as specific as possible so we can address it properly. Minimum 20 characters."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all ${
                        errors.message ? "border-red-400" : "border-border"
                      }`}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.message ? <p className="text-red-500 text-xs">{errors.message}</p> : <span />}
                      <span className="text-xs text-muted-foreground">{form.message.length} chars</span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all disabled:opacity-50">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {loading ? "Submitting…" : "Submit Anonymously"}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="font-bold text-foreground mb-2" style={{ fontSize: "1.3rem" }}>Feedback Received!</h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                  Thank you for sharing your thoughts. Your feedback has been securely submitted and will be reviewed by barangay officials.
                </p>
                <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground mb-6">
                  Category: <strong className="text-foreground">{categories.find(c => c.id === form.category)?.label}</strong>
                </div>
                <button
                  onClick={() => { setSubmitted(false); setForm({ category: "", message: "", department: "" }); }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
                >
                  Submit Another Feedback
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: "Fully Anonymous", desc: "No name, no email, no tracking." },
            { icon: MessageSquare, title: "Reviewed by Officials", desc: "Feedback is read and considered." },
            { icon: Leaf, title: "Community Impact", desc: "Your voice shapes barangay policy." },
          ].map(item => (
            <div key={item.title} className="bg-white dark:bg-card border border-border rounded-xl p-4 text-center">
              <item.icon size={18} className="mx-auto mb-2 text-emerald-500" />
              <div className="font-semibold text-sm text-foreground mb-1">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicCitizensVoice;
