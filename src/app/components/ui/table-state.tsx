import { Inbox } from "lucide-react";

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <th key={i} className="px-4 py-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-border last:border-0">
                {Array.from({ length: 4 }).map((_, c) => (
                  <td key={c} className="px-4 py-3"><div className="h-3 w-24 rounded bg-muted/60 animate-pulse" style={{ animationDelay: `${(r * 100 + c * 50)}ms` }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableEmpty({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Inbox size={36} className="mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
