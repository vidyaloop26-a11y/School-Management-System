import React from "react";
import { RefreshCw } from "lucide-react";

export default function LastSynced({ text = "Last synced: Just now", className = "" }) {
  return (
    <div data-testid="last-synced" className={`inline-flex items-center gap-1.5 text-[11.5px] text-slate-500 ${className}`}>
      <RefreshCw className="h-3 w-3 text-slate-400" strokeWidth={1.8} />
      {text}
    </div>
  );
}
