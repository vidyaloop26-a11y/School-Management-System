import React from "react";

export function Eyebrow({ children }) {
  return (
    <div className="text-[10px] sm:text-[11px] tracking-[0.2em] font-semibold text-slate-500 uppercase">
      {children}
    </div>
  );
}

export default function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="min-w-0 flex-1">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display title-dot text-[28px] sm:text-[42px] md:text-[52px] lg:text-[60px] leading-[1.05] font-bold text-slate-900 mt-1 break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] sm:text-[14.5px] text-slate-500 mt-1.5 sm:mt-2 max-w-xl">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0 w-full sm:w-auto flex flex-wrap items-center gap-2 mt-2 sm:mt-0">{right}</div>}
    </div>
  );
}
