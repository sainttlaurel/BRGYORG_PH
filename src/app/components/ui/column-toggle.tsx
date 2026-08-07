import React, { useState, useEffect, useRef } from "react";
import { Columns3, Check, RotateCcw } from "lucide-react";
import type { ColumnDef } from "@/lib/hooks/useColumnVisibility";

interface ColumnToggleProps {
  columns: ColumnDef[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
}

const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, hidden, onToggle, onReset }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        title="Toggle columns"
      >
        <Columns3 size={14} /> Columns
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-card border border-border rounded-xl shadow-lg p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Columns</span>
            <button onClick={onReset} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Show all columns">
              <RotateCcw size={12} />
            </button>
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {columns.map(col => {
              const visible = !hidden.has(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => onToggle(col.key)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${visible ? "bg-emerald-600 border-emerald-600" : "border-border"}`}>
                    {visible && <Check size={11} className="text-white" />}
                  </span>
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnToggle;
