import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { useDataStore } from "@/lib/dataStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassAttendance, useMarkAttendance } from "@/lib/queries";
import { Check, X, CheckCircle2, XCircle, CalendarDays, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

// Roster seed for offline fallback
const SEED_ROSTER = [
  { studentId: "S101", roll: 1, name: "Aarav Sharma", status: "P" },
  { studentId: "S102", roll: 2, name: "Ananya Patel", status: "P" },
  { studentId: "S103", roll: 3, name: "Devansh Gupta", status: "A" },
  { studentId: "S104", roll: 4, name: "Ishita Verma", status: "P" },
  { studentId: "S105", roll: 5, name: "Kabir Mehta", status: "L" },
  { studentId: "S106", roll: 6, name: "Meera Nair", status: "P" },
  { studentId: "S107", roll: 7, name: "Rohan Singh", status: "P" },
  { studentId: "S108", roll: 8, name: "Sanya Rao", status: "P" },
  { studentId: "S109", roll: 9, name: "Vihaan Reddy", status: "A" },
  { studentId: "S110", roll: 10, name: "Zara Joshi", status: "P" },
];

function TeacherMark() {
  const { markClassAttendance, attendance: storeAttendance } = useDataStore();
  const [cls, setCls] = useState("10");
  const [sec, setSec] = useState("A");
  const today = new Date().toISOString().slice(0, 10);

  const { data: apiData } = useClassAttendance(cls, sec, today);
  const classKey = `${cls}-${sec}`;
  const dayStore = storeAttendance[today]?.[classKey] || {};

  const [localStatus, setLocalStatus] = useState({});

  const initialRoster = apiData?.roster || SEED_ROSTER;
  const roster = initialRoster.map((r) => {
    const currentStatus = localStatus[r.studentId] || dayStore[r.studentId] || r.status || "P";
    return { ...r, status: currentStatus };
  });

  const setStatus = (studentId, status) => {
    setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = () => {
    const all = {};
    roster.forEach((r) => { all[r.studentId] = "P"; });
    setLocalStatus(all);
    toast.success(`Marked all students as Present for Class ${cls}-${sec}`);
  };

  const submit = () => {
    const map = {};
    roster.forEach((r) => {
      map[r.studentId] = r.status;
    });
    markClassAttendance(today, classKey, map);
    toast.success(`Attendance submitted and saved for Class ${cls}-${sec} (${today})`);
  };

  const presentCount = roster.filter((r) => r.status === "P").length;
  const absentCount = roster.filter((r) => r.status === "A").length;
  const lateCount = roster.filter((r) => r.status === "L").length;

  return (
    <div>
      <PageHeader
        eyebrow="ATTENDANCE · DAILY LOG"
        title="Mark Class Attendance"
        subtitle={`Class ${cls}-${sec} · ${today}`}
        right={
          <div className="flex flex-wrap items-center gap-3">
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
            <button data-testid="mark-all-present" onClick={markAll} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition">
              Mark All Present
            </button>
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {/* Summary bar */}
        <div className="flex items-center justify-between px-2 pb-4 mb-4 border-b border-slate-100 text-[13px]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Absent: {absentCount}
            </span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Late: {lateCount}
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold w-[100px]">Roll No.</th>
                <th className="px-5 py-3 font-semibold">Student Name</th>
                <th className="px-5 py-3 font-semibold w-[320px] text-right">Attendance Status</th>
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition ${r.status === "P" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"}`}
                      >
                        <Check className="h-3.5 w-3.5" /> Present
                      </button>
                      <button
                        data-testid={`absent-${r.roll}`}
                        onClick={() => setStatus(r.studentId, "A")}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition ${r.status === "A" ? "bg-rose-500 text-white border-rose-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"}`}
                      >
                        <X className="h-3.5 w-3.5" /> Absent
                      </button>
                      <button
                        onClick={() => setStatus(r.studentId, "L")}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition ${r.status === "L" ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-3">
          {roster.map((r) => (
            <div key={r.studentId} className="glass-soft rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] text-slate-400">Roll #{r.roll}</div>
                <div className="font-medium text-slate-800 text-[14px]">{r.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatus(r.studentId, "P")}
                  className={`flex-1 rounded-full py-2 text-[12.5px] font-medium border ${r.status === "P" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus(r.studentId, "A")}
                  className={`flex-1 rounded-full py-2 text-[12.5px] font-medium border ${r.status === "A" ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end mt-5 pt-4 border-t border-slate-100">
          <button
            data-testid="submit-attendance"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Attendance Log
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentCalendar() {
  const { user } = useAuth();
  const childName = user?.name || "Aarav Sharma";
  const weekdayLabels = ["S","M","T","W","T","F","S"];

  const marks = {
    1: "P", 2: "P", 3: "P", 4: "P", 5: "H", 6: "H",
    7: "P", 8: "P", 9: "L", 10: "P", 11: "P", 12: "H", 13: "H",
    14: "P", 15: "A", 16: "P", 17: "P", 18: "P", 19: "H", 20: "H"
  };

  const codeCls = {
    P: "bg-[#e6f4fb] text-[#0c6a99] border-[#c9e7f5]",
    A: "bg-rose-50 text-rose-700 border-rose-200",
    L: "bg-amber-50 text-amber-700 border-amber-200",
    H: "bg-slate-100 text-slate-400 border-slate-200",
  };

  return (
    <div>
      <PageHeader
        eyebrow="PARENT · ATTENDANCE"
        title="Attendance Record"
        subtitle={`Monthly log for ${childName} · Class 10-A`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 text-[#29ABE2]" />
              <div className="font-display text-[20px] font-bold tracking-tight">August 2026</div>
            </div>
            <div className="flex items-center gap-3 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#29ABE2]" /> Present</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Absent</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Holiday</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((w, i) => (
              <div key={i} className="text-[10.5px] tracking-widest text-slate-400 uppercase text-center pb-1 font-bold">{w}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const code = marks[d] || "P";
              const cls = codeCls[code];
              return (
                <div
                  key={d}
                  data-testid={`cal-day-${d}`}
                  className={`aspect-square rounded-xl border ${cls} flex flex-col items-center justify-center`}
                >
                  <div className="text-[13px] font-semibold">{d}</div>
                  <div className="text-[9px] tracking-wider uppercase opacity-80">{code === "P" ? "Present" : code === "A" ? "Absent" : code === "L" ? "Late" : "Holiday"}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">This Month Rate</div>
          <div className="font-display text-[48px] font-bold text-slate-900 mt-2 leading-none tracking-tight">
            94.4%
          </div>
          <div className="text-[13px] text-slate-500 mt-1">Excellent attendance record</div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Present</span></div>
              <div className="text-[24px] font-bold text-emerald-800 mt-1">17 Days</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3">
              <div className="flex items-center gap-2 text-rose-700"><XCircle className="h-4 w-4" /><span className="text-[11px] tracking-widest uppercase font-semibold">Absent</span></div>
              <div className="text-[24px] font-bold text-rose-800 mt-1">1 Day</div>
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