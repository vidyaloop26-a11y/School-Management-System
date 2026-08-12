import React, { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS, PERIODS, SUBJECT_COLORS } from "@/lib/mockData";
import { useClassTimetable, useTeacherTimetable, useStaff } from "@/lib/queries";
import { Loader2 } from "lucide-react";

export default function Timetable() {
  const [view, setView] = useState("class"); // class | teacher
  const [classVal, setClassVal] = useState("");
  const [teacherVal, setTeacherVal] = useState("");

  const { data: teacherData = [] } = useStaff({ search: undefined });

  // Derive class options from staff/view behaviour remains simple: default 8-A if nothing set
  const safeClass = classVal || "8-A";
  const parsed = safeClass.split("-");
  const cls = parsed[0];
  const section = parsed[1] || "A";

  const { data: classTT, isLoading: classLoading } = useClassTimetable(cls, section);
  const { data: teacherEntries, isLoading: teacherLoading } = useTeacherTimetable(teacherVal || null);

  const teachers = teacherData.filter((s) => (s.jobTitle || "").toLowerCase() === "teacher").map((s) => ({ id: s.id, name: s.name }));

  const classOptions = useMemo(() => {
    const opts = [];
    for (let c = 1; c <= 10; c++) {
      for (const sec of ["A", "B"]) opts.push(`${c}-${sec}`);
    }
    return opts;
  }, []);

  // Teacher grid from flat entries
  const teacherGrid = useMemo(() => {
    const out = {};
    PERIODS.forEach((pr) => {
      out[pr.key] = {};
      DAYS.forEach((d) => {
        out[pr.key][d] = null;
      });
    });
    (teacherEntries || []).forEach((e) => {
      if (!out[e.period]) out[e.period] = {};
      out[e.period][e.day] = { subject: e.subject, room: e.room, classSection: e.classSection };
    });
    return out;
  }, [teacherEntries]);

  const grid = view === "class" ? (classTT?.grid || {}) : teacherGrid;
  const isLoadingGrid = view === "class" ? classLoading : teacherLoading;

  return (
    <div data-testid="timetable-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Timetable"
        subtitle={view === "class" ? `Weekly schedule for Class ${safeClass}.` : "Weekly schedule by teacher."}
        right={
          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1">
                <TabsTrigger data-testid="tt-class-view" value="class" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Class view</TabsTrigger>
                <TabsTrigger data-testid="tt-teacher-view" value="teacher" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Teacher view</TabsTrigger>
              </TabsList>
            </Tabs>
            {view === "class" ? (
              <Select value={safeClass} onValueChange={setClassVal}>
                <SelectTrigger data-testid="tt-class-select" className="w-[140px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Select value={teacherVal} onValueChange={setTeacherVal}>
                <SelectTrigger data-testid="tt-teacher-select" className="w-[200px] rounded-full bg-white/80"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select teacher</SelectItem>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {isLoadingGrid ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-3 text-[10.5px] tracking-[0.14em] font-semibold text-slate-500 uppercase w-[130px]">Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-left px-3 py-3 text-[10.5px] tracking-[0.14em] font-semibold text-slate-500 uppercase">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((pr) => (
                  <tr key={pr.key} className="border-t border-slate-100">
                    <td className="px-3 py-3 align-top">
                      <div className="font-semibold text-slate-800">{pr.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{pr.time}</div>
                    </td>
                    {DAYS.map((d) => {
                      if (pr.key === "BREAK") {
                        return (
                          <td key={d} className="px-2 py-2 align-top">
                            <div className="rounded-xl bg-slate-50 text-slate-400 text-[12px] font-medium px-3 py-3 text-center border border-dashed border-slate-200">
                              Break
                            </div>
                          </td>
                        );
                      }
                      const cell = grid[pr.key]?.[d];
                      if (!cell) {
                        return (
                          <td key={d} className="px-2 py-2 align-top">
                            <div className="rounded-xl border border-dashed border-slate-200 text-slate-300 text-[12px] px-3 py-4 text-center">—</div>
                          </td>
                        );
                      }
                      const col = SUBJECT_COLORS[cell.subject] || { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };
                      return (
                        <td key={d} className="px-2 py-2 align-top">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                data-testid={`tt-cell-${pr.key}-${d}`}
                                className={`w-full text-left rounded-xl ${col.bg} px-3.5 py-3 transition hover:scale-[1.015] hover:shadow-[0_6px_20px_-8px_rgba(20,60,100,0.18)] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                                  <div className={`text-[13px] font-semibold ${col.text}`}>{cell.subject}</div>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  {view === "teacher"
                                    ? `Room ${cell.room || "—"} · ${cell.classSection || ""}`
                                    : `Room ${cell.room || "—"}${cell.teacher ? ` · ${cell.teacher}` : ""}`}
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="center" className="w-[260px] rounded-2xl border-slate-200/80 p-4">
                              <div className="text-[10.5px] tracking-[0.16em] font-semibold text-slate-500 uppercase">{pr.label} · {pr.time}</div>
                              <div className={`mt-1 text-[16px] font-semibold ${col.text}`}>{cell.subject}</div>
                              <div className="mt-3 space-y-1 text-[12.5px] text-slate-600">
                                {cell.teacher && <div><span className="text-slate-400">Teacher</span> · {cell.teacher}</div>}
                                <div><span className="text-slate-400">Room</span> · {cell.room || "—"}</div>
                                {view === "teacher" && cell.classSection && <div><span className="text-slate-400">Class</span> · {cell.classSection}</div>}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}