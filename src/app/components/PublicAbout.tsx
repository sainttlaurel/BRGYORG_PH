import React from "react";
import { motion } from "motion/react";
import { Leaf, MapPin, Calendar, Eye, Target, Users, Award } from "lucide-react";
import { useData } from "./DataContext";
import SeoHead from "./SeoHead";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5 } }),
};

const PublicAbout: React.FC = () => {
  const { barangayInfo } = useData();
  return (
    <>
      <SeoHead title="About" description="Learn about Barangay Payatas — history, vision, mission, and community information." path="/about" />
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
            <Leaf size={11} /> About Our Barangay
          </div>
          <h1 className="text-white mb-3" style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {barangayInfo.name}
          </h1>
          <p className="text-emerald-200/70 max-w-xl mx-auto">{barangayInfo.municipality}, {barangayInfo.province}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Calendar, label: "Established", value: barangayInfo.established },
            { icon: Users, label: "Population", value: barangayInfo.population.toLocaleString() },
            { icon: MapPin, label: "Area", value: barangayInfo.area },
            { icon: Award, label: "Households", value: barangayInfo.households.toLocaleString() },
          ].map((item, i) => (
            <motion.div key={item.label} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                  <item.icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="font-bold text-xl text-foreground">{item.value}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* History */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 h-full">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "1.25rem" }}>
                <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Calendar size={14} className="text-amber-600 dark:text-amber-400" />
                </span>
                Our History
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{barangayInfo.history}</p>
            </div>
          </motion.div>

          {/* Vision & Mission */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="space-y-4 h-full">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
                <h2 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <Eye size={16} /> Our Vision
                </h2>
                <p className="text-emerald-700/80 dark:text-emerald-400/80 text-sm leading-relaxed">{barangayInfo.vision}</p>
              </div>
              <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-2xl p-6">
                <h2 className="font-bold text-sky-800 dark:text-sky-300 mb-3 flex items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <Target size={16} /> Our Mission
                </h2>
                <p className="text-sky-700/80 dark:text-sky-400/80 text-sm leading-relaxed">{barangayInfo.mission}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="bg-white dark:bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "1.25rem" }}>
              <MapPin size={18} className="text-emerald-600" /> Location
            </h2>
            <div className="rounded-xl overflow-hidden border border-border bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center" style={{ height: 280 }}>
              <div className="text-center text-muted-foreground">
                <MapPin size={40} className="mx-auto mb-3 text-emerald-400 opacity-40" />
                <p className="text-sm font-medium">{barangayInfo.address}</p>
                <p className="text-xs mt-1 text-muted-foreground/70">Google Maps integration available in production</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Values */}
        <div>
          <h2 className="font-bold text-foreground mb-6 text-center" style={{ fontSize: "1.5rem" }}>Core Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "Transparency", desc: "Open and accountable governance", color: "from-emerald-400 to-emerald-600" },
              { value: "Integrity", desc: "Honest and ethical public service", color: "from-sky-400 to-sky-600" },
              { value: "Excellence", desc: "Delivering quality outcomes", color: "from-purple-400 to-purple-600" },
              { value: "Community", desc: "Inclusive and participatory", color: "from-amber-400 to-amber-600" },
            ].map((cv, i) => (
              <motion.div key={cv.value} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cv.color} flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                    <Leaf size={18} className="text-white" />
                  </div>
                  <div className="font-semibold text-foreground text-sm mb-1">{cv.value}</div>
                  <div className="text-muted-foreground text-xs">{cv.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicAbout;
