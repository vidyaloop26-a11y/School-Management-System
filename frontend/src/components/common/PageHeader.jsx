import React from "react";

export function Eyebrow({ children }) {
  return (
    <div className="text-[11px] tracking-[0.22em] font-semibold text-slate-500 uppercase">
      {children}
    </div>
  );
}

export default function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display title-dot text-[42px] md:text-[52px] lg:text-[60px] leading-[1.02] font-bold text-slate-900 mt-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14.5px] text-slate-500 mt-2 max-w-xl">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
