import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  FileCheck, Award, Heart, Home, Briefcase, Shield, Star, Users,
  Clock, Wallet, ChevronRight, ArrowRight, Leaf, CheckCircle
} from "lucide-react";
import { useData } from "./DataContext";

const iconMap: Record<string, React.FC<{ size: number; className?: string }>> = {
  FileCheck, Award, Heart, Home, Briefcase, Shield, Star, Users
};

const steps = [
  { n: "1", title: "Choose a Service", desc: "Select the document or certificate you need from our list of available services." },
  { n: "2", title: "Fill Out the Form", desc: "Complete the online application form with your personal details and purpose." },
  { n: "3", title: "Receive Reference Number", desc: "You'll get a reference number to track your application status online." },
  { n: "4", title: "Pick Up or Receive", desc: "Visit the barangay hall or receive your document digitally when it's ready." },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45 } }),
};

const PublicServices: React.FC = () => {
  const { services } = useData();
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
          <Leaf size={11} /> Barangay Services
        </div>
        <h1 className="text-white mb-3" style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>Documents & Certificates</h1>
        <p className="text-emerald-200/60 max-w-xl mx-auto text-sm">Official documents processed fast and transparently. No long queues — apply online and track your request.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {services.map((svc, i) => {
            const Icon = iconMap[svc.icon] || FileCheck;
            return (
              <motion.div key={svc.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
                <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground mb-1">{svc.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{svc.description}</p>

                      <div className="flex gap-3 mb-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                          <Clock size={11} /> {svc.duration}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2.5 py-1 rounded-lg">
                          <Wallet size={11} /> {svc.fee}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1.5 font-medium">Requirements:</div>
                        <ul className="space-y-1">
                          {svc.requirements.map(req => (
                            <li key={req} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle size={11} className="text-emerald-500 shrink-0" /> {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        to="/document-application"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        Apply Now <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 p-8">
          <h2 className="font-bold text-foreground text-center mb-8" style={{ fontSize: "1.5rem" }}>How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.n} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="relative">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                    {step.n}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full -translate-x-1/2">
                    <ArrowRight size={16} className="text-emerald-300 mx-auto" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/document-application" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all">
              Start Your Application <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicServices;
