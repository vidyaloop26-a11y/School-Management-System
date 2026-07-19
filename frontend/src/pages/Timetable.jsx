import React, { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS, PERIODS, TIMETABLE_8A, SUBJECT_COLORS, STAFF } from "@/lib/mockData";

export default function Timetable() {
  const [view, setView] = useState("class"); // class | teacher
  const [teacher, setTeacher] = useState("Neha Kulkarni");

  const grid = useMemo(() => {
    if (view === "class") return TIMETABLE_8A;
    // teacher view: filter cells to teacher only
    const out = {};
    PERIODS.forEach((pr) => {
      out[pr.key] = {};
      DAYS.forEach((d) => {
        const c = TIMETABLE_8A[pr.key][d];
        out[pr.key][d] = c && c.teacher === teacher ? { ...c, cls: "8-A" } : null;
      });
    });
    return out;
  }, [view, teacher]);

  const teachers = Array.from(new Set(STAFF.filter((s) => s.role === "Teacher").map((s) => s.name)));

  return (
    <div data-testid="timetable-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Timetable"
        subtitle={view === "class" ? "Weekly schedule for Class 8-A." : `Weekly schedule for ${teacher}.`}
        right={
          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1">
                <TabsTrigger data-testid="tt-class-view" value="class" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Class view</TabsTrigger>
                <TabsTrigger data-testid="tt-teacher-view" value="teacher" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Teacher view</TabsTrigger>
              </TabsList>
            </Tabs>
            {view === "class" ? (
              <Select value="8A" onValueChange={() => {}}>
                <SelectTrigger data-testid="tt-class-select" className="w-[140px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8A">Class 8-A</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={teacher} onValueChange={setTeacher}>
                <SelectTrigger data-testid="tt-teacher-select" className="w-[200px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
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
                    const cell = grid[pr.key][d];
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
                                {view === "teacher" ? `Room ${cell.room} · Class ${cell.cls}` : `Room ${cell.room}`}
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="center" className="w-[260px] rounded-2xl border-slate-200/80 p-4">
                            <div className="text-[10.5px] tracking-[0.16em] font-semibold text-slate-500 uppercase">{pr.label} · {pr.time}</div>
                            <div className={`mt-1 text-[16px] font-semibold ${col.text}`}>{cell.subject}</div>
                            <div className="mt-3 space-y-1 text-[12.5px] text-slate-600">
                              <div><span className="text-slate-400">Teacher</span> · {cell.teacher}</div>
                              <div><span className="text-slate-400">Room</span> · {cell.room}</div>
                              <div><span className="text-slate-400">{view === "teacher" ? "Class" : "Day"}</span> · {view === "teacher" ? cell.cls : d}</div>
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
      </div>
    </div>
  );
}
