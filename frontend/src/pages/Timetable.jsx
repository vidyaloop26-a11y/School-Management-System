import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS, PERIODS, SUBJECT_COLORS } from "@/lib/mockData";
import { Loader2, Plus, Edit3, Calendar, Clock, UserCheck, BookOpen, User } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { useRole } from "@/lib/RoleContext";

const CLASSES_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS_LIST = ["A", "B", "C", "D"];

const SUBJECTS_LIST = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Hindi",
  "Physical Education",
  "Art & Craft",
  "Music",
];

export default function Timetable() {
  const { user, role } = useRole();
  const isTeacher = role === "Teacher" || user?.role === "teacher" || user?.role === "Teacher";
  const isAdmin = role === "Admin" || role === "superAdmin" || user?.role === "schoolAdmin" || user?.role === "superAdmin";

  const [view, setView] = useState(isTeacher ? "teacher" : "class"); // class | teacher
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [loading, setLoading] = useState(true);
  const [timetableGrid, setTimetableGrid] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherProfileName, setTeacherProfileName] = useState("");

  // Edit Modal State (Admin only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState({
    day: "Mon",
    period: "P1",
    subject: "Mathematics",
    teacherId: "",
    room: "Room 204",
  });
  const [saving, setSaving] = useState(false);

  // Load Staff List & Timetable from API
  const loadData = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        // Teacher view: Fetch logged-in teacher's personal schedule directly
        const teacherTt = await api.getTeacherTimetable(user?.staffId || "").catch(() => null);
        if (teacherTt && teacherTt.grid) {
          setTimetableGrid(teacherTt.grid);
          setTeacherProfileName(teacherTt.teacherName || user?.name || "Teacher");
        } else {
          setTimetableGrid({});
        }
      } else {
        // Admin view: Fetch class schedule or all staff
        const [ttData, staffData] = await Promise.all([
          api.getTimetable(cls, section).catch(() => null),
          api.getStaff().catch(() => []),
        ]);

        if (ttData && ttData.grid) {
          setTimetableGrid(ttData.grid);
        } else {
          setTimetableGrid({});
        }

        const stList = Array.isArray(staffData) ? staffData : (staffData?.staff || []);
        setStaffList(stList);
        if (stList.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(stList[0].id || stList[0].staffId);
        }
      }
    } catch (err) {
      console.error("Failed to load timetable data:", err);
      toast.error("Failed to fetch timetable records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cls, section, view, isTeacher, selectedTeacherId]);

  // Open Edit Modal for a specific cell slot (Admin only)
  const handleOpenEditSlot = (periodKey, dayKey, currentCell) => {
    if (!isAdmin || periodKey === "BREAK") return;
    setEditingSlot({
      day: dayKey,
      period: periodKey,
      subject: currentCell?.subject || "Mathematics",
      teacherId: currentCell?.teacherId || (staffList[0]?.id || ""),
      room: currentCell?.room || `Room ${cls}0${section === "A" ? "1" : "2"}`,
    });
    setShowEditModal(true);
  };

  // Save / Upsert Period Slot to MongoDB (Admin only)
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const entriesPayload = [];

      PERIODS.forEach((pr) => {
        if (pr.key === "BREAK") return;
        DAYS.forEach((d) => {
          const isTarget = pr.key === editingSlot.period && d === editingSlot.day;
          const existingCell = timetableGrid[pr.key]?.[d];

          if (isTarget) {
            entriesPayload.push({
              day: editingSlot.day,
              period: editingSlot.period,
              subject: editingSlot.subject,
              room: editingSlot.room || "Room 204",
              staffId: editingSlot.teacherId || undefined,
            });
          } else if (existingCell && existingCell.subject) {
            entriesPayload.push({
              day: d,
              period: pr.key,
              subject: existingCell.subject,
              room: existingCell.room || "Room 204",
              staffId: existingCell.teacherId || undefined,
            });
          }
        });
      });

      const res = await api.upsertTimetable({
        cls,
        section,
        entries: entriesPayload,
      });

      if (res && res.grid) {
        setTimetableGrid(res.grid);
      }
      toast.success(`Period ${editingSlot.period} (${editingSlot.day}) updated for Class ${cls}-${section}!`);
      setShowEditModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save timetable entry");
    } finally {
      setSaving(false);
    }
  };

  // Teacher Schedule View Filtering
  const displayedGrid = useMemo(() => {
    if (!timetableGrid) return {};
    if (isTeacher) return timetableGrid;
    if (view === "class") return timetableGrid;

    const selectedTeacherObj = staffList.find((s) => s.id === selectedTeacherId || s.staffId === selectedTeacherId);
    const tName = selectedTeacherObj?.name || "";

    const out = {};
    PERIODS.forEach((pr) => {
      out[pr.key] = {};
      DAYS.forEach((d) => {
        const cell = timetableGrid[pr.key]?.[d];
        if (cell && (cell.teacherId === selectedTeacherId || cell.teacher === tName || cell.teacherName === tName)) {
          out[pr.key][d] = { ...cell, cls: `${cls}-${section}` };
        } else {
          out[pr.key][d] = null;
        }
      });
    });
    return out;
  }, [timetableGrid, view, selectedTeacherId, staffList, cls, section, isTeacher]);

  return (
    <div data-testid="timetable-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow={isTeacher ? "TEACHER PORTAL" : "ACADEMICS"}
        title={isTeacher ? `My Teaching Schedule (${user?.name || "Teacher"})` : "Class Timetable & Schedule"}
        subtitle={
          isTeacher
            ? `Your personalized weekly teaching schedule assigned by School Admin.`
            : view === "class"
            ? `Manage & edit weekly period schedule for Class ${cls}-${section}.`
            : `Individual weekly schedule for faculty members.`
        }
        right={
          !isTeacher && (
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={view} onValueChange={setView}>
                <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1">
                  <TabsTrigger data-testid="tt-class-view" value="class" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Class View</TabsTrigger>
                  <TabsTrigger data-testid="tt-teacher-view" value="teacher" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px]">Teacher Schedule View</TabsTrigger>
                </TabsList>
              </Tabs>

              {view === "class" ? (
                <div className="flex items-center gap-2">
                  <Select value={cls} onValueChange={setCls}>
                    <SelectTrigger data-testid="tt-class-select" className="w-[120px] rounded-full bg-white/80 border-blue-200"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {CLASSES_LIST.map((c) => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger className="w-[100px] rounded-full bg-white/80 border-blue-200"><SelectValue placeholder="Sec" /></SelectTrigger>
                    <SelectContent>
                      {SECTIONS_LIST.map((s) => (
                        <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger data-testid="tt-teacher-select" className="w-[220px] rounded-full bg-white/80 border-blue-200"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>
                    {staffList.map((t) => (
                      <SelectItem key={t.id || t.staffId} value={t.id || t.staffId}>{t.name} ({t.jobTitle})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {/* Banner for Teacher Portal */}
        {isTeacher && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-800 text-xs">Logged in as Faculty Member: {user?.name || "Teacher"}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Below is your assigned weekly teaching schedule configured by your School Admin.</div>
              </div>
            </div>
          </div>
        )}

        {/* Banner for School Admin */}
        {isAdmin && view === "class" && (
          <div className="mb-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#29ABE2]" />
              <span><strong>School Admin Timetable Editor:</strong> Click any cell to assign or change Subject, Teacher, and Room for Class {cls}-{section}.</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching timetable schedule from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-3 text-[10.5px] tracking-[0.14em] font-semibold text-slate-500 uppercase w-[140px]">Period & Time</th>
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
                              Lunch Break
                            </div>
                          </td>
                        );
                      }

                      const cell = displayedGrid[pr.key]?.[d];
                      if (!cell) {
                        return (
                          <td key={d} className="px-2 py-2 align-top">
                            {isAdmin ? (
                              <button
                                onClick={() => handleOpenEditSlot(pr.key, d, null)}
                                className="w-full h-full min-h-[70px] rounded-xl border border-dashed border-slate-200 hover:border-[#29ABE2] hover:bg-blue-50/50 text-slate-400 hover:text-[#0c6a99] text-[12px] px-3 py-4 text-center transition flex flex-col items-center justify-center gap-1 group"
                              >
                                <Plus className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                                <span className="text-[11px] opacity-70 group-hover:opacity-100">+ Assign</span>
                              </button>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-200 text-slate-300 text-[12px] px-3 py-4 text-center">—</div>
                            )}
                          </td>
                        );
                      }

                      const col = SUBJECT_COLORS[cell.subject] || { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };
                      return (
                        <td key={d} className="px-2 py-2 align-top">
                          <button
                            data-testid={`tt-cell-${pr.key}-${d}`}
                            onClick={() => isAdmin && handleOpenEditSlot(pr.key, d, cell)}
                            disabled={!isAdmin}
                            className={`w-full text-left rounded-xl ${col.bg} px-3.5 py-3 transition ${isAdmin ? "hover:scale-[1.015] hover:shadow-[0_6px_20px_-8px_rgba(20,60,100,0.18)] cursor-pointer" : "cursor-default"} focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 group relative`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                                <div className={`text-[13px] font-semibold ${col.text}`}>{cell.subject}</div>
                              </div>
                              {isAdmin && <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-60 text-slate-500" />}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium mt-1 truncate">
                              {isTeacher ? `Class ${cell.cls}` : (cell.teacher || cell.teacherName || "Assigned Teacher")}
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5">
                              {cell.room || 'Room 204'}
                            </div>
                          </button>
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

      {/* Assign / Edit Period Slot Modal (Admin Only) */}
      {showEditModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Class {cls}-{section} Schedule</div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mt-0.5">
                  <Clock className="h-5 w-5 text-[#29ABE2]" /> Edit Period Slot ({editingSlot.day} · {editingSlot.period})
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Day</label>
                  <select
                    value={editingSlot.day}
                    onChange={(e) => setEditingSlot({ ...editingSlot, day: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white font-medium"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Period Slot</label>
                  <select
                    value={editingSlot.period}
                    onChange={(e) => setEditingSlot({ ...editingSlot, period: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white font-medium"
                  >
                    {PERIODS.filter(p => p.key !== "BREAK").map((p) => (
                      <option key={p.key} value={p.key}>{p.label} ({p.time})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Subject *</label>
                <select
                  value={editingSlot.subject}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white font-medium text-[#0c6a99]"
                >
                  {SUBJECTS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Assigned Faculty / Teacher</label>
                <select
                  value={editingSlot.teacherId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white text-xs"
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {staffList.map((st) => (
                    <option key={st.id || st.staffId} value={st.id || st.staffId}>
                      {st.name} ({st.jobTitle} - {st.dept || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Room / Lab Location</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Physics Lab"
                  value={editingSlot.room}
                  onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Period Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
