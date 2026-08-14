import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { useDashboard } from "@/lib/queries";
import { useAuth } from "@/lib/AuthContext";
import { ClipboardCheck, BookOpen, ArrowRight, Loader2 } from "lucide-react";

function StatCard({ card, index }) {
  return (
    <div data-testid={`teacher-stat-${card.key}`} className={`glass rounded-2xl p-5 reveal d${index + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">
          {card.title}
        </div>
      </div>
      <div className="font-display text-[38px] leading-[1.05] font-bold text-slate-900 mt-4 tracking-tight">
        {card.value}
      </div>
      <div className="text-[12.5px] text-slate-500 mt-1.5">{card.sub}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" /></div>;
  }

  const stats = data?.stats || {};
  const staff = data?.staff || {};
  const classesList = stats.classesList || [];

  const cards = [
    { key: "classes", title: "My Classes", value: stats.classes || 0, sub: classesList.length ? classesList.join(", ") : "no classes assigned", trend: null },
    { key: "attendance", title: "Attendance Marked Today", value: stats.attendanceMarkedToday || 0, sub: "records for today", trend: null },
  ];

  return (
    <div data-testid="teacher-dashboard" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="TEACHER"
        title="Overview"
        subtitle={<>A snapshot of today at <span className="font-serif-i text-slate-700">Vidyaloop</span>.</>}
        right={
          <div className="text-right">
            <div className="text-[11px] tracking-[0.14em] text-slate-400 uppercase">Signed in as</div>
            <div className="text-[13.5px] font-medium text-slate-800 mt-0.5">{staff.name || user?.name} · {staff.staffId || ""}</div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div data-testid="teacher-stat-subject" className="glass rounded-2xl p-5 reveal">
          <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">Subject</div>
          <div className="font-display text-[22px] leading-tight font-bold text-slate-900 mt-4 tracking-tight">{staff.subject || "—"}</div>
        </div>
        {cards.map((c, i) => <StatCard key={c.key} card={c} index={i + 1} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 reveal d5">
        <Link to="/attendance" data-testid="qa-mark-attendance" className="group glass rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg transition">
          <div className="h-14 w-14 rounded-2xl bg-[#29ABE2] grid place-items-center text-white shrink-0 shadow-sm">
            <ClipboardCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Quick action</div>
            <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">Mark Attendance</div>
            <div className="text-[12.5px] text-slate-500 mt-1">Record today&rsquo;s attendance for your classes.</div>
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