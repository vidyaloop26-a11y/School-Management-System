import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { useDashboard, useStudentAttendance } from "@/lib/queries";
import { useAuth } from "@/lib/AuthContext";
import { ArrowRight, Loader2 } from "lucide-react";

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

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const now = new Date();
  const { data: attendance } = useStudentAttendance(user?.studentId || null, now.getMonth() + 1, now.getFullYear());

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" /></div>;
  }

  const child = data?.child || {};
  const school = data?.school || {};
  const attSummary = attendance?.summary || data?.attendance || {};

  const cards = [
    { key: "child", title: "Child", value: child.name || "—", sub: child.classSection ? `Class ${child.classSection}` : "" },
    { key: "school", title: "School", value: school.name || "—", sub: school.session ? `Session ${school.session}` : "" },
    { key: "attendance", title: "Attendance This Month", value: attSummary.percent != null ? `${attSummary.percent}%` : "—", sub: `${attSummary.present || 0} present · ${attSummary.absent || 0} absent` },
    { key: "admno", title: "Admission No.", value: child.admNo || "—", sub: "enrollment record" },
  ];

  return (
    <div data-testid="parent-dashboard" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="PARENT"
        title="Overview"
        subtitle={<>Everything on <span className="font-serif-i text-slate-700">{child.name}</span>&rsquo;s desk today.</>}
        right={
          <div className="text-right">
            <div className="text-[11px] tracking-[0.14em] text-slate-400 uppercase">Child</div>
            <div className="text-[13.5px] font-medium text-slate-800 mt-0.5">{child.name} · Class {child.classSection}</div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((c, i) => <StatCard key={c.key} card={c} index={i} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-6 reveal d5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Attendance</div>
              <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">This month</div>
            </div>
            <Link to="/attendance" data-testid="attendance-view-all" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0c6a99] hover:underline">
              View Calendar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="text-[11px] text-emerald-700 tracking-widest uppercase">Present</div>
              <div className="text-[24px] font-bold text-emerald-800">{attSummary.present || 0}</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3">
              <div className="text-[11px] text-rose-700 tracking-widest uppercase">Absent</div>
              <div className="text-[24px] font-bold text-rose-800">{attSummary.absent || 0}</div>
            </div>
            <div className="rounded-xl bg-[#e6f4fb] px-4 py-3">
              <div className="text-[11px] text-[#0c6a99] tracking-widest uppercase">Percent</div>
              <div className="text-[24px] font-bold text-[#0c6a99]">{attSummary.percent != null ? `${attSummary.percent}%` : "—"}</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Timetable</div>
              <div className="font-display text-[22px] font-bold text-slate-900 tracking-tight mt-0.5">This week</div>
            </div>
            <Link to="/timetable" data-testid="timetable-view-all" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0c6a99] hover:underline">
              View Timetable <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="glass-soft rounded-xl p-4 text-center py-8">
            <span className="text-[13px] text-slate-500">Open the Timetable page for the full weekly schedule.</span>
          </div>
        </div>
      </div>
    </div>
  );
}