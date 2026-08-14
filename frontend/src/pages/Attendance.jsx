import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle, Save, Loader2, User, Eye, BarChart3, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import { useRole } from "@/lib/RoleContext";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = ["2026", "2025", "2024"];

export default function Attendance() {
  const { user, role } = useRole();
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Student Attendance Analytics Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(YEARS[0]);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAttendanceRoster(cls, section, date);
      if (res && Array.isArray(res.roster)) {
        setRoster(res.roster);
      } else if (Array.isArray(res)) {
        setRoster(res);
      } else {
        setRoster([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load class attendance roster from database");
    } finally {
      setLoading(false);
    }
  }, [cls, section, date]);

  useEffect(() => {
    fetchRoster();

    const handleScopeChange = () => fetchRoster();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchRoster]);

  const handleStatusToggle = (studentId, newStatus) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: "P" })));
    toast.success("Marked all students as Present");
  };

  const handleSaveAttendance = async () => {
    setSubmitting(true);
    try {
      const attendance = roster.map((s) => ({
        studentId: s.studentId,
        status: s.status,
      }));
      await api.markAttendance({ cls, section, date, attendance });
      toast.success(`Daily attendance for Class ${cls}-${section} (${date}) saved to database!`);
      fetchRoster();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Student Detailed Attendance Analytics Modal
  const handleOpenAnalytics = async (student) => {
    setSelectedStudent(student);
    setAnalyticsLoading(true);
    try {
      const monthIdx = MONTHS.indexOf(filterMonth) + 1;
      const res = await api.getStudentAttendance(student.studentId, monthIdx, parseInt(filterYear, 10));
      setStudentAnalytics(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load student attendance analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      const monthIdx = MONTHS.indexOf(filterMonth) + 1;
      api.getStudentAttendance(selectedStudent.studentId, monthIdx, parseInt(filterYear, 10))
        .then((res) => setStudentAnalytics(res))
        .catch(() => {});
    }
  }, [filterMonth, filterYear, selectedStudent]);

  return (
    <div data-testid="attendance-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · DAILY ATTENDANCE"
        title="Class Attendance Management"
        subtitle={`Mark and inspect daily attendance for Class ${cls}-${section}. Updates save live to database.`}
        right={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-[110px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {["6", "7", "8", "9", "10", "11", "12"].map((c) => (
                  <SelectItem key={c} value={c}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[100px] rounded-full bg-white/80 text-xs font-semibold">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((s) => (
                  <SelectItem key={s} value={s}>Section {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold outline-none text-slate-700"
            />
          </div>
        }
      />

      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#29ABE2]" />
            Roster for Class {cls}-{section} ({date}) · <span className="text-[#0c6a99]">{roster.length} Students</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-1.5 rounded-full bg-[#29ABE2] text-white text-xs font-bold hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Attendance
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching daily attendance roster...</span>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll rounded-2xl border border-slate-200/80 bg-white/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left">Roll</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Adm No.</th>
                  <th className="p-3 text-center">Status Toggle (P / A / L / H)</th>
                  <th className="p-3 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.studentId} className="border-t border-slate-100 hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">{s.roll || "—"}</td>
                    <td className="p-3 font-bold text-slate-800">{s.name}</td>
                    <td className="p-3 font-mono text-slate-500">{s.admNo || "—"}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                        {[
                          { key: "P", label: "P", color: "bg-emerald-500 text-white" },
                          { key: "A", label: "A", color: "bg-rose-500 text-white" },
                          { key: "L", label: "L", color: "bg-amber-500 text-white" },
                          { key: "H", label: "H", color: "bg-blue-500 text-white" },
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => handleStatusToggle(s.studentId, btn.key)}
                            className={`h-7 w-7 rounded-full text-xs font-bold transition ${
                              s.status === btn.key ? btn.color : "text-slate-600 hover:bg-white"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenAnalytics(s)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-[#0c6a99] border border-blue-100 text-[11px] font-bold hover:bg-blue-100 transition"
                      >
                        <Eye className="h-3 w-3 text-[#29ABE2]" /> Attendance History
                      </button>
                    </td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No student records found in database for Class {cls}-{section}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Attendance Analytics Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Attendance Analytics</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5">
                  {selectedStudent.name} (Roll #{selectedStudent.roll})
                </h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[130px] rounded-full bg-white text-xs font-bold">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[110px] rounded-full bg-white text-xs font-bold">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] rounded-full bg-white text-xs font-bold">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="P">Present (P)</SelectItem>
                  <SelectItem value="A">Absent (A)</SelectItem>
                  <SelectItem value="L">Late (L)</SelectItem>
                  <SelectItem value="H">Holiday (H)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Present</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {studentAnalytics?.summary?.present || 0} Days
                </div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <div className="text-[11px] font-bold text-rose-800 uppercase">Absent</div>
                <div className="text-xl font-bold text-rose-700 mt-1">
                  {studentAnalytics?.summary?.absent || 0} Days
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="text-[11px] font-bold text-amber-800 uppercase">Late</div>
                <div className="text-xl font-bold text-amber-700 mt-1">
                  {studentAnalytics?.summary?.late || 0} Days
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="text-[11px] font-bold text-blue-800 uppercase">Attendance %</div>
                <div className="text-xl font-bold text-[#0c6a99] mt-1">
                  {studentAnalytics?.summary?.percentage || 0}%
                </div>
              </div>
            </div>

            {/* Attendance Calendar Grid */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Monthly Attendance Grid ({filterMonth} {filterYear})</div>
              {analyticsLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#29ABE2]" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 font-bold text-slate-400 uppercase text-[10px]">{day}</div>
                  ))}
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const dayNo = idx + 1;
                    const record = studentAnalytics?.records?.find((r) => new Date(r.date).getDate() === dayNo);
                    let color = "bg-slate-100 text-slate-400";
                    if (record?.status === "P") color = "bg-emerald-500 text-white font-bold";
                    if (record?.status === "A") color = "bg-rose-500 text-white font-bold";
                    if (record?.status === "L") color = "bg-amber-500 text-white font-bold";
                    if (record?.status === "H") color = "bg-blue-500 text-white font-bold";

                    if (filterStatus !== "all" && record?.status !== filterStatus && record) {
                      color = "bg-slate-200 text-slate-400 opacity-40";
                    }

                    return (
                      <div key={dayNo} className={`p-2.5 rounded-xl text-xs flex flex-col items-center justify-center min-h-[42px] ${color}`}>
                        <span>{dayNo}</span>
                        {record && <span className="text-[9px] uppercase font-bold mt-0.5">{record.status}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}