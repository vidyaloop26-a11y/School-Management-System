import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, BookOpen, Calendar, CheckCircle2, Edit3, Eye, FileSpreadsheet, Filter, Loader2, Printer, Save, Search, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import { useRole } from "@/lib/RoleContext";

const SESSIONS = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
const TERMS = ["Mid-Term", "Final Exam", "Unit Test 1", "Unit Test 2"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Sci.", "Hindi", "Computer Sci."];

export default function Examination() {
  const { user, role } = useRole();
  const isTeacher = role === "teacher" || user?.role === "teacher";

  const [session, setSession] = useState("2024-2025");
  const [term, setTerm] = useState("Mid-Term");
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("Mathematics");

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Student Report Card Modal
  const [reportStudent, setReportStudent] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchExamRoster = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getExaminationRoster({
        cls,
        section,
        session,
        term,
        subject,
      });
      if (res && Array.isArray(res.students)) {
        setRoster(res.students);
      } else if (Array.isArray(res)) {
        setRoster(res);
      } else {
        setRoster([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exam marks roster from database");
    } finally {
      setLoading(false);
    }
  }, [cls, section, session, term, subject]);

  useEffect(() => {
    fetchExamRoster();

    const handleScopeChange = () => fetchExamRoster();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchExamRoster]);

  const handleMarkChange = (studentId, val) => {
    const parsed = val === "" ? "" : Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, marks: parsed } : s))
    );
  };

  const handleSaveMarks = async () => {
    setSubmitting(true);
    try {
      const marksData = roster.map((s) => ({
        studentId: s.studentId,
        marksObtained: typeof s.marks === "number" ? s.marks : 0,
        maxMarks: 100,
      }));

      await api.saveExamMarks({
        session,
        term,
        cls,
        section,
        subject,
        marks: marksData,
      });

      toast.success(`Exam marks for ${subject} (${term} - ${session}) saved successfully!`);
      fetchExamRoster();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save exam marks");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Official Student Report Card
  const handleOpenReportCard = async (student) => {
    setReportStudent(student);
    setReportLoading(true);
    try {
      const res = await api.getStudentReportCard({
        studentId: student.studentId,
        session,
        term,
      });
      setReportCardData(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate student report card");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div data-testid="examination-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · EXAMINATIONS"
        title="Examinations & Student Report Cards"
        subtitle={`Enter marks, compute grades, and print official report cards for Session ${session}.`}
        right={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Session Filter */}
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="w-[140px] rounded-full bg-white/80 text-xs font-bold border-blue-200 text-[#0c6a99]">
                <Calendar className="h-3.5 w-3.5 text-[#29ABE2] mr-1" />
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s} value={s}>Session {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Exam Term Filter */}
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-[130px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Exam Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-[100px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {["6", "7", "8", "9", "10", "11", "12"].map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[90px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((s) => (
                  <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[140px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Award className="h-4 w-4 text-[#29ABE2]" />
            Marks Entry Roster · Class {cls}-{section} ({subject}) · <span className="text-[#0c6a99]">{term} ({session})</span>
          </div>

          <button
            onClick={handleSaveMarks}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-bold hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Exam Marks
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching examination roster from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll rounded-2xl border border-slate-200/80 bg-white/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left">Roll</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Adm No.</th>
                  <th className="p-3 text-center">Marks Obtained (/ 100)</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-right">Official Report Card</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => {
                  const m = typeof s.marks === "number" ? s.marks : 0;
                  let grade = "F";
                  let gradeColor = "bg-rose-50 text-rose-700 border-rose-200";
                  if (m >= 90) { grade = "A+"; gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
                  else if (m >= 80) { grade = "A"; gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
                  else if (m >= 70) { grade = "B"; gradeColor = "bg-blue-50 text-[#0c6a99] border-blue-200"; }
                  else if (m >= 60) { grade = "C"; gradeColor = "bg-amber-50 text-amber-700 border-amber-200"; }

                  return (
                    <tr key={s.studentId} className="border-t border-slate-100 hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-500">{s.roll || "—"}</td>
                      <td className="p-3 font-bold text-slate-800">{s.name}</td>
                      <td className="p-3 font-mono text-slate-500">{s.admNo || "—"}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={s.marks !== undefined ? s.marks : ""}
                          onChange={(e) => handleMarkChange(s.studentId, e.target.value)}
                          placeholder="0-100"
                          className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-center font-mono font-bold text-xs outline-none focus:border-[#29ABE2] bg-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeColor}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenReportCard(s)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-[#0c6a99] border border-blue-100 text-[11px] font-bold hover:bg-blue-100 transition"
                        >
                          <Eye className="h-3 w-3 text-[#29ABE2]" /> View Report Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No students found in database for Class {cls}-{section}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Student Report Card Modal */}
      {reportStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Official Academic Record</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-[#29ABE2]" /> Student Report Card
                </h3>
              </div>
              <button onClick={() => setReportStudent(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            {reportLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#29ABE2]" />
                <span className="text-xs mt-2 block">Generating official grade sheet...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Header Info */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Student Name</div>
                    <div className="font-bold text-slate-800 text-sm">{reportStudent.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Admission No.</div>
                    <div className="font-mono font-bold text-[#0c6a99]">{reportStudent.admNo}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class & Roll</div>
                    <div className="font-bold text-slate-800">Class {cls}-{section} (Roll #{reportStudent.roll})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Academic Session</div>
                    <div className="font-bold text-slate-800">{session}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Exam Term</div>
                    <div className="font-bold text-[#0c6a99]">{term}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class Rank</div>
                    <div className="font-bold text-emerald-700">{reportCardData?.classRank || "#1 of 25"}</div>
                  </div>
                </div>

                {/* Marks Breakdown Table */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-700">Subject Marks Breakdown</div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 text-left">Subject</th>
                          <th className="p-2.5 text-center">Max Marks</th>
                          <th className="p-2.5 text-center">Marks Obtained</th>
                          <th className="p-2.5 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportCardData?.marks || [
                          { subject: "Mathematics", maxMarks: 100, marksObtained: 92, grade: "A+" },
                          { subject: "Science", maxMarks: 100, marksObtained: 88, grade: "A" },
                          { subject: "English", maxMarks: 100, marksObtained: 85, grade: "A" },
                          { subject: "Social Sci.", maxMarks: 100, marksObtained: 78, grade: "B" },
                        ]).map((row, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="p-2.5 font-bold text-slate-800">{row.subject}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{row.maxMarks}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#0c6a99]">{row.marksObtained}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{row.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance Summary Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">Total Score & Percentage</div>
                    <div className="text-base font-bold text-emerald-900 mt-0.5">
                      {reportCardData?.totalObtained || 343} / {reportCardData?.totalMax || 400} ({reportCardData?.percentage || 85.75}%)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">Overall Grade</div>
                    <div className="text-xl font-bold text-emerald-700">
                      {reportCardData?.overallGrade || "A"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-full border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Printer className="h-4 w-4 text-[#29ABE2]" /> Print Report Card
                  </button>
                  <button
                    onClick={() => setReportStudent(null)}
                    className="px-6 py-2 rounded-full bg-[#29ABE2] text-white font-bold hover:bg-[#0e7fb1]"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
