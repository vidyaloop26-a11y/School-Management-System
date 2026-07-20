import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { Sparkles } from "lucide-react";

export default function Placeholder({ title, icon: Icon, description }) {
  return (
    <div data-testid={`placeholder-${title.toLowerCase().replace(/\s+/g, "-")}`} className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="MODULE"
        title={title}
        subtitle={description || "This module is on our roadmap for Vidyaloop and will be available shortly."}
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4fb] text-[#0c6a99] px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Coming soon
          </span>
        }
      />

      <div className="glass rounded-2xl p-14 reveal">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-white/70 border border-white grid place-items-center shadow-sm mb-5">
            {Icon ? <Icon className="h-7 w-7 text-[#29ABE2]" strokeWidth={1.6} /> : <Sparkles className="h-7 w-7 text-[#29ABE2]" />}
          </div>
          <h2 className="font-display text-[26px] font-bold text-slate-900 tracking-tight">
            {title} · in the loop, soon
          </h2>
          <p className="text-[13.5px] text-slate-500 mt-2.5 leading-relaxed">
            We&rsquo;re building this thoughtfully. In the meantime, explore Dashboard, Students, Staff and Timetable — the modules that are live today.
          </p>
        </div>
      </div>
    </div>
  );
}
