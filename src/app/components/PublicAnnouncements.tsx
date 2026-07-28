import React, { useState } from "react";
import { motion } from "motion/react";
import { Megaphone, Clock, Search, Tag } from "lucide-react";
import { useData } from "./DataContext";
import SeoHead from "./SeoHead";

const categories = ["All", "Health", "Governance", "Social Services", "Environment", "Livelihood"];

const PublicAnnouncements: React.FC = () => {
  const { announcements } = useData();
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = announcements.filter(a =>
    (cat === "All" || a.category === cat) &&
    (query === "" || a.title.toLowerCase().includes(query.toLowerCase()) || a.content.toLowerCase().includes(query.toLowerCase()))
  );

  const catColor: Record<string, string> = {
    Health: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    Governance: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    "Social Services": "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    Environment: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    Livelihood: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  };

  return (
    <>
      <SeoHead title="Announcements" description="Stay informed with the latest announcements and updates from Barangay Payatas." path="/announcements" />
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
          <Megaphone size={11} /> Official Updates
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Announcements</h1>
        <p className="text-emerald-200/60 text-sm">Stay updated with the latest news, programs, and events from your barangay.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search announcements…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                cat === c
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 dark:hover:text-emerald-300"
              }`}
            >
              {c !== "All" && <Tag size={10} />} {c}
            </button>
          ))}
        </div>

        {/* Announcements list */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((ann, i) => (
              <motion.div key={ann.id} custom={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                <div className={`bg-white dark:bg-card border rounded-2xl p-6 hover:shadow-md transition-all ${
                  ann.priority === "high" ? "border-red-200 dark:border-red-900" : "border-border"
                }`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catColor[ann.category] || "bg-muted text-muted-foreground"}`}>
                        {ann.category}
                      </span>
                      {ann.priority === "high" && (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                          Important
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {new Date(ann.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <h2 className="font-bold text-foreground mb-2" style={{ fontSize: "1.05rem" }}>{ann.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">{ann.content}</p>
                  <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                    Posted by: <span className="font-medium text-foreground/70">{ann.author}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No announcements found</p>
            <p className="text-xs mt-1">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default PublicAnnouncements;
