import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Users, FileText, Shield, CheckCircle, XCircle, Eye } from "lucide-react";
import { searchResidents, getDocumentStatus } from "@/lib/supabase";
import SeoHead from "./SeoHead";

interface ResidentResult {
  id: string; full_name: string; purok: string; status: string; registered: string;
}

interface DocResult {
  id: string; resident: string; type: string; purpose: string; status: string; date: string;
}

type Tab = "documents" | "residents";

const PublicRegistry: React.FC = () => {
  const [tab, setTab] = useState<Tab>("documents");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [residentResults, setResidentResults] = useState<ResidentResult[]>([]);
  const [docResults, setDocResults] = useState<DocResult[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [residentLoading, setResidentLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
    if (tab === "residents") {
      setResidentLoading(true);
      try {
        const results = await searchResidents(query);
        setResidentResults(results);
      } catch {
        setResidentResults([]);
      }
      setResidentLoading(false);
    } else {
      setDocLoading(true);
      try {
        const results = await getDocumentStatus(query);
        setDocResults(results);
      } catch {
        setDocResults([]);
      }
      setDocLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
      processing: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-400",
      ready: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400",
      released: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      rejected: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  return (
    <>
      <SeoHead title="Public Registry" description="Search the public resident registry of Barangay Payatas, Quezon City." path="/registry" />
    <div>
      { }
      <div className="bg-gradient-to-br from-sky-800 to-sky-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-medium mb-4">
          <Shield size={11} /> Public Records
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Public Registry & Verification</h1>
        <p className="text-sky-200/60 text-sm max-w-lg mx-auto">Verify documents and look up resident registration status. Enter a reference number or resident ID to search.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        { }
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {[
            { key: "documents" as Tab, label: "Documents", icon: FileText },
            { key: "residents" as Tab, label: "Residents", icon: Users },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearched(false); setQuery(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        { }
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="search-query"
              name="search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tab === "documents" ? "Enter reference number (e.g. REQ-2026-0847) or name…" : "Enter resident ID or full name…"}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 focus:border-sky-400 transition-all"
            />
          </div>
          <button type="submit" className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-all shadow-sm">
            Search
          </button>
        </form>

        { }
        {((docLoading && tab === "documents") || (residentLoading && tab === "residents")) && searched && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <circle className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </div>
        )}

        { }
        {!docLoading && !residentLoading && searched && query && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {tab === "documents" ? (
              docResults.length > 0 ? (
                <div className="space-y-3">
                  {docResults.map(doc => (
                    <div key={doc.id} className="bg-white dark:bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-foreground">{doc.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{doc.resident}</div>
                          <div className="text-xs text-muted-foreground mt-1">{doc.type} · {doc.purpose}</div>
                          <div className="text-xs text-muted-foreground">Filed: {doc.date}</div>
                        </div>
                        <div className="text-right">
                          {doc.status === "released" ? (
                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium"><CheckCircle size={14} /> Released</div>
                          ) : doc.status === "ready" ? (
                            <div className="flex items-center gap-1 text-purple-600 text-sm font-medium"><Eye size={14} /> Ready for Pick-up</div>
                          ) : doc.status === "rejected" ? (
                            <div className="flex items-center gap-1 text-red-600 text-sm font-medium"><XCircle size={14} /> Rejected</div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-600 text-sm font-medium"><Shield size={14} /> In Progress</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <XCircle size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-medium">No document found</p>
                  <p className="text-muted-foreground text-xs mt-1">Check your reference number and try again.</p>
                </div>
              )
            ) : (
              residentResults.length > 0 ? (
                <div className="space-y-3">
                  {residentResults.map(res => (
                    <div key={res.id} className="bg-white dark:bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold shrink-0">
                            {res.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{res.full_name}</div>
                            <div className="text-muted-foreground text-xs">{res.id} · {res.purok}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                            {res.status}
                          </span>
                          <div className="text-xs text-muted-foreground mt-1">Registered: {res.registered ? new Date(res.registered).toLocaleDateString("en-PH", { year: "numeric", month: "short" }) : "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <XCircle size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-medium">No resident found</p>
                  <p className="text-muted-foreground text-xs mt-1">The resident may not be registered in our system. Contact the barangay office for assistance.</p>
                </div>
              )
            )}
          </motion.div>
        )}

        {!searched && (
          <div className="text-center py-12 text-muted-foreground">
            <Search size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Enter a search term above to begin verification.</p>
          </div>
        )}

        { }
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300">
          <strong>Privacy Notice:</strong> This registry only shows publicly verifiable information. Full personal data is protected under the Data Privacy Act of 2012 (RA 10173). For complete records, please visit the Barangay Hall with valid identification.
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicRegistry;
