import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import TrendPill from "@/components/common/TrendPill";
import { TEACHER_STATS, TEACHER_ME } from "@/lib/stage2Data";
import { ClipboardCheck, BookOpen, ArrowRight, ArrowDownRight } from "lucide-react";

function StatCard({ card, index }) {
  const t = card.trend;
  return (
    <div data-testid={`teacher-stat-${card.key}`} className={`glass rounded-2xl p-5 reveal d${index + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">
          {card.title}
        </div>
        {t && t.dir === "down-good" && (
          <span className="inline-flex items-center gap-1 rounded-full pill-up px-2 py-0.5 text-[11px] font-medium">
            <ArrowDownRight className="h-3 w-3" strokeWidth={2.2} /> {t.text}
          </span>
        )}
        {t && t.dir === "up" && <TrendPill text={t.text} dir="up" />}
      </div>
      <div className="font-display text-[38px] leading-[1.05] font-bold text-slate-900 mt-4 tracking-tight">
        {card.value}
      </div>
      <div className="text-[12.5px] text-slate-500 mt-1.5">{card.sub}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <div data-testid="teacher-dashboard" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="TEACHER · THURSDAY, 16 JULY"
        title="Overview"
        subtitle={<>A snapshot of today at <span className="font-serif-i text-slate-700">Vidyaloop</span>.</>}
        right={
          <div className="text-right">
            <div className="text-[11px] tracking-[0.14em] text-slate-400 uppercase">Signed in as</div>
            <div className="text-[13.5px] font-medium text-slate-800 mt-0.5">{TEACHER_ME.name} · {TEACHER_ME.id}</div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {TEACHER_STATS.map((c, i) => <StatCard key={c.key} card={c} index={i} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 reveal d5">
        <Link to="/attendance" data-testid="qa-mark-attendance" className="group glass rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg transition">
          <div className="h-14 w-14 rounded-2xl bg-[#29ABE2] grid place-items-center text-white shrink-0 shadow-sm">
            <ClipboardCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Quick action</div>
            <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">Mark Attendance</div>
            <div className="text-[12.5px] text-slate-500 mt-1">9-A is still pending for today.</div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#29ABE2] group-hover:translate-x-1 transition" />
        </Link>

        <Link to="/diary" data-testid="qa-post-diary" className="group glass rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg transition">
          <div className="h-14 w-14 rounded-2xl bg-white border border-[#29ABE2] grid place-items-center text-[#29ABE2] shrink-0">
            <BookOpen className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Quick action</div>
            <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">Post to Digital Diary</div>
            <div className="text-[12.5px] text-slate-500 mt-1">Share updates with parents in one place.</div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#29ABE2] group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  );
}
