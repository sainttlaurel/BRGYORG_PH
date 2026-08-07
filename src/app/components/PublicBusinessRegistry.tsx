import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Store, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { insertBusiness } from "@/lib/supabaseWrite";
import SeoHead from "./SeoHead";

const categories = ["Retail", "Food", "Services", "Manufacturing", "Wholesale", "Other"];

const emptyForm = { name: "", owner: "", category: "Retail", contact: "", address: "", description: "" };

const PublicBusinessRegistry: React.FC = () => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    if (!form.owner.trim()) e.owner = "Owner name is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await insertBusiness(form);
      setStep("success");
    } catch { toast.error("Failed to submit — try again"); }
    finally { setLoading(false); }
  };

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 ${
      errors[field] ? "border-red-400 dark:border-red-600" : "border-border focus:border-emerald-400"
    }`;

  return (
    <>
      <SeoHead title="Business Registration" description="Register your business with Barangay Payatas online." path="/business-registry" />
      <div>
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
            <Store size={11} /> Business Registration
          </div>
          <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Register Your Business</h1>
          <p className="text-emerald-200/60 text-sm max-w-lg mx-auto">Register your business with Barangay Payatas. Approved registrations will be listed in the official business registry.</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-foreground mb-6" style={{ fontSize: "1.15rem" }}>Business Information</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="biz-name" className="block text-sm text-muted-foreground mb-1.5">Business Name <span className="text-red-500">*</span></label>
                        <input id="biz-name" name="biz-name" type="text" value={form.name} onChange={e => set("name", e.target.value)} className={inputCls("name")} placeholder="e.g. Payatas Grocery" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="biz-owner" className="block text-sm text-muted-foreground mb-1.5">Owner <span className="text-red-500">*</span></label>
                        <input id="biz-owner" name="biz-owner" type="text" value={form.owner} onChange={e => set("owner", e.target.value)} className={inputCls("owner")} placeholder="Full name of owner" />
                        {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="biz-category" className="block text-sm text-muted-foreground mb-1.5">Category</label>
                        <select id="biz-category" name="biz-category" value={form.category} onChange={e => set("category", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-input-background outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="biz-contact" className="block text-sm text-muted-foreground mb-1.5">Contact Number</label>
                        <input id="biz-contact" name="biz-contact" type="text" value={form.contact} onChange={e => set("contact", e.target.value)} className={inputCls("contact")} placeholder="e.g. 0917xxxxxxx" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="biz-address" className="block text-sm text-muted-foreground mb-1.5">Business Address</label>
                      <input id="biz-address" name="biz-address" type="text" value={form.address} onChange={e => set("address", e.target.value)} className={inputCls("address")} placeholder="Complete business address in Barangay Payatas" />
                    </div>
                    <div>
                      <label htmlFor="biz-description" className="block text-sm text-muted-foreground mb-1.5">Description</label>
                      <textarea id="biz-description" name="biz-description" rows={3} value={form.description} onChange={e => set("description", e.target.value)} className={inputCls("description")} placeholder="Brief description of your business" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : "Register Business"}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Registration Submitted!</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">Thank you! Your business registration has been submitted for review. We will notify you once it has been approved.</p>
                <button onClick={() => { setStep("form"); setForm(emptyForm); }} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all">Register Another Business</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default PublicBusinessRegistry;
