import React from "react";
import { motion } from "motion/react";
import { Leaf, Phone, Mail, Users } from "lucide-react";
import { useData } from "./DataContext";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } }),
};

const avatarColors = [
  "from-emerald-400 to-emerald-600",
  "from-sky-400 to-sky-600",
  "from-purple-400 to-purple-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-teal-400 to-teal-600",
];

const PublicOfficials: React.FC = () => {
  const { officials } = useData();
  const captain = officials.find(o => o.position === "Barangay Captain");
  const kagawads = officials.filter(o => o.position === "Barangay Kagawad");
  const others = officials.filter(o => !["Barangay Captain", "Barangay Kagawad"].includes(o.position));

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
          <Users size={11} /> Elected & Appointed Officials
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>Barangay Officials</h1>
        <p className="text-emerald-200/60 text-sm">Term 2022–2025 · {officials.length} Officials</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Captain */}
        {captain && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="font-bold text-foreground mb-4 text-center" style={{ fontSize: "1.1rem" }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm">
                ★ Punong Barangay
              </span>
            </h2>
            <div className="max-w-sm mx-auto">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center shadow-md">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold" style={{ fontSize: "1.8rem" }}>{captain.name.charAt(0)}</span>
                </div>
                <div className="font-bold text-foreground mb-1" style={{ fontSize: "1.1rem" }}>{captain.name}</div>
                <div className="text-amber-600 dark:text-amber-400 font-semibold text-sm mb-1">{captain.position}</div>
                <div className="text-muted-foreground text-xs mb-3">Since {captain.since}</div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{captain.bio}</p>
                <div className="flex justify-center gap-3">
                  <a href={`tel:${captain.contact}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                    <Phone size={12} /> {captain.contact}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Kagawads */}
        <h2 className="font-bold text-foreground mb-4" style={{ fontSize: "1.1rem" }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm">
            Sangguniang Barangay Members
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {kagawads.map((official, i) => (
            <motion.div key={official.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center shadow-sm shrink-0`}>
                    <span className="text-white font-bold">{official.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{official.name}</div>
                    <div className="text-muted-foreground text-xs">Since {official.since}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 inline-block mb-2 font-medium">
                    {official.committee}
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{official.bio}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${official.contact}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 transition-colors">
                    <Phone size={11} /> {official.contact}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other officials */}
        <h2 className="font-bold text-foreground mb-4" style={{ fontSize: "1.1rem" }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-sm">
            Administrative & SK
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map((official, i) => (
            <motion.div key={official.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[(i + 3) % avatarColors.length]} flex items-center justify-center shadow-sm shrink-0`}>
                  <span className="text-white font-bold">{official.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{official.name}</div>
                  <div className="text-sky-600 dark:text-sky-400 text-xs font-medium">{official.position}</div>
                  <div className="text-muted-foreground text-xs">{official.committee}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicOfficials;
