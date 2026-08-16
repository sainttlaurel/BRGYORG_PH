import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, Facebook, Twitter, Youtube, Loader2 } from "lucide-react";
import { useData } from "./DataContext";
import { insertContactMessage } from "@/lib/supabaseWrite";
import { toast } from "sonner";
import SeoHead from "./SeoHead";

const officeSchedule = [
  { day: "Monday – Friday", hours: "8:00 AM – 5:00 PM", open: true },
  { day: "Saturday", hours: "8:00 AM – 12:00 PM", open: true },
  { day: "Sunday & Holidays", hours: "Closed", open: false },
];

const departments = [
  "Office of the Barangay Captain",
  "Barangay Secretary",
  "Barangay Treasurer",
  "Peace & Order Committee",
  "Health & Sanitation",
  "Social Services & Welfare",
  "Youth & Sports",
  "Infrastructure & Environment",
];

const PublicContact: React.FC = () => {
  const { barangayInfo } = useData();
  const contacts = [
    { icon: Phone, label: "Main Hotline", value: barangayInfo.hotline, sub: "Mon–Fri 8AM–5PM; answered within minutes" },
    { icon: Phone, label: "Emergency", value: "911", sub: "24/7 emergency response" },
    { icon: Mail, label: "Email", value: barangayInfo.email, sub: "Response within 1-2 days" },
    { icon: MapPin, label: "Address", value: barangayInfo.address, sub: "Quezon City, Metro Manila" },
  ];
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", contact: "", department: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.message.trim() || form.message.length < 10) e.message = "Minimum 10 characters";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await insertContactMessage({ name: form.name, email: form.email, subject: form.department || "General Inquiry", message: form.contact ? `${form.message}\n\nContact: ${form.contact}` : form.message });
      setSubmitted(true);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to send message"); }
    finally { setLoading(false); }
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 ${
      errors[field] ? "border-red-400" : "border-border"
    }`;

  return (
    <>
      <SeoHead title="Contact Us" description="Get in touch with Barangay Payatas — contact information and office hours." path="/contact" />
    <div>
      { }
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Contact Us</h1>
        <p className="text-emerald-200/60 text-sm max-w-lg mx-auto">Get in touch with the Barangay Office. We're here to serve you.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          { }
          <div className="space-y-5">
            { }
            {contacts.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-start gap-3 bg-white dark:bg-card border border-border rounded-xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                    <c.icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                    <div className="font-semibold text-foreground text-sm">{c.value}</div>
                    <div className="text-xs text-muted-foreground">{c.sub}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            { }
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }}>
              <div className="bg-white dark:bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                  <Clock size={15} className="text-emerald-500" /> Office Hours
                </h3>
                <div className="space-y-2">
                  {officeSchedule.map(s => (
                    <div key={s.day} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{s.day}</span>
                      <span className={`text-xs font-medium ${s.open ? "text-foreground" : "text-red-500"}`}>{s.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            { }
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.42 }}>
              <div className="bg-white dark:bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="https://www.facebook.com/quezoncitygovernment" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                  <a href="https://twitter.com/QuezonCityGov" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors">
                    <Twitter size={14} /> Twitter
                  </a>
                  <a href="https://www.youtube.com/@quezoncitygovernment" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                    <Youtube size={14} /> YouTube
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          { }
          <div className="lg:col-span-2 space-y-5">
            { }
            <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center" style={{ height: 200 }}>
                <div className="text-center text-muted-foreground">
                  <MapPin size={36} className="mx-auto mb-2 text-emerald-400 opacity-50" />
                  <p className="text-sm font-medium">{barangayInfo.address}</p>
                  <p className="text-xs mt-0.5">Google Maps – available in production</p>
                </div>
              </div>
            </div>

            { }
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-foreground mb-5" style={{ fontSize: "1.1rem" }}>Send Us a Message</h2>
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="name" className="block text-xs text-muted-foreground mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input id="name" name="name" type="text" value={form.name} onChange={e => set("name", e.target.value)} className={inputCls("name")} placeholder="Juan Dela Cruz" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-xs text-muted-foreground mb-1.5">Email Address <span className="text-red-500">*</span></label>
                        <input id="email" name="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls("email")} placeholder="juan@email.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="contact" className="block text-xs text-muted-foreground mb-1.5">Contact Number</label>
                        <input id="contact" name="contact" type="tel" value={form.contact} onChange={e => set("contact", e.target.value)} className={inputCls("contact")} placeholder="09XXXXXXXXX" />
                      </div>
                      <div>
                        <label htmlFor="department" className="block text-xs text-muted-foreground mb-1.5">Department / Office</label>
                        <select id="department" name="department" value={form.department} onChange={e => set("department", e.target.value)} className={inputCls("department")}>
                          <option value="">General Inquiry</option>
                          {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-xs text-muted-foreground mb-1.5">Message <span className="text-red-500">*</span></label>
                      <textarea id="message" name="message" rows={5} value={form.message} onChange={e => set("message", e.target.value)} className={`${inputCls("message")} resize-none`} placeholder="Write your message, question, or concern here…" />
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold shadow-md transition-all">
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {loading ? "Sending..." : "Send Message"}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                    <h3 className="font-bold text-foreground mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground text-sm mb-5">Thank you, {form.name}! We'll respond to your inquiry within 1–2 business days.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", contact: "", department: "", message: "" }); }} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
                      Send Another Message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicContact;
