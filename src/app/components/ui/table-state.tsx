import { Inbox } from "lucide-react";

export function TableLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading...
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
