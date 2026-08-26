import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, BookOpen, Calendar, CheckCircle2, Edit3, Eye, FileSpreadsheet, Filter, Loader2, Printer, Save, Search, UserCheck, AlertCircle, GraduationCap, RotateCw, FileCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import { useRole } from "@/lib/RoleContext";

const SESSIONS = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
const TERMS = ["Mid-Term", "Final Exam", "Unit Test 1", "Unit Test 2"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Sci.", "Hindi", "Computer Sci."];

export default function Examination() {
  const { user, role } = useRole();
  const isTeacher = role === "staff" && (user?.duties || []).includes("teacher");

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
    let parsed = val;
    if (val !== "") {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        parsed = Math.min(100, Math.max(0, num));
      }
    }
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, marks: parsed } : s))
    );
  };

  const handleSaveMarks = async () => {
    if (roster.length === 0) {
      toast.error("No students in current class roster to save marks for.");
      return;
    }
    setSubmitting(true);
    try {
      const marksData = roster.map((s) => ({
        studentId: s.studentId,
        marksObtained: s.marks !== "" && s.marks !== undefined && s.marks !== null ? (parseFloat(s.marks) || 0) : 0,
        maxMarks: 100,
      }));

      const activeSchoolId = localStorage.getItem("vidyaloop_active_school_id");

      await api.saveExamMarks({
        session,
        term,
        cls,
        section,
        subject,
        schoolId: activeSchoolId !== "all" ? activeSchoolId : undefined,
        marks: marksData,
      });

      toast.success(`Exam marks for ${subject} (Class ${cls}-${section} · ${term}) saved to database!`);
      fetchExamRoster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to save exam marks");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Official Student Report Card
  const handleOpenReportCard = async (student) => {
    setReportStudent(student);
    setReportLoading(true);
    try {
      const sId = student.studentId || student.id;
      const res = await api.getStudentReportCard({
        studentId: sId,
        session,
        term,
      });
      setReportCardData(res);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to generate student report card");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div data-testid="examination-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · EXAMINATIONS ENGINE"
        title="Examinations & Marksheets"
        subtitle={`Grade entry, automated CGPA calculations, and official report card generation for Session ${session}.`}
        right={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={fetchExamRoster}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs"
            >
              <RotateCw className="h-3.5 w-3.5 text-[#29ABE2]" /> Refresh
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4.5 py-2 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All Marks
            </button>
          </div>
        }
      />

      {/* Hero Stats & Quick Filter Grid (Premium Design for Large Screens) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Term & Session Card */}
        <div className="glass rounded-2xl p-4 border border-white/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white shadow-xs shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Academic Term</div>
              <div className="text-[13.5px] font-bold text-slate-900 leading-tight mt-0.5">{term} · {session}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="h-8 text-[11px] font-bold rounded-full bg-white border-blue-200 text-[#0c6a99] w-[105px]">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[100px]">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Class & Section Card */}
        <div className="glass rounded-2xl p-4 border border-white/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white shadow-xs shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Target Class</div>
              <div className="text-[13.5px] font-bold text-slate-900 leading-tight mt-0.5">Class {cls}-{section}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[90px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {["6", "7", "8", "9", "10", "11", "12"].map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[75px]">
                <SelectValue placeholder="Sec" />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((s) => (
                  <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject Card */}
        <div className="glass rounded-2xl p-4 border border-white/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white shadow-xs shrink-0">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Subject Evaluation</div>
              <div className="text-[13.5px] font-bold text-slate-900 leading-tight mt-0.5">{subject}</div>
            </div>
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[130px] shrink-0">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Roster & Marks Table Container */}
      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Award className="h-4 w-4 text-[#29ABE2]" />
            Marks Entry Roster · Class {cls}-{section} ({subject}) · <span className="text-[#0c6a99]">{term} ({session})</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching examination roster from database...</span>
          </div>
        ) : roster.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No students found for Class {cls}-{section} in database.
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll rounded-2xl border border-slate-200/80 bg-white/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left">Roll</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Adm No.</th>
                  <th className="p-3 text-center">Marks Obtained (out of 100)</th>
                  <th className="p-3 text-center">Computed Grade</th>
                  <th className="p-3 text-right">Official Report Card</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => {
                  const hasMarkEntered = s.marks !== "" && s.marks !== undefined && s.marks !== null;
                  const marksVal = hasMarkEntered ? parseFloat(s.marks) || 0 : 0;
                  let grade = "—";
                  let gradeColor = "bg-slate-100 text-slate-500 border-slate-200";

                  if (hasMarkEntered) {
                    if (marksVal >= 90) { grade = "A+"; gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
                    else if (marksVal >= 80) { grade = "A"; gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"; }
                    else if (marksVal >= 70) { grade = "B+"; gradeColor = "bg-blue-50 text-blue-700 border-blue-200"; }
                    else if (marksVal >= 60) { grade = "B"; gradeColor = "bg-cyan-50 text-cyan-700 border-cyan-200"; }
                    else if (marksVal >= 50) { grade = "C"; gradeColor = "bg-amber-50 text-amber-700 border-amber-200"; }
                    else if (marksVal >= 33) { grade = "D"; gradeColor = "bg-orange-50 text-orange-700 border-orange-200"; }
                    else { grade = "F"; gradeColor = "bg-rose-50 text-rose-700 border-rose-200"; }
                  }

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
                          value={s.marks !== undefined && s.marks !== null ? s.marks : ""}
                          onChange={(e) => handleMarkChange(s.studentId, e.target.value)}
                          placeholder="0"
                          className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-center font-mono font-bold text-slate-800 outline-none focus:border-[#29ABE2] bg-white shadow-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold border ${gradeColor}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenReportCard(s)}
                          className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0c6a99] hover:border-[#29ABE2] text-xs font-semibold transition flex items-center gap-1.5 ml-auto shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#29ABE2]" /> View Report Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Student Report Card Modal */}
      {reportStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white font-bold text-sm">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base leading-snug">Official Student Marksheet & Report Card</h3>
                  <p className="text-xs text-slate-500">Academic Evaluation Record · Session {session}</p>
                </div>
              </div>
              <button
                onClick={() => setReportStudent(null)}
                className="px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {reportLoading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
                <span className="text-xs">Generating report card from database...</span>
              </div>
            ) : reportCardData ? (
              <div className="mt-4 space-y-4">
                {/* Student Info Header Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Student Name:</span> <strong className="text-slate-900 font-bold">{reportCardData.studentName}</strong></div>
                    <div><span className="text-slate-500">Admission No:</span> <strong className="font-mono text-slate-800">{reportCardData.admNo}</strong></div>
                    <div><span className="text-slate-500">Class & Section:</span> <strong className="text-slate-900">Class {reportCardData.cls}-{reportCardData.section}</strong></div>
                    <div><span className="text-slate-500">Roll Number:</span> <strong className="font-mono text-slate-800">{reportCardData.roll}</strong></div>
                  </div>
                </div>

                {/* Subject Marks Breakdown Table */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px]">
                      <tr>
                        <th className="p-2.5 text-left">Subject</th>
                        <th className="p-2.5 text-center">Max Marks</th>
                        <th className="p-2.5 text-center">Marks Obtained</th>
                        <th className="p-2.5 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardData.subjects?.map((sub, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="p-2.5 font-bold text-slate-800">{sub.subject}</td>
                          <td className="p-2.5 text-center font-mono">{sub.maxMarks}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-[#0c6a99]">{sub.marksObtained}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-blue-50 text-[#0c6a99] border border-blue-200">
                              {sub.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Overall Grade Card */}
                <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Performance</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      Total Marks: <span className="text-[#0c6a99]">{reportCardData.totalObtained}</span> / {reportCardData.totalMax} ({reportCardData.percentage}%)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Final Result</div>
                    <div className="text-base font-display font-extrabold text-emerald-700">{reportCardData.status} ({reportCardData.overallGrade})</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-bold hover:bg-[#0e7fb1] transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="h-4 w-4" /> Print Official Report Card
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
