import React from "react";
import { Link, useLocation } from "react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <ShieldAlert size={28} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-1 max-w-md">
        The page <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">{location.pathname}</code> does not exist.
      </p>
      <p className="text-muted-foreground/60 text-sm mb-6">
        It may have been moved or deleted.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
      >
        <ArrowLeft size={14} /> Back to home
      </Link>
    </div>
  );
};

export default NotFoundPage;
