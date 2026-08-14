import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useRole } from "@/lib/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Award, BookOpen, Calendar, CheckCircle2, Edit3, Eye, FileSpreadsheet,
  Filter, Loader2, Printer, Save, Search, UserCheck, AlertCircle
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

const CLASSES_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS_LIST = ["A", "B", "C", "D"];
const SESSIONS_LIST = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
const TERMS_LIST = ["Mid-Term", "Final Exam", "Unit Test 1", "Unit Test 2"];
const SUBJECTS_LIST = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Hindi",
];

export default function Examination() {
  const { user, role } = useRole();
  const isTeacher = role === "Teacher" || user?.role === "teacher" || user?.role === "Teacher";
  const isAdmin = role === "Admin" || role === "superAdmin" || user?.role === "schoolAdmin" || user?.role === "superAdmin";

  // Filter States
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [session, setSession] = useState("2024-2025");
  const [term, setTerm] = useState("Mid-Term");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");

  // Roster Data
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Marks Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentMarks, setEditingStudentMarks] = useState([]);

  // Report Card Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch Class Examination Roster from Backend
  const loadExamRoster = async () => {
    setLoading(true);
    try {
      const data = await api.getExaminationRoster({ cls, section, session, term, subject: selectedSubject });
      if (data && data.roster) {
        setRoster(data.roster);
      } else {
        setRoster([]);
      }
    } catch (err) {
      console.error("Failed to load examination roster:", err);
      toast.error("Failed to load examination records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamRoster();
  }, [cls, section, session, term, selectedSubject]);

  // Open Edit Marks Form for a Class/Subject
  const handleOpenMarksEntry = () => {
    const marksData = roster.map((s) => {
      const foundMark = s.marks?.find((m) => m.subject === selectedSubject);
      return {
        studentId: s.studentId,
        name: s.name,
        roll: s.roll,
        admNo: s.admNo,
        subject: selectedSubject,
        marksObtained: foundMark ? foundMark.marksObtained : 0,
        maxMarks: foundMark ? foundMark.maxMarks : 100,
        grade: foundMark ? foundMark.grade : "A",
        remarks: foundMark ? foundMark.remarks : "",
      };
    });
    setEditingStudentMarks(marksData);
    setShowEditModal(true);
  };

  // Save / Upsert Exam Marks to Database
  const handleSaveExamMarks = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const marksPayload = editingStudentMarks.map((m) => ({
        studentId: m.studentId,
        subject: selectedSubject,
        marksObtained: Number(m.marksObtained),
        maxMarks: Number(m.maxMarks) || 100,
        grade: m.grade || undefined,
        remarks: m.remarks || undefined,
      }));

      await api.saveExamMarks({
        session,
        term,
        cls,
        section,
        marks: marksPayload,
      });

      toast.success(`Exam marks for ${selectedSubject} (${session} · ${term}) saved to database!`);
      setShowEditModal(false);
      loadExamRoster();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save exam marks");
    } finally {
      setSaving(false);
    }
  };

  // Load Report Card for a Student
  const handleViewReportCard = async (student) => {
    setShowReportModal(true);
    setLoadingReport(true);
    try {
      const data = await api.getStudentReportCard({
        studentId: student.studentId || student.id,
        session,
        term,
      });
      if (data && data.student) {
        setReportCardData(data);
      } else {
        setReportCardData(null);
      }
    } catch (err) {
      console.error("Failed to load report card:", err);
      toast.error("Failed to fetch student report card");
    } finally {
      setLoadingReport(false);
    }
  };

  // Filter Roster by Search Query
  const filteredRoster = useMemo(() => {
    if (!searchQuery) return roster;
    const q = searchQuery.toLowerCase();
    return roster.filter((r) => r.name.toLowerCase().includes(q) || r.admNo.toLowerCase().includes(q));
  }, [roster, searchQuery]);

  return (
    <div data-testid="examination-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Examinations & Report Cards"
        subtitle={`Multi-year student examination records, subject marks entry, and official report cards.`}
        right={
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Session / Year Filter */}
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="w-full sm:w-[130px] rounded-full bg-white/80 border-blue-200">
                <SelectValue placeholder="Academic Session" />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Term Filter */}
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-full sm:w-[130px] rounded-full bg-white/80 border-blue-200">
                <SelectValue placeholder="Exam Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS_LIST.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-full sm:w-[110px] rounded-full bg-white/80 border-blue-200">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES_LIST.map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Section Filter */}
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-full sm:w-[90px] rounded-full bg-white/80 border-blue-200">
                <SelectValue placeholder="Sec" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        {/* Toolbar Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or roll..."
                className="bg-transparent outline-none text-xs placeholder:text-slate-400 w-full"
              />
            </div>

            {/* Subject Selector */}
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-blue-50/80 border border-blue-200 rounded-full px-3 py-1.5 shrink-0">
              <span className="text-xs font-bold text-[#0c6a99]">Subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {SUBJECTS_LIST.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenMarksEntry}
            className="w-full md:w-auto rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] text-white px-5 py-2.5 text-xs font-medium transition shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Edit3 className="h-4 w-4" /> Enter / Update Marks ({selectedSubject})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching examination records from database...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold w-[80px]">Roll</th>
                    <th className="px-5 py-3 font-semibold">Adm. No.</th>
                    <th className="px-5 py-3 font-semibold">Student Name</th>
                    <th className="px-5 py-3 font-semibold text-center">{selectedSubject} Marks</th>
                    <th className="px-5 py-3 font-semibold text-center">Term Total</th>
                    <th className="px-5 py-3 font-semibold text-center">Grade</th>
                    <th className="px-5 py-3 font-semibold text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((s) => {
                    const subjectMark = s.marks?.find((m) => m.subject === selectedSubject);

                    return (
                      <tr key={s.studentId || s.roll} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{s.roll}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{s.admNo}</td>
                        <td
                          onClick={() => handleViewReportCard(s)}
                          className="px-5 py-3.5 font-medium text-slate-800 hover:text-[#0c6a99] cursor-pointer"
                        >
                          {s.name}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                          {subjectMark ? (
                            <span>
                              {subjectMark.marksObtained} <span className="text-slate-400 text-xs font-normal">/ {subjectMark.maxMarks}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {s.totalMax > 0 ? (
                            <span className="font-bold text-[#0c6a99]">{s.totalObtained} / {s.totalMax} ({s.percent}%)</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s.overallGrade.startsWith("A")
                              ? "bg-emerald-100 text-emerald-800"
                              : s.overallGrade.startsWith("B")
                              ? "bg-blue-100 text-blue-800"
                              : s.overallGrade.startsWith("C")
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {s.overallGrade}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleViewReportCard(s)}
                            className="inline-flex items-center gap-1.5 text-xs text-[#0c6a99] hover:text-[#0e7fb1] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full font-medium transition"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> View Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No student records found in database for Class {cls}-{section} ({session}).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {filteredRoster.map((s) => {
                const subjectMark = s.marks?.find((m) => m.subject === selectedSubject);

                return (
                  <div key={s.studentId || s.roll} className="glass-soft rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="text-[11px] font-mono text-slate-400">Roll #{s.roll} · {s.admNo}</div>
                        <div
                          onClick={() => handleViewReportCard(s)}
                          className="font-bold text-slate-800 text-[15px] cursor-pointer hover:text-[#0c6a99]"
                        >
                          {s.name}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        s.overallGrade.startsWith("A")
                          ? "bg-emerald-100 text-emerald-800"
                          : s.overallGrade.startsWith("B")
                          ? "bg-blue-100 text-blue-800"
                          : s.overallGrade.startsWith("C")
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        Grade {s.overallGrade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">{selectedSubject} Marks</span>
                        <span className="font-bold text-slate-800">
                          {subjectMark ? `${subjectMark.marksObtained} / ${subjectMark.maxMarks}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Total Term Score</span>
                        <span className="font-bold text-[#0c6a99]">
                          {s.totalMax > 0 ? `${s.totalObtained}/${s.totalMax} (${s.percent}%)` : "—"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewReportCard(s)}
                      className="w-full py-2 rounded-full bg-blue-50 text-[#0c6a99] hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> View Official Report Card
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Marks Entry Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Class {cls}-{section} Exam Entry</div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-0.5 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#29ABE2]" /> Enter / Update {selectedSubject} Marks ({session} · {term})
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSaveExamMarks} className="space-y-4 mt-4">
              <div className="overflow-x-auto thin-scroll">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-left">
                      <th className="p-2.5">Roll</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5 w-[110px]">Marks Obtained</th>
                      <th className="p-2.5 w-[85px]">Max Marks</th>
                      <th className="p-2.5">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingStudentMarks.map((m, idx) => (
                      <tr key={m.studentId} className="border-t border-slate-100">
                        <td className="p-2.5 font-mono text-slate-500">{m.roll}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{m.name}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={m.marksObtained}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingStudentMarks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, marksObtained: val } : x))
                              );
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-800 text-xs outline-none focus:border-[#29ABE2]"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={m.maxMarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingStudentMarks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, maxMarks: val } : x))
                              );
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="e.g. Excellent progress"
                            value={m.remarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingStudentMarks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, remarks: val } : x))
                              );
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none min-w-[140px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save & Persist Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Student Report Card & Grade Sheet Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#29ABE2]" />
                <h3 className="font-bold text-base sm:text-lg text-slate-900">Official Student Report Card</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
              </div>
            </div>

            {loadingReport ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
                <span className="text-xs">Generating report card...</span>
              </div>
            ) : reportCardData ? (
              <div className="space-y-4 sm:space-y-5 mt-4 p-3 sm:p-4 border border-slate-200 rounded-2xl bg-white shadow-xs">
                {/* School Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <div className="font-display font-extrabold text-lg sm:text-xl text-[#0c6a99]">
                    {reportCardData.student.schoolName || "Vidyaloop Public School"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Affiliated to {reportCardData.student.schoolBoard || "CBSE Board"} &middot; Academic Progress Report
                  </div>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full bg-blue-50 text-[#0c6a99] text-xs font-bold">
                    {reportCardData.term} Evaluation ({reportCardData.session})
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Student Name</span>
                    <span className="font-bold text-slate-800">{reportCardData.student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Adm No. / Roll</span>
                    <span className="font-bold text-slate-800">{reportCardData.student.admNo} (Roll #{reportCardData.student.roll})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Class & Section</span>
                    <span className="font-bold text-slate-800">Class {reportCardData.student.classSection}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Father's Name</span>
                    <span className="font-bold text-slate-800">{reportCardData.student.fatherName || "—"}</span>
                  </div>
                </div>

                {/* Subject Marks Table */}
                <div className="overflow-x-auto thin-scroll rounded-xl border border-slate-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Subject</th>
                        <th className="p-3 text-center">Marks Obtained</th>
                        <th className="p-3 text-center">Max Marks</th>
                        <th className="p-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardData.subjects.map((s) => (
                        <tr key={s.id || s.subject} className="border-t border-slate-200">
                          <td className="p-3 font-semibold text-slate-800">{s.subject}</td>
                          <td className="p-3 text-center font-bold text-[#0c6a99]">{s.marksObtained}</td>
                          <td className="p-3 text-center text-slate-500">{s.maxMarks}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                              {s.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportCardData.subjects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            No subject marks uploaded for this term yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Report Card Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                    <span className="text-[10.5px] text-slate-500 font-bold uppercase block">Total Score</span>
                    <span className="text-base sm:text-lg font-bold text-[#0c6a99]">
                      {reportCardData.summary.totalObtained} / {reportCardData.summary.totalMax}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-[10.5px] text-emerald-700 font-bold uppercase block">Percentage</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-800">
                      {reportCardData.summary.percentage}% ({reportCardData.summary.overallGrade})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                    <span className="text-[10.5px] text-purple-700 font-bold uppercase block">Class Rank</span>
                    <span className="text-base sm:text-lg font-bold text-purple-800">
                      #{reportCardData.summary.rank} of {reportCardData.summary.totalStudentsInClass}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No report card data found for this student.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
