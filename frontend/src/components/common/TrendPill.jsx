import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function TrendPill({ text, dir = "up" }) {
  const cls = dir === "up" ? "pill-up" : "pill-neutral";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} />
      {text}
    </span>
  );
}
