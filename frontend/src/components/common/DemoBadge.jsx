import React from "react";
import { FlaskConical } from "lucide-react";

export default function DemoBadge({ className = "" }) {
  return (
    <span
      data-testid="demo-badge"
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 text-slate-500 border border-slate-200/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase ${className}`}
    >
      <FlaskConical className="h-3 w-3" strokeWidth={2} />
      Demo Data
    </span>
  );
}
