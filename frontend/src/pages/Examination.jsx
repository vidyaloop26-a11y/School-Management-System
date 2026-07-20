import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MARK_ENTRY, REPORT_CARD } from "@/lib/stage3Data";
import { GraduationCap, Save, Award, Sparkles } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "@/components/ui/sonner";

function MarkEntry() {
  const [rows, setRows] = useState(() => MARK_ENTRY.map((r) => ({ ...r })));
  const [cls, setCls] = useState("8-A");
  const [subject, setSubject] = useState("Mathematics");
  const [exam, setExam] = useState("Term 1 Exam");

  const setMarks = (i, val) => {
    const n = Math.max(0, Math.min(100, Number(val) || 0));
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, marks: n } : r)));
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mr-auto">Sheet</div>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger data-testid="exam-class" className="w-[130px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="8-A">Class 8-A</SelectItem>
              <SelectItem value="8-B">Class 8-B</SelectItem>
              <SelectItem value="9-A">Class 9-A</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger data-testid="exam-subject" className="w-[160px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Mathematics","Science","English","Hindi","Social Science","Computer"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={exam} onValueChange={setExam}>
            <SelectTrigger data-testid="exam-name" className="w-[170px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Term 1 Exam">Term 1 Exam</SelectItem>
              <SelectItem value="Mid-Term">Mid-Term</SelectItem>
              <SelectItem value="Term 2 Exam">Term 2 Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block glass rounded-2xl p-4 md:p-5 reveal d1">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold w-[100px]">Roll No.</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold w-[220px]">Marks Obtained</th>
                <th className="px-5 py-3 font-semibold w-[120px]">Out of</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.roll} data-testid={`mark-row-${r.roll}`} className="border-t border-slate-100">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.roll}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <input
                      data-testid={`marks-input-${r.roll}`}
                      type="number"
                      min={0}
                      max={r.outOf}
                      value={r.marks}
                      onChange={(e) => setMarks(i, e.target.value)}
                      className="w-24 rounded-lg bg-white border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-3 py-1.5 text-[13.5px] font-medium text-slate-800"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{r.outOf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button data-testid="mark-save" onClick={() => toast(`Marks saved for ${cls} — ${subject}`)} className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2.5 text-[13px] font-medium shadow-sm">
            <Save className="h-4 w-4" /> Save Marks
          </button>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 reveal d1">
        {rows.map((r, i) => (
          <div key={r.roll} data-testid={`mark-card-${r.roll}`} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-[11px] text-slate-500">Roll {r.roll}</div>
                <div className="font-medium text-slate-800 text-[14px]">{r.name}</div>
              </div>
              <div className="text-[11px] text-slate-400">out of {r.outOf}</div>
            </div>
            <input
              type="number"
              min={0}
              max={r.outOf}
              value={r.marks}
              onChange={(e) => setMarks(i, e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-3 py-2 text-[15px] font-semibold text-slate-800"
            />
          </div>
        ))}
        <button data-testid="mark-save-mobile" onClick={() => toast(`Marks saved for ${cls} — ${subject}`)} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-3 text-[13px] font-medium shadow-sm">
          <Save className="h-4 w-4" /> Save Marks
        </button>
      </div>
    </div>
  );
}

function GradePill({ grade }) {
  const map = { "A+": "bg-emerald-100 text-emerald-800", "A": "bg-emerald-50 text-emerald-700", "B+": "bg-[#e6f4fb] text-[#0c6a99]", "B": "bg-amber-50 text-amber-700", "C": "bg-rose-50 text-rose-700" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${map[grade] || "bg-slate-100 text-slate-700"}`}>{grade}</span>;
}

function ReportCard() {
  const rc = REPORT_CARD;
  return (
    <div className="glass rounded-2xl p-6 md:p-8 reveal">
      {/* Report card header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white border border-[#dbeaf3] shadow-sm grid place-items-center">
              <span className="font-display font-bold text-[#29ABE2]">V</span>
            </div>
            <div className="font-display text-[18px] font-bold tracking-tight text-slate-900">
              Vidya<span className="text-[#29ABE2]">loop</span>
            </div>
          </div>
          <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase mt-3">Report Card</div>
          <div className="font-display text-[26px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight mt-1">{rc.term}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] tracking-[0.14em] font-semibold text-slate-400 uppercase">Student</div>
          <div className="text-[15px] font-semibold text-slate-800 mt-0.5">{rc.student}</div>
          <div className="text-[12px] text-slate-500 mt-1">Class {rc.classSection} · {rc.admNo}</div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block mt-6 overflow-hidden rounded-xl border border-slate-100 bg-white/70">
        <table className="min-w-full text-[13.5px]">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
              <th className="px-5 py-3 font-semibold">Subject</th>
              <th className="px-5 py-3 font-semibold w-[140px]">Marks</th>
              <th className="px-5 py-3 font-semibold w-[100px]">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rc.rows.map((r) => (
              <tr key={r.subject} className="border-t border-slate-100">
                <td className="px-5 py-3.5 font-medium text-slate-800">{r.subject}</td>
                <td className="px-5 py-3.5 text-slate-700 font-mono">{r.marks}/{r.outOf}</td>
                <td className="px-5 py-3.5"><GradePill grade={r.grade} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card rows */}
      <div className="md:hidden mt-6 space-y-2.5">
        {rc.rows.map((r) => (
          <div key={r.subject} className="glass-soft rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-slate-800 truncate">{r.subject}</div>
              <div className="text-[12px] text-slate-500 mt-0.5 font-mono">{r.marks}/{r.outOf}</div>
            </div>
            <GradePill grade={r.grade} />
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-soft rounded-xl p-4">
          <div className="text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">Total</div>
          <div className="font-display text-[24px] font-bold text-slate-900 mt-1 tracking-tight">{rc.total}<span className="text-slate-400 text-[16px] font-medium">/{rc.totalOutOf}</span></div>
        </div>
        <div className="glass-soft rounded-xl p-4">
          <div className="text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">Percentage</div>
          <div className="font-display text-[24px] font-bold text-slate-900 mt-1 tracking-tight">{rc.percentage}%</div>
        </div>
        <div className="glass-soft rounded-xl p-4">
          <div className="text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase flex items-center gap-1"><Award className="h-3 w-3 text-emerald-600" /> Overall Grade</div>
          <div className="font-display text-[24px] font-bold text-emerald-700 mt-1 tracking-tight">{rc.overallGrade}</div>
        </div>
        <div className="glass-soft rounded-xl p-4">
          <div className="text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#29ABE2]" /> Class Rank</div>
          <div className="font-display text-[24px] font-bold text-[#0c6a99] mt-1 tracking-tight">#{rc.rank}</div>
        </div>
      </div>
    </div>
  );
}

export default function Examination() {
  return (
    <div data-testid="examination-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Examination"
        subtitle="Enter marks and view report cards for term exams."
        right={<ExportButton testId="exam-export" />}
      />

      <Tabs defaultValue="entry">
        <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1">
          <TabsTrigger value="entry" data-testid="exam-tab-entry" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Mark Entry
          </TabsTrigger>
          <TabsTrigger value="report" data-testid="exam-tab-report" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" /> Report Card
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-5"><MarkEntry /></TabsContent>
        <TabsContent value="report" className="mt-5"><ReportCard /></TabsContent>
      </Tabs>
    </div>
  );
}
