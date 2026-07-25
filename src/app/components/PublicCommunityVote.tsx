import React, { useState } from "react";
import { motion } from "motion/react";
import { BarChart2, CheckCircle, Lock, Users, Clock, Trophy, Loader2 } from "lucide-react";
import { useData } from "./DataContext";
import { submitVote } from "@/lib/supabaseWrite";
import { toast } from "sonner";

const PublicCommunityVote: React.FC = () => {
  const { polls } = useData();
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleVote = (pollId: string, optionId: string) => {
    if (submitted.has(pollId)) return;
    setVotes(v => ({ ...v, [pollId]: optionId }));
  };

  const handleSubmit = async (pollId: string) => {
    const optionId = votes[pollId];
    if (!optionId) return;
    setLoading(l => ({ ...l, [pollId]: true }));
    try {
      await submitVote(pollId, optionId);
      setSubmitted(s => new Set([...s, pollId]));
    } catch { toast.error("Failed to submit vote"); }
    finally { setLoading(l => ({ ...l, [pollId]: false })); }
  };

  const getPercent = (votes: number, total: number) => total === 0 ? 0 : Math.round((votes / total) * 100);

  const activePolls = polls.filter(p => p.status === "active");
  const closedPolls = polls.filter(p => p.status === "closed");

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-800 to-purple-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-medium mb-4">
          <BarChart2 size={11} /> Participatory Governance
        </div>
        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Community Vote</h1>
        <p className="text-purple-200/60 text-sm max-w-lg mx-auto">Participate in barangay decision-making. Your vote matters in shaping our community's future.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Privacy notice */}
        <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-8">
          <Lock size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="text-sm text-purple-700 dark:text-purple-300">
            Votes are anonymous and one per session. Results are used for community planning and barangay ordinances.
          </div>
        </div>

        {/* Active polls */}
        {activePolls.length > 0 && (
          <>
            <h2 className="font-bold text-foreground mb-4" style={{ fontSize: "1.2rem" }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm">
                Active Polls ({activePolls.length})
              </span>
            </h2>
            <div className="space-y-5 mb-10">
              {activePolls.map((poll, pi) => {
                const isVoted = submitted.has(poll.id);
                const selected = votes[poll.id];
                const totalVotes = isVoted ? poll.totalVotes + 1 : poll.totalVotes;

                return (
                  <motion.div key={poll.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: pi * 0.1 }}>
                    <div className="bg-white dark:bg-card border border-border rounded-2xl p-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                          {poll.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={11} /> Ends {new Date(poll.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground mb-1" style={{ fontSize: "1.05rem", lineHeight: 1.4 }}>{poll.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{poll.description}</p>

                      <div className="space-y-2.5 mb-4">
                        {poll.options.map(opt => {
                          const pct = getPercent(opt.votes + (isVoted && selected === opt.id ? 1 : 0), totalVotes);
                          return (
                            <div key={opt.id}>
                              <button
                                onClick={() => handleVote(poll.id, opt.id)}
                                disabled={isVoted}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                  isVoted
                                    ? "cursor-default"
                                    : selected === opt.id
                                    ? "border-purple-400 bg-purple-50 dark:bg-purple-900/30"
                                    : "border-border hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      selected === opt.id ? "border-purple-500" : "border-border"
                                    }`}>
                                      {selected === opt.id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                                  </div>
                                  {isVoted && <span className="text-sm font-bold text-foreground">{pct}%</span>}
                                </div>
                                {isVoted && (
                                  <div className="relative h-1.5 bg-border rounded-full overflow-hidden mt-1">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.7, delay: 0.2 }}
                                      className={`absolute left-0 h-full rounded-full ${selected === opt.id ? "bg-purple-500" : "bg-emerald-400"}`}
                                    />
                                  </div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users size={11} /> {totalVotes.toLocaleString()} total votes
                        </span>
                        {!isVoted ? (
                          <button
                            onClick={() => handleSubmit(poll.id)}
                            disabled={!selected || loading[poll.id]}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              selected && !loading[poll.id]
                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            {loading[poll.id] ? <Loader2 size={14} className="animate-spin" /> : null} {loading[poll.id] ? "Submitting…" : "Cast My Vote"}
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle size={14} /> Vote submitted!
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Closed polls */}
        {closedPolls.length > 0 && (
          <>
            <h2 className="font-bold text-foreground mb-4" style={{ fontSize: "1.2rem" }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                Closed Polls
              </span>
            </h2>
            <div className="space-y-5">
              {closedPolls.map(poll => (
                <div key={poll.id} className="bg-white dark:bg-card border border-border rounded-2xl p-6 opacity-80">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{poll.category}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">Ended {new Date(poll.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1" style={{ fontSize: "1.05rem" }}>{poll.title}</h3>
                  {poll.winner && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Trophy size={14} className="text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Winner: {poll.winner}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {poll.options.map(opt => {
                      const pct = getPercent(opt.votes, poll.totalVotes);
                      return (
                        <div key={opt.id}>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{opt.label}</span>
                            <span className="font-medium">{pct}% ({opt.votes.toLocaleString()})</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">{poll.totalVotes.toLocaleString()} total votes</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicCommunityVote;
