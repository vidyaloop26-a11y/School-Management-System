import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassAttendance, useMarkAttendance, useStudentAttendance } from "@/lib/queries";
import { Check, X, CheckCircle2, XCircle, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

function TeacherMark() {
  const [cls, setCls] = useState("8");
  const [sec, setSec] = useState("A");
  const today = new Date().toISOString().slice(0, 10);

  const { data, isLoading, refetch } = useClassAttendance(cls, sec, today);
  const markMutation = useMarkAttendance();
  const [localStatus, setLocalStatus] = useState(null);

  const roster = (data?.roster || []).map((r) => ({ ...r, status: localStatus?.[r.studentId] ?? r.status }));

  const setStatus = (studentId, status) => {
    setLocalStatus((prev) => ({ ...(prev || {}), [studentId]: status }));
  };
  const markAll = () => {
    const all = {};
    roster.forEach((r) => { all[r.studentId] = "P"; });
    setLocalStatus(all);
  };

  const submit = async () => {
    const marks = roster.map((r) => ({ studentId: r.studentId, status: r.status || "P" }));
    try {
      await markMutation.mutateAsync({ cls, section: sec, date: today, marks });
      toast.success(`Attendance submitted for ${cls}-${sec}`);
      setLocalStatus(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit attendance");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="ATTENDANCE"
        title="Mark Attendance"
        subtitle={`Class ${cls}-${sec} · ${today}`}
        right={
          <div className="flex items-center gap-3">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger data-testid="attendance-class-select" className="w-[110px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sec} onValueChange={setSec}>
              <SelectTrigger data-testid="attendance-section-select" className="w-[100px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["A","B","C","D","E"].map((s) => <SelectItem key={s} value={s}>Sec {s}</SelectItem>)}
              </SelectContent>
            </Select>
            <button data-testid="mark-all-present" onClick={markAll} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              Mark All Present
            </button>
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
          </div>
        ) : (
          <>
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
                  {roster.map((r) => (
                    <tr key={r.studentId} data-testid={`attendance-row-${r.roll}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.roll}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            data-testid={`present-${r.roll}`}
                            onClick={() => setStatus(r.studentId, "P")}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${r.status === "P" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200"}`}
                          >
                            <Check className="h-3.5 w-3.5" /> Present
                          </button>
                          <button
                            data-testid={`absent-${r.roll}`}
                            onClick={() => setStatus(r.studentId, "A")}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${r.status === "A" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-slate-200 hover:border-rose-200"}`}
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
              {roster.map((r) => (
                <div key={r.studentId} data-testid={`attendance-card-${r.roll}`} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-slate-500">Roll {r.roll}</div>
                      <div className="font-medium text-slate-800 text-[14px] mt-0.5">{r.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      data-testid={`m-present-${r.roll}`}
                      onClick={() => setStatus(r.studentId, "P")}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium border transition ${r.status === "P" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200"}`}
                    >
                      <Check className="h-3.5 w-3.5" /> Present
                    </button>
                    <button
                      data-testid={`m-absent-${r.roll}`}
                      onClick={() => setStatus(r.studentId, "A")}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium border transition ${r.status === "A" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-slate-200"}`}
                    >
                      <X className="h-3.5 w-3.5" /> Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-5">
              <div className="text-[12.5px] text-slate-500">
                <span className="font-medium text-emerald-700">{roster.filter((r) => r.status === "P").length} present</span> ·
                <span className="font-medium text-rose-700 ml-1">{roster.filter((r) => r.status === "A").length} absent</span>
              </div>
              <button
                data-testid="submit-attendance"
                onClick={submit}
                disabled={markMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm disabled:opacity-50"
              >
                {markMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ParentCalendar() {
  const { user } = useAuth();
  const now = new Date();
  const { data: cal, isLoading } = useStudentAttendance(user?.studentId || null, now.getMonth() + 1, now.getFullYear());

  const childName = cal?.student?.name || user?.name || "your child";
  const weekdayLabels = ["S","M","T","W","T","F","S"];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" /></div>;
  }

  if (!cal) return <div className="p-8 text-slate-500">No attendance data available.</div>;

  const cells = [];
  for (let i = 0; i < new Date(cal.year, cal.month - 1, 1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= cal.daysInMonth; d++) cells.push(d);

  const codeCls = {
    P: "bg-[#e6f4fb] text-[#0c6a99] border-[#c9e7f5]",
    A: "bg-rose-50 text-rose-700 border-rose-200",
    L: "bg-amber-50 text-amber-700 border-amber-200",
    H: "bg-slate-100 text-slate-400 border-slate-200",
  };

  const { present, absent, late, percent } = cal.summary || {};

  return (
    <div>
      <PageHeader
        eyebrow="PARENT · ATTENDANCE"
        title="Attendance"
        subtitle={`Monthly view for ${childName} · ${cal.month}/${cal.year}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 text-[#29ABE2]" />
              <div className="font-display text-[22px] font-bold tracking-tight">{cal.month}/{cal.year}</div>
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
                  <div className="text-[9px] mt-0.5 tracking-wider uppercase opacity-80">{code === "P" ? "Present" : code === "A" ? "Absent" : code === "L" ? "Late" : code === "H" ? "Holiday" : ""}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">This month</div>
          <div className="font-display text-[48px] font-bold text-slate-900 mt-2 leading-none tracking-tight">
            {percent != null ? `${percent}%` : "—"}
          </div>
          <div className="text-[13px] text-slate-500 mt-1">Attendance percentage</div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Present</span></div>
              <div className="text-[24px] font-bold text-emerald-800 mt-1">{present || 0}</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3">
              <div className="flex items-center gap-2 text-rose-700"><XCircle className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Absent</span></div>
              <div className="text-[24px] font-bold text-rose-800 mt-1">{absent || 0}</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 text-amber-700"><CheckCircle2 className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Late</span></div>
              <div className="text-[24px] font-bold text-amber-800 mt-1">{late || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  return (
    <div data-testid="attendance-page" className="max-w-[1400px] mx-auto">
      {user?.role === "parent" ? <ParentCalendar /> : <TeacherMark />}
    </div>
  );
}