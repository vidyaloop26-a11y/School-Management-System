import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { PARENT_STATS, PARENT_CHILD, DIARY_ENTRIES, NOTICES } from "@/lib/stage2Data";
import { SUBJECT_COLORS } from "@/lib/mockData";
import { ArrowRight, Megaphone } from "lucide-react";

function StatCard({ card, index }) {
  return (
    <div data-testid={`parent-stat-${card.key}`} className={`glass rounded-2xl p-5 reveal d${index + 1}`}>
      <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">
        {card.title}
      </div>
      <div className="font-display text-[36px] leading-[1.05] font-bold text-slate-900 mt-4 tracking-tight">
        {card.value}
      </div>
      <div className="text-[12.5px] text-slate-500 mt-1.5">{card.sub}</div>
    </div>
  );
}

function SubjectPill({ subject }) {
  const col = SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${col.bg} px-2.5 py-0.5 text-[11px] font-medium ${col.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} /> {subject}
    </span>
  );
}

export default function ParentDashboard() {
  const latestDiary = DIARY_ENTRIES.slice(0, 3);
  const latestNotices = NOTICES.slice(0, 2);

  return (
    <div data-testid="parent-dashboard" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="PARENT · THURSDAY, 16 JULY"
        title="Overview"
        subtitle={<>Everything on <span className="font-serif-i text-slate-700">{PARENT_CHILD.name}</span>&rsquo;s desk today.</>}
        right={
          <div className="text-right">
            <div className="text-[11px] tracking-[0.14em] text-slate-400 uppercase">Child</div>
            <div className="text-[13.5px] font-medium text-slate-800 mt-0.5">{PARENT_CHILD.name} · Class {PARENT_CHILD.classSection}</div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {PARENT_STATS.map((c, i) => <StatCard key={c.key} card={c} index={i} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Latest diary */}
        <div className="glass rounded-2xl p-6 reveal d5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Latest Diary Entries</div>
              <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">From today &amp; yesterday</div>
            </div>
            <Link to="/diary" data-testid="diary-view-all" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0c6a99] hover:underline">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {latestDiary.map((d) => (
              <li key={d.id} className="glass-soft rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <SubjectPill subject={d.subject} />
                  <span className="text-[11px] text-slate-400">{d.date}</span>
                </div>
                <div className="text-[13.5px] text-slate-700 leading-relaxed">{d.entry}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Latest notices */}
        <div className="glass rounded-2xl p-6 reveal d5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Recent Notices</div>
              <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">From the school</div>
            </div>
            <Link to="/communication" data-testid="notices-view-all" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0c6a99] hover:underline">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {latestNotices.map((n) => (
              <li key={n.id} className="glass-soft rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#e6f4fb] text-[#0c6a99] grid place-items-center shrink-0">
                    <Megaphone className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13.5px] font-semibold text-slate-800 leading-snug">{n.title}</div>
                      <span className="text-[11px] text-slate-400 shrink-0">{n.date}</span>
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">Audience · {n.audience}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
