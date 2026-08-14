import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useRole } from "@/lib/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, CheckCircle2, XCircle, CalendarDays, Loader2, Clock, Calendar as CalendarIcon, Filter, Search, Eye, Award, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

const CLASSES_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS_LIST = ["A", "B", "C", "D"];

const MONTHS_LIST = [
  { value: 1, name: "January" },
  { value: 2, name: "February" },
  { value: 3, name: "March" },
  { value: 4, name: "April" },
  { value: 5, name: "May" },
  { value: 6, name: "June" },
  { value: 7, name: "July" },
  { value: 8, name: "August" },
  { value: 9, name: "September" },
  { value: 10, name: "October" },
  { value: 11, name: "November" },
  { value: 12, name: "December" },
];

export default function Attendance() {
  const { user, role } = useRole();
  const isParent = role === "Parent" || user?.role === "parent";

  // Roster View State
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Student Attendance Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [studentAttendanceData, setStudentAttendanceData] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState("all"); // all | P | A | L | H

  // Fetch Class Roster Attendance from API
  const fetchRoster = async () => {
    setLoadingRoster(true);
    try {
      const data = await api.getAttendanceRoster(cls, section, selectedDate);
      if (data && data.roster) {
        setRoster(
          data.roster.map((s) => ({
            studentId: s.studentId,
            roll: s.roll,
            name: s.name,
            admNo: s.admNo,
            status: s.status || "P", // Default to Present if not marked
          }))
        );
      } else {
        setRoster([]);
      }
    } catch (err) {
      console.error("Failed to fetch attendance roster:", err);
      toast.error("Failed to load attendance roster from database");
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [cls, section, selectedDate]);

  // Bulk Quick Mark Functions
  const markAllPresent = () => setRoster((prev) => prev.map((r) => ({ ...r, status: "P" })));
  const markAllAbsent = () => setRoster((prev) => prev.map((r) => ({ ...r, status: "A" })));

  // Save Attendance to Database
  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    setSubmitting(true);
    try {
      const marks = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
      }));
      await api.markAttendance({
        cls,
        section,
        date: selectedDate,
        marks,
      });
      toast.success(`Attendance saved to database for Class ${cls}-${section} on ${selectedDate}!`);
      fetchRoster();
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast.error(err.message || "Failed to save attendance to database");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch Individual Student Attendance Detail Report
  const handleOpenStudentDetail = async (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    loadStudentAttendanceDetail(student.studentId || student.id, filterMonth, filterYear);
  };

  const loadStudentAttendanceDetail = async (studentId, month, year) => {
    setLoadingStudentDetail(true);
    try {
      const data = await api.getStudentAttendance(studentId, month, year);
      if (data && data.student) {
        setStudentAttendanceData(data);
      } else {
        setStudentAttendanceData(null);
      }
    } catch (err) {
      console.error("Failed to fetch student attendance:", err);
      toast.error("Failed to load student attendance record");
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  useEffect(() => {
    if (selectedStudent && showStudentModal) {
      loadStudentAttendanceDetail(selectedStudent.studentId || selectedStudent.id, filterMonth, filterYear);
    }
  }, [filterMonth, filterYear]);

  // Filtered Roster by Search
  const filteredRoster = useMemo(() => {
    if (!searchQuery) return roster;
    const q = searchQuery.toLowerCase();
    return roster.filter((r) => r.name.toLowerCase().includes(q) || r.admNo.toLowerCase().includes(q));
  }, [roster, searchQuery]);

  // Parent View automatically loads their child's attendance modal
  useEffect(() => {
    if (isParent && user?.studentId) {
      handleOpenStudentDetail({ studentId: user.studentId, name: user.name });
    }
  }, [isParent, user]);

  return (
    <div data-testid="attendance-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Class & Student Attendance"
        subtitle={`Class-wise daily attendance updated by teachers & detailed student attendance reports.`}
        right={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-full px-3.5 py-1.5 shadow-xs">
              <CalendarIcon className="h-4 w-4 text-[#29ABE2]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger data-testid="attendance-class-select" className="w-[120px] rounded-full bg-white/80 border-blue-200">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES_LIST.map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[100px] rounded-full bg-white/80 border-blue-200">
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

      <div className="glass rounded-2xl p-4 md:p-5 reveal space-y-4">
        {/* Filter & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or admission no."
              className="flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllPresent}
              className="rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 text-xs font-medium text-emerald-800 transition"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 text-xs font-medium text-rose-800 transition"
            >
              ✕ Mark All Absent
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingRoster ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching attendance roster from database...</span>
          </div>
        ) : (
          <>
            {/* Roster Table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold w-[90px]">Roll No.</th>
                    <th className="px-5 py-3 font-semibold">Adm. No.</th>
                    <th className="px-5 py-3 font-semibold">Student Name</th>
                    <th className="px-5 py-3 font-semibold text-center w-[260px]">Attendance Status ({selectedDate})</th>
                    <th className="px-5 py-3 font-semibold text-right">Student Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((r, i) => (
                    <tr
                      key={r.studentId || r.roll}
                      className="border-t border-slate-100 hover:bg-[#f3faff] transition"
                    >
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.roll}</td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-600">{r.admNo}</td>
                      <td
                        onClick={() => handleOpenStudentDetail(r)}
                        className="px-5 py-3.5 font-medium text-slate-800 hover:text-[#0c6a99] cursor-pointer"
                      >
                        {r.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "P" } : x))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              r.status === "P"
                                ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            P
                          </button>
                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "A" } : x))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              r.status === "A"
                                ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            A
                          </button>
                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "L" } : x))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              r.status === "L"
                                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                            }`}
                          >
                            L
                          </button>
                          {/* Holiday */}
                          <button
                            type="button"
                            onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "H" } : x))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              r.status === "H"
                                ? "bg-slate-600 text-white border-slate-700 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            H
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenStudentDetail(r)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#0c6a99] hover:text-[#0e7fb1] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full font-medium transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Attendance Report
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        No active student records found for Class {cls}-{section}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredRoster.map((r) => (
                <div key={r.studentId || r.roll} className="glass-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="font-mono text-[11px] text-slate-400">Roll #{r.roll} · {r.admNo}</div>
                      <div
                        onClick={() => handleOpenStudentDetail(r)}
                        className="font-bold text-slate-800 text-[14.5px] cursor-pointer hover:text-[#0c6a99]"
                      >
                        {r.name}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenStudentDetail(r)}
                      className="p-2 rounded-full bg-blue-50 text-[#0c6a99]"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "P" } : x))}
                      className={`py-1.5 rounded-xl text-xs font-bold border ${r.status === "P" ? "bg-emerald-500 text-white" : "bg-white text-emerald-700 border-slate-200"}`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "A" } : x))}
                      className={`py-1.5 rounded-xl text-xs font-bold border ${r.status === "A" ? "bg-rose-500 text-white" : "bg-white text-rose-700 border-slate-200"}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "L" } : x))}
                      className={`py-1.5 rounded-xl text-xs font-bold border ${r.status === "L" ? "bg-amber-500 text-white" : "bg-white text-amber-700 border-slate-200"}`}
                    >
                      L
                    </button>
                    <button
                      onClick={() => setRoster((prev) => prev.map((x) => x.studentId === r.studentId ? { ...x, status: "H" } : x))}
                      className={`py-1.5 rounded-xl text-xs font-bold border ${r.status === "H" ? "bg-slate-600 text-white" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      H
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Present: {roster.filter((r) => r.status === "P").length}
                </span>
                <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Absent: {roster.filter((r) => r.status === "A").length}
                </span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Late: {roster.filter((r) => r.status === "L").length}
                </span>
              </div>
              <button
                disabled={submitting || roster.length === 0}
                onClick={handleSaveAttendance}
                className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-xs font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save & Submit Attendance
              </button>
            </div>
          </>
        )}
      </div>

      {/* 2. Detailed Student Attendance Modal / Report View */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Detailed Attendance Analytics</div>
                <h3 className="font-bold text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  {selectedStudent.name} <span className="text-xs font-mono font-normal text-slate-500">({selectedStudent.admNo || "Student"})</span>
                </h3>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </div>

            {/* Filter Bar (Month, Year, Status Filter) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#29ABE2]" />
                <span className="text-xs font-bold text-slate-700">Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Month Selector */}
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-[#29ABE2]"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m.value} value={m.value}>{m.name}</option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-[#29ABE2]"
                >
                  {[2026, 2025, 2024].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-[#29ABE2]"
                >
                  <option value="all">All Days</option>
                  <option value="P">Present Days Only</option>
                  <option value="A">Absent Days Only</option>
                  <option value="L">Late Days Only</option>
                  <option value="H">Holidays Only</option>
                </select>
              </div>
            </div>

            {loadingStudentDetail ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
                <span className="text-xs">Fetching monthly attendance records...</span>
              </div>
            ) : studentAttendanceData ? (
              <div className="space-y-6 mt-4">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Attendance %</div>
                    <div className="text-2xl font-bold text-[#0c6a99] mt-1">
                      {studentAttendanceData.summary.percent !== null ? `${studentAttendanceData.summary.percent}%` : "100%"}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase">Present</div>
                    <div className="text-2xl font-bold text-emerald-800 mt-1">{studentAttendanceData.summary.present} Days</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100">
                    <div className="text-[11px] font-bold text-rose-700 uppercase">Absent</div>
                    <div className="text-2xl font-bold text-rose-800 mt-1">{studentAttendanceData.summary.absent} Days</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100">
                    <div className="text-[11px] font-bold text-amber-700 uppercase">Late</div>
                    <div className="text-2xl font-bold text-amber-800 mt-1">{studentAttendanceData.summary.late} Days</div>
                  </div>
                </div>

                {/* Calendar Grid View */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                    <span>Monthly Calendar ({MONTHS_LIST.find(m => m.value === filterMonth)?.name} {filterYear})</span>
                    <div className="flex items-center gap-3 text-[11px] font-normal text-slate-500">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Present</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Absent</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Late</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Holiday</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w, idx) => (
                      <div key={idx} className="text-[10px] font-bold text-slate-400 uppercase text-center py-1">{w}</div>
                    ))}
                    {Array.from({ length: studentAttendanceData.daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const statusVal = studentAttendanceData.marks[dayNum];

                      // Apply status filter
                      if (statusFilter !== "all" && statusVal !== statusFilter) {
                        return (
                          <div key={dayNum} className="aspect-square rounded-xl bg-slate-100/50 opacity-20 grid place-items-center text-xs text-slate-400 font-mono">
                            {dayNum}
                          </div>
                        );
                      }

                      let bgClass = "bg-white border-slate-200 text-slate-400";
                      let badge = "";

                      if (statusVal === "P") {
                        bgClass = "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold";
                        badge = "P";
                      } else if (statusVal === "A") {
                        bgClass = "bg-rose-50 border-rose-200 text-rose-800 font-bold";
                        badge = "A";
                      } else if (statusVal === "L") {
                        bgClass = "bg-amber-50 border-amber-200 text-amber-800 font-bold";
                        badge = "L";
                      } else if (statusVal === "H") {
                        bgClass = "bg-slate-100 border-slate-200 text-slate-400";
                        badge = "H";
                      }

                      return (
                        <div key={dayNum} className={`aspect-square rounded-xl border ${bgClass} flex flex-col items-center justify-center p-1`}>
                          <span className="text-[11px]">{dayNum}</span>
                          {badge && <span className="text-[9px] uppercase tracking-tighter mt-0.5">{badge}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No attendance records found for the selected month and year.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
