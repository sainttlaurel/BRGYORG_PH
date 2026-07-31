import { useState, useCallback } from "react";

/**
 * useColumnVisibility — track which table columns are visible.
 *
 * Usage:
 *   const vis = useColumnVisibility(["id", "name", "status"]);
 *   // column header/cell:
 *   className={`... ${vis.isHidden("name") ? "hidden" : ""}`}
 *   // toggle: <ColumnToggle columns={vis.columns} hidden={vis.hidden} onToggle={vis.toggle} />
 */
export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

export function useColumnVisibility(defs: ColumnDef[]) {
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(defs.filter(d => d.defaultVisible === false).map(d => d.key))
  );

  const toggle = useCallback((key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);
  const isVisible = useCallback((key: string) => !hidden.has(key), [hidden]);
  const showAll = useCallback(() => setHidden(new Set()), []);
  const hideAll = useCallback(() => setHidden(new Set(defs.map(d => d.key))), [defs]);

  return { columns: defs, hidden, toggle, isHidden, isVisible, showAll, hideAll };
}
