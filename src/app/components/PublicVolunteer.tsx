import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, CheckCircle, Users, Leaf, ArrowRight, Calendar } from "lucide-react";

const programs = [
  { id: "health", label: "Health & Medical Missions", desc: "Assist in medical missions, health screenings, and vaccination drives.", icon: "🏥" },
  { id: "env", label: "Environmental Clean-up", desc: "Join clean-up drives, tree planting, and waste management programs.", icon: "🌿" },
  { id: "edu", label: "Education & Tutoring", desc: "Help students with academic support and after-school programs.", icon: "📚" },
  { id: "disaster", label: "Disaster Response", desc: "Be part of the Barangay Emergency Response Team (BERT).", icon: "🚨" },
  { id: "livelihood", label: "Livelihood Programs", desc: "Assist in skills training, cooperatives, and enterprise programs.", icon: "💼" },
  { id: "sports", label: "Sports & Youth", desc: "Coach or mentor youth sports teams and programs.", icon: "⚽" },
];

const PublicVolunteer: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", age: "", gender: "", contact: "", email: "",
    address: "", occupation: "", availability: "", selectedPrograms: [] as string[],
    skills: "", motivation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const toggleProgram = (id: string) => {
    setForm(f => ({
      ...f,
      selectedPrograms: f.selectedPrograms.includes(id)
        ? f.selectedPrograms.filter(p => p !== id)
        : [...f.selectedPrograms, id],
    }));
    setErrors(e => { const n = { ...e }; delete n.selectedPrograms; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.contact.trim()) e.contact = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (form.selectedPrograms.length === 0) e.selectedPrograms = "Select at least one program";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-input-background transition-colors outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 ${
      errors[field] ? "border-red-400" : "border-border"
    }`;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-700 to-emerald-900 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-medium mb-4">
          <Heart size={11} /> Community Service
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Volunteer Registration</h1>
        <p className="text-teal-200/60 text-sm max-w-lg mx-auto">Join our community of volunteers and make a difference in Barangay Payatas. Together, we build a better community.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Programs */}
        <div className="mb-10">
          <h2 className="font-bold text-foreground mb-5 text-center" style={{ fontSize: "1.3rem" }}>Volunteer Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 text-center hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
                  <div className="text-3xl mb-2">{p.icon}</div>
                  <div className="font-semibold text-foreground text-sm mb-1">{p.label}</div>
                  <div className="text-muted-foreground text-xs leading-relaxed">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-foreground mb-5" style={{ fontSize: "1.15rem" }}>
                  <Heart size={17} className="inline mr-2 text-emerald-500" />
                  Volunteer Application Form
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">First Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls("firstName")} placeholder="Juan" />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls("lastName")} placeholder="Dela Cruz" />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Age</label>
                      <input type="number" value={form.age} onChange={e => set("age", e.target.value)} className={inputCls("age")} placeholder="25" min="15" max="80" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Gender</label>
                      <select value={form.gender} onChange={e => set("gender", e.target.value)} className={inputCls("gender")}>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Availability</label>
                      <select value={form.availability} onChange={e => set("availability", e.target.value)} className={inputCls("availability")}>
                        <option value="">Select</option>
                        <option>Weekdays</option>
                        <option>Weekends</option>
                        <option>Both</option>
                        <option>On-call / As needed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Contact No. <span className="text-red-500">*</span></label>
                      <input type="tel" value={form.contact} onChange={e => set("contact", e.target.value)} className={inputCls("contact")} placeholder="09XXXXXXXXX" />
                      {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls("email")} placeholder="juan@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Address <span className="text-red-500">*</span></label>
                    <input type="text" value={form.address} onChange={e => set("address", e.target.value)} className={inputCls("address")} placeholder="House No., Street, Purok" />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-2.5">Programs of Interest <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {programs.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProgram(p.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                            form.selectedPrograms.includes(p.id)
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                              : "border-border text-muted-foreground hover:border-emerald-200"
                          }`}
                        >
                          <span className="shrink-0">{p.icon}</span>
                          <span className="text-xs">{p.label}</span>
                        </button>
                      ))}
                    </div>
                    {errors.selectedPrograms && <p className="text-red-500 text-xs mt-1">{errors.selectedPrograms}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Skills / Expertise</label>
                    <input type="text" value={form.skills} onChange={e => set("skills", e.target.value)} className={inputCls("skills")} placeholder="e.g., First Aid, Teaching, Carpentry…" />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Why do you want to volunteer?</label>
                    <textarea rows={4} value={form.motivation} onChange={e => set("motivation", e.target.value)} className={`${inputCls("motivation")} resize-none`} placeholder="Share your motivation for volunteering…" />
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all">
                    <Heart size={16} /> Register as Volunteer <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-bold text-foreground mb-2" style={{ fontSize: "1.3rem" }}>Welcome to the Team!</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Thank you for signing up to volunteer. Our team will contact you with more details about upcoming programs.</p>
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm mb-6">
                  Registered for: <strong className="text-foreground">{form.selectedPrograms.map(id => programs.find(p => p.id === id)?.label).join(", ")}</strong>
                </div>
                <button onClick={() => { setSubmitted(false); setForm({ firstName: "", lastName: "", age: "", gender: "", contact: "", email: "", address: "", occupation: "", availability: "", selectedPrograms: [], skills: "", motivation: "" }); }} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all">
                  Register Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PublicVolunteer;
