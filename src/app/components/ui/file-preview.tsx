import React from "react";
import { FileText, ImageIcon } from "lucide-react";

interface FilePreviewProps {
  src: string;
  name?: string;
  className?: string;
  maxHeight?: string;
}

function isPdf(src: string, name?: string): boolean {
  if (src.startsWith("data:application/pdf")) return true;
  const n = (name ?? src.split("?")[0] ?? "").toLowerCase();
  return n.endsWith(".pdf");
}

/**
 * FilePreview — renders a preview for an uploaded file.
 * - Images → <img> thumbnail
 * - PDFs → styled card with "Open PDF" link (data URLs open via a blob URL)
 */
const FilePreview: React.FC<FilePreviewProps> = ({ src, name, className, maxHeight = "h-48" }) => {
  const pdf = isPdf(src, name);

  if (pdf) {
    const href = src.startsWith("data:") ? src : src;
    return (
      <div className={`w-full rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center overflow-hidden ${className ?? ""}`}>
        <div className={`${maxHeight} flex flex-col items-center justify-center gap-2 p-4 text-center`}>
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <FileText size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <span className="text-xs font-medium text-foreground break-all line-clamp-2 px-4">
            {name || "PDF Document"}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Open PDF ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-xl border border-border overflow-hidden bg-muted/30 ${className ?? ""}`}>
      <img src={src} alt={name ?? "Uploaded file"} className={`w-full object-contain ${maxHeight}`} />
      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/50 flex items-center justify-center">
        <ImageIcon size={12} className="text-white" />
      </div>
    </div>
  );
};

export default FilePreview;