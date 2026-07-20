import React from "react";
import { Sparkles } from "lucide-react";

export default function EmptyState({ icon: Icon = Sparkles, title, hint, className = "" }) {
  return (
    <div data-testid="empty-state" className={`flex flex-col items-center text-center py-10 px-6 ${className}`}>
      <div className="h-12 w-12 rounded-2xl bg-[#e6f4fb] text-[#0c6a99] grid place-items-center mb-3">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="font-display font-semibold text-slate-800 text-[15px]">{title}</div>
      {hint && <div className="text-[12.5px] text-slate-500 mt-1 max-w-sm">{hint}</div>}
    </div>
  );
}
