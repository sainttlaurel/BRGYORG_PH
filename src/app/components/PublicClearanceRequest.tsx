import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileCheck, Search, CheckCircle, XCircle, Clock, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { insertClearanceRequest } from "@/lib/supabaseWrite";
import { checkClearanceStatus } from "@/lib/supabase";
import SeoHead from "./SeoHead";

type Tab = "apply" | "check";

const docTypes = ["Barangay Clearance", "Barangay Certificate", "Certificate of Indigency", "Certificate of Residency", "Business Clearance", "Good Moral Certificate"];

function generateControlNumber() {
  const yr = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `CLR-${yr}-${seq}`;
}

function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface StatusResult {
  found: boolean; status?: string; doc_type?: string; full_name?: string;
  created_at?: string; approved_at?: string | null; rejected_at?: string | null; notes?: string; error?: string;
}

const PublicClearanceRequest: React.FC = () => {
  const [tab, setTab] = useState<Tab>("apply");

  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ full_name: "", address: "", purpose: "", doc_type: "Barangay Clearance", contact: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ control_number: string; verification_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [checkForm, setCheckForm] = useState({ control_number: "", verification_code: "" });
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<StatusResult | null>(null);
  const [checkDone, setCheckDone] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.purpose.trim()) e.purpose = "Purpose is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const control_number = generateControlNumber();
    const verification_code = generateVerificationCode();
    try {
      await insertClearanceRequest({ ...form, control_number, verification_code });
      setResult({ control_number, verification_code });
      setStep("success");
    } catch { toast.error("Failed to submit — try again"); }
    finally { setLoading(false); }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkForm.control_number.trim() || !checkForm.verification_code.trim()) {
      toast.error("Both fields are required"); return;
    }
    setCheckLoading(true);
    setCheckDone(false);
    try {
      const res = await checkClearanceStatus(checkForm.control_number.trim(), checkForm.verification_code.trim());
      setCheckResult(res);
    } catch { toast.error("Failed to check status"); }
    finally { setCheckLoading(false); setCheckDone(true); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 ${
      errors[field] ? "border-red-400 dark:border-red-600" : "border-border focus:border-emerald-400"
    }`;

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", icon: <Clock size={14} /> },
      approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", icon: <CheckCircle size={14} /> },
      rejected: { color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", icon: <XCircle size={14} /> },
    };
    const cfg = map[status] ?? { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", icon: <Clock size={14} /> };
    return <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.icon} {status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <>
      <SeoHead title="Clearance Request" description="Apply for a barangay clearance online or check your application status." path="/clearance-request" />
      <div>
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
            <FileCheck size={11} /> Barangay Clearance
          </div>
          <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Clearance Request</h1>
          <p className="text-emerald-200/60 text-sm max-w-lg mx-auto">Apply for a barangay clearance online or check the status of your existing application.</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-8">
            <button onClick={() => setTab("apply")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "apply" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Apply for Clearance
            </button>
            <button onClick={() => setTab("check")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "check" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Search size={14} className="inline mr-1" /> Check Status
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "apply" ? (
              <motion.div key="apply" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {step === "form" ? (
                  <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-foreground mb-6" style={{ fontSize: "1.15rem" }}>Application Form</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="clr-name" className="block text-sm text-muted-foreground mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input id="clr-name" name="clr-name" type="text" value={form.full_name} onChange={e => { setForm(f => ({ ...f, full_name: e.target.value })); setErrors(e => { const n = { ...e }; delete n.full_name; return n; }); }} className={inputCls("full_name")} placeholder="e.g. Juan Dela Cruz" />
                        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                      </div>
                      <div>
                        <label htmlFor="clr-address" className="block text-sm text-muted-foreground mb-1.5">Address <span className="text-red-500">*</span></label>
                        <input id="clr-address" name="clr-address" type="text" value={form.address} onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(e => { const n = { ...e }; delete n.address; return n; }); }} className={inputCls("address")} placeholder="Complete address in Barangay Payatas" />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="clr-doc-type" className="block text-sm text-muted-foreground mb-1.5">Document Type</label>
                          <select id="clr-doc-type" name="clr-doc-type" value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-input-background outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700">
                            {docTypes.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="clr-contact" className="block text-sm text-muted-foreground mb-1.5">Contact Number</label>
                          <input id="clr-contact" name="clr-contact" type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-input-background outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700" placeholder="e.g. 0917xxxxxxx" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="clr-purpose" className="block text-sm text-muted-foreground mb-1.5">Purpose <span className="text-red-500">*</span></label>
                        <textarea id="clr-purpose" name="clr-purpose" rows={3} value={form.purpose} onChange={e => { setForm(f => ({ ...f, purpose: e.target.value })); setErrors(e => { const n = { ...e }; delete n.purpose; return n; }); }} className={inputCls("purpose")} placeholder="e.g. Employment requirement, Business permit, School enrollment" />
                        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : "Submit Application"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
                    <p className="text-muted-foreground text-sm mb-6">Save these reference details to track your application:</p>
                    {result && (
                      <div className="bg-muted rounded-xl p-4 mb-6 max-w-sm mx-auto space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">Control Number</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold font-mono text-foreground">{result.control_number}</span>
                            <button onClick={() => copyToClipboard(result.control_number)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-card text-muted-foreground"><Copy size={13} /></button>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">Verification Code</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold font-mono text-foreground">{result.verification_code}</span>
                            <button onClick={() => copyToClipboard(result.verification_code)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-card text-muted-foreground">{copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}</button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button onClick={() => setTab("check")} className="px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                        <Search size={14} /> Check Status
                      </button>
                      <button onClick={() => { setStep("form"); setForm({ full_name: "", address: "", purpose: "", doc_type: "Barangay Clearance", contact: "" }); setResult(null); }} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all">
                        Submit Another
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="check" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-foreground mb-6" style={{ fontSize: "1.15rem" }}>Check Clearance Status</h2>
                  <form onSubmit={handleCheck} className="space-y-4">
                    <div>
                      <label htmlFor="clr-check-control" className="block text-sm text-muted-foreground mb-1.5">Control Number</label>
                      <input id="clr-check-control" name="clr-check-control" type="text" value={checkForm.control_number} onChange={e => setCheckForm(f => ({ ...f, control_number: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-input-background outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700" placeholder="e.g. CLR-2026-123456" />
                    </div>
                    <div>
                      <label htmlFor="clr-check-code" className="block text-sm text-muted-foreground mb-1.5">Verification Code</label>
                      <input id="clr-check-code" name="clr-check-code" type="text" value={checkForm.verification_code} onChange={e => setCheckForm(f => ({ ...f, verification_code: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-input-background outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700" placeholder="e.g. A3B2C9" />
                    </div>
                    <button type="submit" disabled={checkLoading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {checkLoading ? <><Loader2 size={15} className="animate-spin" /> Checking…</> : <><Search size={15} /> Check Status</>}
                    </button>
                  </form>

                  {checkDone && checkResult && (
                    <div className="mt-6 pt-6 border-t border-border">
                      {checkResult.found ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-4">{statusBadge(checkResult.status || "pending")}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {[
                              { label: "Name", value: checkResult.full_name },
                              { label: "Document Type", value: checkResult.doc_type },
                              { label: "Date Filed", value: checkResult.created_at ? new Date(checkResult.created_at).toLocaleDateString() : "—" },
                              { label: "Approved", value: checkResult.approved_at ? new Date(checkResult.approved_at).toLocaleDateString() : "—" },
                              { label: "Rejected", value: checkResult.rejected_at ? new Date(checkResult.rejected_at).toLocaleDateString() : "—" },
                            ].map(item => (
                              <div key={item.label} className="flex justify-between border-b border-border pb-1.5">
                                <span className="text-xs text-muted-foreground">{item.label}</span>
                                <span className="text-xs font-medium text-foreground">{item.value}</span>
                              </div>
                            ))}
                          </div>
                          {checkResult.notes && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Remarks:</span>
                              <p className="text-xs text-foreground mt-0.5 bg-muted/50 rounded-xl p-3">{checkResult.notes}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <XCircle size={32} className="text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">{checkResult.error || "No matching clearance request found. Please check your control number and verification code."}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default PublicClearanceRequest;
