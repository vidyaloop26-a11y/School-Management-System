import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORT_CARD } from "@/lib/stage3Data";
import { GraduationCap, Save, Award, Printer } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "sonner";
import { useDataStore } from "@/lib/dataStore";

function MarkEntry() {
  const { exams, updateExamMark } = useDataStore();
  const [cls, setCls] = useState("8-A");
  const [subject, setSubject] = useState("Mathematics");
  const [exam, setExam] = useState("Term 1 Exam");

  const handleMarkChange = (admNo, val) => {
    updateExamMark(admNo, val);
  };

  const handleSave = () => {
    toast.success(`Exam marks saved for Class ${cls} — ${subject} (${exam})`);
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mr-auto">Class & Subject Selection</div>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger data-testid="exam-class" className="w-[130px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="8-A">Class 8-A</SelectItem>
              <SelectItem value="8-B">Class 8-B</SelectItem>
              <SelectItem value="9-A">Class 9-A</SelectItem>
              <SelectItem value="10-A">Class 10-A</SelectItem>
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
                <th className="px-5 py-3 font-semibold">Adm No.</th>
                <th className="px-5 py-3 font-semibold">Student Name</th>
                <th className="px-5 py-3 font-semibold w-[180px]">Marks Obtained</th>
                <th className="px-5 py-3 font-semibold w-[100px]">Out of</th>
                <th className="px-5 py-3 font-semibold w-[100px]">Grade</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((r) => (
                <tr key={r.admNo || r.roll} data-testid={`mark-row-${r.roll}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.roll}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.admNo}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <input
                      data-testid={`marks-input-${r.roll}`}
                      type="number"
                      min={0}
                      max={r.outOf}
                      value={r.marks}
                      onChange={(e) => handleMarkChange(r.admNo, e.target.value)}
                      className="w-24 rounded-lg bg-white border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-3 py-1.5 text-[13.5px] font-medium text-slate-800"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{r.outOf}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      r.grade === "A+" ? "bg-emerald-100 text-emerald-800" :
                      r.grade === "A" ? "bg-blue-100 text-blue-800" :
                      r.grade === "B" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {r.grade || "A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button data-testid="mark-save" onClick={handleSave} className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2.5 text-[13px] font-medium shadow-sm">
            <Save className="h-4 w-4" /> Save Marks
          </button>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3 reveal d1">
        {exams.map((r) => (
          <div key={r.admNo || r.roll} data-testid={`mark-card-${r.roll}`} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-[11px] text-slate-400">Roll #{r.roll} · {r.admNo}</div>
                <div className="font-medium text-slate-800 text-[14.5px]">{r.name}</div>
              </div>
              <span className="text-[11px] font-bold text-[#29ABE2] bg-cyan-50 px-2 py-1 rounded-md">{r.grade || "A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={r.outOf}
                value={r.marks}
                onChange={(e) => handleMarkChange(r.admNo, e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-[14px] font-medium text-slate-800"
              />
              <span className="text-[12px] text-slate-400 shrink-0">/ {r.outOf}</span>
            </div>
          </div>
        ))}
        <button data-testid="mark-save-mobile" onClick={handleSave} className="w-full rounded-xl bg-[#29ABE2] text-white py-3 text-[14px] font-medium shadow-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> Save Marks
        </button>
      </div>
    </div>
  );
}

function ReportCardView() {
  const { exams } = useDataStore();
  const studentExam = exams[0] || { name: "Aarav Sharma", admNo: "ADM001", marks: 88, grade: "A" };

  const totalMarks = REPORT_CARD.subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = REPORT_CARD.subjects.reduce((sum, s) => sum + s.max, 0);
  const overallPercentage = ((totalMarks / totalMax) * 100).toFixed(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-slate-500">
          Showing Report Card for: <span className="text-slate-900 font-bold">{studentExam.name} ({studentExam.admNo})</span>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 transition text-white px-4 py-2 text-[12.5px] font-medium"
        >
          <Printer className="h-4 w-4" /> Print Report Card
        </button>
      </div>

      <div data-testid="report-card-preview" className="glass rounded-3xl p-6 md:p-8 space-y-6 print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white font-bold text-[22px]">
              {REPORT_CARD.school.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-display font-bold text-[20px] text-slate-900">{REPORT_CARD.school.name}</h2>
              <p className="text-[12px] text-slate-500">Academic Session {REPORT_CARD.school.session} · Official Marksheet</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-emerald-200">
              <Award className="h-4 w-4" /> Grade {studentExam.grade} ({overallPercentage}%)
            </span>
          </div>
        </div>

        {/* Student metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 glass-soft rounded-2xl p-4 text-[13px]">
          <div>
            <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Student Name</span>
            <span className="font-semibold text-slate-800">{studentExam.name}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Admission No</span>
            <span className="font-mono font-semibold text-slate-800">{studentExam.admNo}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Class & Section</span>
            <span className="font-semibold text-slate-800">10-A</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Attendance Rate</span>
            <span className="font-semibold text-emerald-700">96.4%</span>
          </div>
        </div>

        {/* Subject marks table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-[13.5px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[11px] tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold text-center">Max Marks</th>
                <th className="px-5 py-3 font-semibold text-center">Marks Obtained</th>
                <th className="px-5 py-3 font-semibold text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_CARD.subjects.map((sub, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{sub.name}</td>
                  <td className="px-5 py-3.5 text-center text-slate-500">{sub.max}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                    {sub.name === "Mathematics" ? studentExam.marks : sub.marks}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                      {sub.grade}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="px-5 py-4 text-slate-900">Total Score</td>
                <td className="px-5 py-4 text-center text-slate-600">{totalMax}</td>
                <td className="px-5 py-4 text-center text-slate-900">{totalMarks}</td>
                <td className="px-5 py-4 text-center text-[#29ABE2]">{overallPercentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks */}
        <div className="glass-soft rounded-2xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Class Teacher Remarks</div>
          <p className="text-[13.5px] text-slate-700 italic">"{REPORT_CARD.remarks}"</p>
        </div>
      </div>
    </div>
  );
}

export default function Examination() {
  return (
    <div data-testid="examination-page" className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        eyebrow="ACADEMICS · EVALUATION"
        title="Examinations & Report Cards"
        subtitle="Manage term mark entries, compute academic grades, and generate official student report cards."
        right={<ExportButton testId="exam-export" />}
      />

      <Tabs defaultValue="marks" className="space-y-6">
        <TabsList className="glass p-1 rounded-full bg-white/80 border border-slate-200">
          <TabsTrigger value="marks" data-testid="tab-mark-entry" className="rounded-full px-5 py-2 text-[13px] data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white transition">
            <GraduationCap className="h-4 w-4 mr-2" /> Mark Entry Matrix
          </TabsTrigger>
          <TabsTrigger value="report" data-testid="tab-report-card" className="rounded-full px-5 py-2 text-[13px] data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white transition">
            <Award className="h-4 w-4 mr-2" /> Student Report Card
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marks">
          <MarkEntry />
        </TabsContent>

        <TabsContent value="report">
          <ReportCardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
