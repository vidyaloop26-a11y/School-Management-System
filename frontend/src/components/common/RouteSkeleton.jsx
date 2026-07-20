import React from "react";

// Generic pulsing skeleton shown briefly during route/role transitions.
// Matches the shape of a typical page (header + 4 stat cards + list block).
export default function RouteSkeleton() {
  return (
    <div data-testid="route-skeleton" className="max-w-[1400px] mx-auto animate-pulse">
      {/* Page header */}
      <div className="mb-8">
        <div className="h-3 w-40 rounded-full bg-slate-200/70" />
        <div className="h-10 md:h-14 w-3/4 md:w-1/2 rounded-2xl bg-slate-200/70 mt-3" />
        <div className="h-3 w-1/3 rounded-full bg-slate-200/60 mt-3" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 h-32">
            <div className="h-2.5 w-2/3 rounded-full bg-slate-200/70" />
            <div className="h-8 w-1/2 rounded-lg bg-slate-200/70 mt-6" />
            <div className="h-2.5 w-3/4 rounded-full bg-slate-200/60 mt-3" />
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 flex-1 rounded-full bg-slate-200/60" />
          <div className="h-8 w-24 rounded-full bg-slate-200/60 hidden sm:block" />
          <div className="h-8 w-24 rounded-full bg-slate-200/60 hidden sm:block" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-200/50" />
        ))}
      </div>
    </div>
  );
}
