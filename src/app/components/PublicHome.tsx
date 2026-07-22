import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  FileText, Shield, Users, Megaphone, Phone, ArrowRight,
  TrendingUp, Home, Heart, AlertTriangle, ChevronRight, Leaf,
  Clock, MapPin, Star, CheckCircle
} from "lucide-react";
import { useData } from "./DataContext";

const quickActions = [
  { to: "/document-application", label: "Request a Document", desc: "Clearance, Certificate, Indigency & more", icon: FileText, color: "from-emerald-500 to-emerald-600" },
  { to: "/report-concern", label: "Report a Concern", desc: "Submit an issue or safety concern", icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
  { to: "/registry", label: "Track a Document", desc: "Check your document request status", icon: Shield, color: "from-sky-500 to-sky-600" },
  { to: "/community-vote", label: "Community Vote", desc: "Participate in barangay polls", icon: TrendingUp, color: "from-purple-500 to-purple-600" },
  { to: "/citizens-voice", label: "Send Feedback", desc: "Share ideas or concerns anonymously", icon: Heart, color: "from-rose-500 to-rose-600" },
  { to: "/volunteer", label: "Volunteer", desc: "Join our community programs", icon: Users, color: "from-teal-500 to-teal-600" },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const PublicHome: React.FC = () => {
  const { barangayInfo, announcements, services, residents } = useData();
  const stats = [
    { label: "Registered Residents", value: residents.length.toLocaleString(), icon: Users, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-400" },
    { label: "Households", value: barangayInfo.households.toLocaleString(), icon: Home, color: "text-sky-600 bg-sky-100 dark:bg-sky-900 dark:text-sky-400" },
    { label: "Barangay Area", value: barangayInfo.area, icon: MapPin, color: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400" },
    { label: "Serving Since", value: barangayInfo.established, icon: Star, color: "text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-400" },
  ];
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/img/bg.png" alt="Background" className="w-full h-full object-cover" />
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 mb-6 text-xs font-medium backdrop-blur-sm">
              <Leaf size={12} />
              Official Barangay Platform · Quezon City
            </div>
            <h1 className="text-white mb-5" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15 }}>
              Welcome to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-sky-300">Barangay Payatas</span>
            </h1>
            <p className="text-emerald-100/70 mb-8 max-w-lg" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
              Transparent, accessible, and community-driven governance. Access services, stay informed, and participate in building a better barangay.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/document-application"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Request a Document <ArrowRight size={16} />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-medium transition-all"
              >
                View Services
              </Link>
            </div>

            {/* Hotline */}
            <div className="mt-8 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 w-fit">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                <Phone size={14} className="text-red-300" />
              </div>
              <div>
                <div className="text-white/50 text-xs">24/7 Emergency Hotline</div>
                <div className="text-white font-bold">{barangayInfo.hotline}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img src="/img/logo-payatas.png" alt="Logo" className="w-full h-auto object-cover" />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-white/50" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-foreground">{stat.value}</div>
                    <div className="text-muted-foreground text-xs">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-3">
              <Leaf size={11} /> Online Services
            </div>
            <h2 className="text-foreground mb-2" style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>What can we help you with?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">Access barangay services 24/7 from anywhere. Fast, transparent, and secure.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quickActions.map((action, i) => (
              <motion.div key={action.to} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <Link
                  to={action.to}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <action.icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {action.label}
                    </div>
                    <div className="text-muted-foreground text-xs leading-relaxed">{action.desc}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-emerald-500 transition-colors mt-0.5 shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements preview */}
      <section className="py-16 bg-emerald-50 dark:bg-emerald-950/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-2">
                <Megaphone size={11} /> Latest News
              </div>
              <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.5rem" }}>Announcements</h2>
            </div>
            <Link to="/announcements" className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {announcements.slice(0, 3).map((ann, i) => (
              <motion.div key={ann.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <div className="bg-white dark:bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      ann.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                    }`}>
                      {ann.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {new Date(ann.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2" style={{ lineHeight: 1.4 }}>{ann.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 flex-1">{ann.content}</p>
                  <div className="mt-3 text-xs text-muted-foreground">By {ann.author}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 text-xs font-medium mb-3">
              <CheckCircle size={11} /> Documents & Certificates
            </div>
            <h2 className="text-foreground mb-2" style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>Available Services</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">Get official documents and certificates processed fast — no long lines.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.slice(0, 4).map((svc, i) => (
              <motion.div key={svc.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <Link to="/services" className="group flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="font-semibold text-sm text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{svc.title}</div>
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{svc.description}</div>
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{svc.fee} · {svc.duration}</div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all">
              View All Services <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Phone size={20} />
            </div>
            <div>
              <div className="font-bold text-lg">Emergency Hotlines</div>
              <div className="text-white/80 text-sm">Available 24/7 for urgent concerns</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-center">
            <div>
              <div className="text-white/70 text-xs">Barangay</div>
              <div className="font-bold text-lg">{barangayInfo.hotline}</div>
            </div>
            <div>
              <div className="text-white/70 text-xs">Emergency</div>
              <div className="font-bold text-lg">911</div>
            </div>
            <div>
              <div className="text-white/70 text-xs">Police (PNP)</div>
              <div className="font-bold text-lg">117</div>
            </div>
            <div>
              <div className="text-white/70 text-xs">Fire (BFP)</div>
              <div className="font-bold text-lg">160</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicHome;
