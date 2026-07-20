import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useRole } from "@/lib/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTENDANCE_ROSTER_8A, PARENT_ATTENDANCE_JULY_2026, PARENT_CHILD } from "@/lib/stage2Data";
import { Check, X, CheckCircle2, XCircle, CalendarDays } from "lucide-react";

function TeacherMark() {
  const [cls, setCls] = useState("8-A");
  const [roster, setRoster] = useState(() =>
    ATTENDANCE_ROSTER_8A.map((r) => ({ ...r }))
  );

  const toggle = (i) =>
    setRoster((prev) => prev.map((r, idx) => idx === i ? { ...r, status: r.status === "Present" ? "Absent" : "Present" } : r));
  const markAll = () => setRoster((prev) => prev.map((r) => ({ ...r, status: "Present" })));

  const today = "16 Jul 2026";

  return (
    <div>
      <PageHeader
        eyebrow="TEACHER · ATTENDANCE"
        title="Mark Attendance"
        subtitle={<>Class {cls} &middot; {today}</>}
        right={
          <div className="flex items-center gap-3">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger data-testid="attendance-class-select" className="w-[130px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="8-A">Class 8-A</SelectItem>
                <SelectItem value="8-B">Class 8-B</SelectItem>
                <SelectItem value="9-A">Class 9-A</SelectItem>
              </SelectContent>
            </Select>
            <button data-testid="mark-all-present" onClick={markAll} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              Mark All Present
            </button>
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold w-[100px]">Roll No.</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold w-[240px] text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r, i) => (
                <tr key={r.roll} data-testid={`attendance-row-${r.roll}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.roll}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        data-testid={`present-${r.roll}`}
                        onClick={() => setRoster((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "Present" } : x))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${r.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200"}`}
                      >
                        <Check className="h-3.5 w-3.5" /> Present
                      </button>
                      <button
                        data-testid={`absent-${r.roll}`}
                        onClick={() => setRoster((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "Absent" } : x))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${r.status === "Absent" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-slate-200 hover:border-rose-200"}`}
                      >
                        <X className="h-3.5 w-3.5" /> Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2.5">
          {roster.map((r, i) => (
            <div key={r.roll} data-testid={`attendance-card-${r.roll}`} className="glass-soft rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-slate-500">Roll {r.roll}</div>
                  <div className="font-medium text-slate-800 text-[14px] mt-0.5">{r.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid={`m-present-${r.roll}`}
                  onClick={() => setRoster((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "Present" } : x))}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium border transition ${r.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200"}`}
                >
                  <Check className="h-3.5 w-3.5" /> Present
                </button>
                <button
                  data-testid={`m-absent-${r.roll}`}
                  onClick={() => setRoster((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "Absent" } : x))}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium border transition ${r.status === "Absent" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-slate-200"}`}
                >
                  <X className="h-3.5 w-3.5" /> Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-5">
          <div className="text-[12.5px] text-slate-500">
            <span className="font-medium text-emerald-700">{roster.filter(r => r.status === "Present").length} present</span> ·
            <span className="font-medium text-rose-700 ml-1">{roster.filter(r => r.status === "Absent").length} absent</span>
          </div>
          <button data-testid="submit-attendance" className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentCalendar() {
  const cal = PARENT_ATTENDANCE_JULY_2026;
  const weekdayLabels = ["S","M","T","W","T","F","S"];

  const cells = [];
  for (let i = 0; i < cal.firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= cal.daysInMonth; d++) cells.push(d);

  const codeCls = {
    P: "bg-[#e6f4fb] text-[#0c6a99] border-[#c9e7f5]",
    A: "bg-rose-50 text-rose-700 border-rose-200",
    H: "bg-slate-100 text-slate-400 border-slate-200",
  };

  const present = Object.values(cal.marks).filter(c => c === "P").length;
  const absent  = Object.values(cal.marks).filter(c => c === "A").length;

  return (
    <div>
      <PageHeader
        eyebrow="PARENT · ATTENDANCE"
        title="Attendance"
        subtitle={<>Monthly view for <span className="font-serif-i text-slate-700">{PARENT_CHILD.name}</span> &middot; {cal.month} {cal.year}</>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 text-[#29ABE2]" />
              <div className="font-display text-[22px] font-bold tracking-tight">{cal.month} {cal.year}</div>
            </div>
            <div className="flex items-center gap-3 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#29ABE2]" /> Present</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Absent</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Holiday</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((w, i) => (
              <div key={i} className="text-[10.5px] tracking-widest text-slate-400 uppercase text-center pb-1">{w}</div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const code = cal.marks[d];
              const cls = codeCls[code] || "bg-white/50 text-slate-400 border-slate-100";
              return (
                <div
                  key={i}
                  data-testid={`cal-day-${d}`}
                  className={`aspect-square rounded-xl border ${cls} flex flex-col items-center justify-center`}
                >
                  <div className="text-[13px] font-semibold">{d}</div>
                  <div className="text-[9px] mt-0.5 tracking-wider uppercase opacity-80">{code === "P" ? "Present" : code === "A" ? "Absent" : "Holiday"}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">This month</div>
          <div className="font-display text-[48px] font-bold text-slate-900 mt-2 leading-none tracking-tight">91.3%</div>
          <div className="text-[13px] text-slate-500 mt-1">{cal.summary}</div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Present</span></div>
              <div className="text-[24px] font-bold text-emerald-800 mt-1">{present}</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3">
              <div className="flex items-center gap-2 text-rose-700"><XCircle className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Absent</span></div>
              <div className="text-[24px] font-bold text-rose-800 mt-1">{absent}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { role } = useRole();
  return (
    <div data-testid="attendance-page" className="max-w-[1400px] mx-auto">
      {role === "Parent" ? <ParentCalendar /> : <TeacherMark />}
    </div>
  );
}
