import React, { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { FileText, CheckCircle, Copy, ArrowRight, Leaf, Clock, AlertCircle, Printer, Upload } from "lucide-react";
import { toast } from "sonner";
import { useData } from "./DataContext";
import { insertDocument } from "@/lib/supabaseWrite";
import { documentRequestSchema } from "@/lib/validations";

type Step = "form" | "success";

const generateRef = () => {
  const date = new Date();
  const yr = date.getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `REQ-${yr}-${seq}`;
};

const PublicDocumentApplication: React.FC = () => {
  const { services } = useData();
  const [step, setStep] = useState<Step>("form");
  const [refNumber, setRefNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    serviceType: "",
    firstName: "", lastName: "", middleName: "",
    address: "", contact: "", email: "",
    purpose: "", notes: "",
    agreeToTerms: false,
  });
  const [idUpload, setIdUpload] = useState("");
  const [idUploadName, setIdUploadName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const result = documentRequestSchema.safeParse(form);
    const e: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!e[field]) e[field] = issue.message;
      }
    }
    if (!idUpload) e.idUpload = "Please upload a valid ID";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const ref = generateRef();
    try {
      await insertDocument({
        id: ref,
        resident: `${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
        type: form.serviceType,
        purpose: form.purpose,
        date: new Date().toISOString().split("T")[0] ?? "",
        contact: form.contact,
        id_upload: idUpload || undefined,
      });
    } catch { toast.error("Failed to submit — try again"); return; }
    setRefNumber(ref);
    setStep("success");
  };

  const copyRef = () => {
    navigator.clipboard.writeText(refNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printReceipt = () => {
    const svc = services.find(s => s.title === form.serviceType);
    const name = `${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim();
    const today = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html>
<head><title>Receipt - ${refNumber}</title>
<style>
  @page { margin: 15mm; }
  body { font-family: 'Courier New', monospace; font-size: 13px; color: #222; margin: 0; padding: 0; }
  .receipt { max-width: 360px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; border-bottom: 2px dashed #222; padding-bottom: 12px; margin-bottom: 12px; }
  .header h1 { font-size: 16px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px; }
  .header p { font-size: 11px; margin: 0; color: #555; }
  .title { text-align: center; font-size: 14px; font-weight: bold; margin: 12px 0; text-transform: uppercase; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ccc; }
  .row .lbl { color: #666; }
  .row .val { font-weight: bold; text-align: right; }
  .ref-box { text-align: center; margin: 14px 0; padding: 10px; border: 2px dashed #059669; }
  .ref-box .ref { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #059669; }
  .ref-box .label { font-size: 10px; color: #666; margin-bottom: 4px; }
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 14px; border-top: 1px dashed #ccc; padding-top: 10px; }
  .status { text-align: center; margin: 10px 0; }
  .status span { background: #059669; color: #fff; padding: 3px 14px; border-radius: 2px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Barangay Payatas</h1>
    <p>Litex Road, Barangay Payatas, Quezon City</p>
    <p>payatas.ledger@qc.gov.ph | +63 2 8123 4567</p>
  </div>
  <div class="title">Official Receipt</div>
  <div class="ref-box">
    <div class="label">Reference Number</div>
    <div class="ref">${refNumber}</div>
  </div>
  <div class="row"><span class="lbl">Date</span><span class="val">${today}</span></div>
  <div class="row"><span class="lbl">Document Type</span><span class="val">${form.serviceType}</span></div>
  <div class="row"><span class="lbl">Applicant</span><span class="val">${name}</span></div>
  <div class="row"><span class="lbl">Purpose</span><span class="val">${form.purpose}</span></div>
  <div class="row"><span class="lbl">Fee</span><span class="val">${svc?.fee || "N/A"}</span></div>
  <div class="row"><span class="lbl">Processing Time</span><span class="val">${svc?.duration || "varies"}</span></div>
  <div class="row"><span class="lbl">Status</span><span class="val">Pending</span></div>
  <div class="status"><span>Pending</span></div>
  <div class="footer">
    <p>This is a system-generated receipt. Present this reference number when claiming your document.</p>
    <p>Office Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
    <p>Powered by Payatas Ledger</p>
  </div>
</div>
</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdUploadName(file.name);
    const reader = new FileReader();
    reader.onload = () => setIdUpload(reader.result as string);
    reader.readAsDataURL(file);
  };

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 ${
      errors[field] ? "border-red-400 dark:border-red-600" : "border-border focus:border-emerald-400"
    }`;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
          <FileText size={11} /> Online Application
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Request a Document</h1>
        <p className="text-emerald-200/60 text-sm max-w-lg mx-auto">Fill out the form below to request a barangay document. You'll receive a reference number to track your application.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-foreground mb-6" style={{ fontSize: "1.15rem" }}>Application Form</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Service type */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Document / Service Type <span className="text-red-500">*</span></label>
                    <select
                      value={form.serviceType}
                      onChange={e => set("serviceType", e.target.value)}
                      className={inputCls("serviceType")}
                    >
                      <option value="">Select a service…</option>
                      {services.map(s => <option key={s.id} value={s.title}>{s.title} – {s.fee}</option>)}
                    </select>
                    {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>}
                  </div>

                  {/* Name */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">First Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Juan" value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls("firstName")} />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Middle Name</label>
                      <input type="text" placeholder="Santos" value={form.middleName} onChange={e => set("middleName", e.target.value)} className={inputCls("middleName")} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Dela Cruz" value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls("lastName")} />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Complete Address <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="House/Unit No., Street, Purok" value={form.address} onChange={e => set("address", e.target.value)} className={inputCls("address")} />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Contact No. <span className="text-red-500">*</span></label>
                      <input type="tel" placeholder="09XXXXXXXXX" value={form.contact} onChange={e => set("contact", e.target.value)} className={inputCls("contact")} />
                      {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Email Address</label>
                      <input type="email" placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls("email")} />
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Purpose <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g., Employment, School Enrollment, Bank Account Opening…" value={form.purpose} onChange={e => set("purpose", e.target.value)} className={inputCls("purpose")} />
                    {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Additional Notes</label>
                    <textarea rows={3} placeholder="Any special instructions or notes…" value={form.notes} onChange={e => set("notes", e.target.value)} className={`${inputCls("notes")} resize-none`} />
                  </div>

                  {/* Valid ID upload */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Upload Valid ID <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-input-background cursor-pointer hover:border-emerald-400 transition-colors text-sm text-muted-foreground">
                        <Upload size={14} />
                        {idUploadName ? idUploadName : "Choose file…"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                      </label>
                      {idUploadName && <button type="button" onClick={() => { setIdUpload(""); setIdUploadName(""); }} className="text-xs text-red-500 hover:underline">Remove</button>}
                    </div>
                    {errors.idUpload && <p className="text-red-500 text-xs mt-1">{errors.idUpload}</p>}
                  </div>

                  {/* Fee notice */}
                  {form.serviceType && (
                    <div className="bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle size={15} className="text-sky-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-sky-700 dark:text-sky-300">
                        <strong>Fee:</strong> {services.find(s => s.title === form.serviceType)?.fee || "N/A"} — payable upon pick-up at the Barangay Hall.
                        <br /><strong>Processing time:</strong> {services.find(s => s.title === form.serviceType)?.duration || "varies"}.
                      </div>
                    </div>
                  )}

                  {/* Terms */}
                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.agreeToTerms}
                        onChange={e => set("agreeToTerms", e.target.checked)}
                        className="mt-0.5 rounded"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I certify that all information provided is true and correct. I understand that providing false information may result in the denial of my request or legal action.
                      </span>
                    </label>
                    {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all"
                  >
                    Submit Application <ArrowRight size={16} />
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
                <h2 className="font-bold text-foreground mb-2" style={{ fontSize: "1.3rem" }}>Application Submitted!</h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Your request for <strong>{form.serviceType}</strong> has been received. Please save your reference number below.
                </p>

                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
                  <div className="text-xs text-muted-foreground mb-2">Your Reference Number</div>
                  <div className="font-bold text-2xl text-emerald-700 dark:text-emerald-300 mb-3 tracking-wider">{refNumber}</div>
                  <button onClick={copyRef} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors font-medium">
                    <Copy size={14} /> {copied ? "Copied!" : "Copy Reference"}
                  </button>
                </div>

                <button onClick={printReceipt} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition-all mb-5">
                  <Printer size={15} /> Print Receipt
                </button>

                <div className="bg-muted rounded-xl p-4 text-left mb-6">
                  <h3 className="font-semibold text-sm text-foreground mb-2">What's next?</h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><Clock size={12} className="mt-0.5 shrink-0 text-emerald-500" /> Your document will be processed within the stated timeframe.</li>
                    <li className="flex items-start gap-2"><CheckCircle size={12} className="mt-0.5 shrink-0 text-emerald-500" /> You may check the status using your reference number at the barangay hall, via phone, or <Link to="/registry" className="text-emerald-600 dark:text-emerald-400 underline">track online here</Link>.</li>
                    <li className="flex items-start gap-2"><FileText size={12} className="mt-0.5 shrink-0 text-emerald-500" /> Bring your valid ID and the required documents when claiming.</li>
                  </ul>
                </div>

                <button
                  onClick={() => { setStep("form"); setForm({ serviceType: "", firstName: "", lastName: "", middleName: "", address: "", contact: "", email: "", purpose: "", notes: "", agreeToTerms: false }); setIdUpload(""); setIdUploadName(""); }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
                >
                  Submit Another Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PublicDocumentApplication;
