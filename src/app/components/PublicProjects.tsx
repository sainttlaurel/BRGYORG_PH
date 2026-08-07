import React, { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Building2, Search, Clock, ThumbsUp, Heart, Tag } from "lucide-react";
import { useData } from "./DataContext";
import SeoHead from "./SeoHead";

const categories = ["All", "Infrastructure", "Health", "Education", "Livelihood", "Environment", "Social Welfare", "Others"];

const statusConfig: Record<string, { color: string; label: string }> = {
  Planned: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", label: "Planned" },
  Ongoing: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "Ongoing" },
  Completed: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400", label: "Completed" },
};

const PublicProjects: React.FC = () => {
  const { projects } = useData();
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const filtered = projects.filter(p =>
    (cat === "All" || p.category === cat) &&
    (debouncedQuery === "" || p.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || p.description.toLowerCase().includes(debouncedQuery.toLowerCase()) || p.id.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const formatBudget = (n: number) => "₱" + n.toLocaleString();

  return (
    <>
      <SeoHead title="Projects" description="Browse ongoing and completed projects of Barangay Payatas." path="/projects" />
      <div>
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
            <Building2 size={11} /> Barangay Projects
          </div>
          <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Projects & Initiatives</h1>
          <p className="text-emerald-200/60 text-sm">Transparent tracking of all barangay projects from planning to completion.</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input id="search-projects-public" name="search" type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects…" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${cat === c ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40"}`}>{c}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 text-muted-foreground text-sm">No projects found.</div>
            ) : (filtered.map(proj => {
              const st = statusConfig[proj.status] || { color: "bg-muted text-muted-foreground", label: proj.status };
              return (
                <div key={proj.id} className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-foreground text-sm leading-snug">{proj.title}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tag size={11} /> {proj.category}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} /> {proj.target_date || "No target date"}</span>
                  </div>
                  {proj.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{proj.description}</p>}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{formatBudget(proj.budget)}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {proj.reactions.likes}</span>
                      <span className="flex items-center gap-1"><Heart size={12} /> {proj.reactions.hearts}</span>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicProjects;
