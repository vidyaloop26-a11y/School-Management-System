import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Loader2, Save, Calendar, Clock, User, Building } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import { useRole } from "@/lib/RoleContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5"];

const SUBJECT_COLORS = {
  Mathematics: "bg-blue-50 text-blue-700 border-blue-200",
  Physics: "bg-purple-50 text-purple-700 border-purple-200",
  Chemistry: "bg-amber-50 text-amber-700 border-amber-200",
  Biology: "bg-emerald-50 text-emerald-700 border-emerald-200",
  English: "bg-pink-50 text-pink-700 border-pink-200",
  "Social Sci.": "bg-orange-50 text-orange-700 border-orange-200",
  "Computer Sci.": "bg-cyan-50 text-cyan-700 border-cyan-200",
  Hindi: "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]",
  Science: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function Timetable() {
  const { user, role } = useRole();
  const isTeacher = role === "staff" && (user?.duties || []).includes("teacher");
  const [cls, setCls] = useState("8");
  const [section, setSection] = useState("A");
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);

  // Slot editing modal
  const [editModal, setEditModal] = useState(null); // { day, period, subject, room, staffId }
  const [submitting, setSubmitting] = useState(false);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await api.getTeacherTimetable(user?.staffId);
        if (res && res.grid) {
          setTimetableData(res.grid);
        } else if (res && res.timetable) {
          setTimetableData(res.timetable);
        }
      } else {
        const res = await api.getTimetable(cls, section);
        if (res && res.grid) {
          setTimetableData(res.grid);
        } else {
          setTimetableData({});
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load timetable data from database");
    } finally {
      setLoading(false);
    }
  }, [cls, section, isTeacher, user]);

  useEffect(() => {
    fetchTimetable();
    api.getStaff()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.staff || []);
        setStaffList(list.filter((s) => s.jobTitle === "Teacher" || s.role === "teacher"));
      })
      .catch(() => setStaffList([]));

    const handleScopeChange = () => fetchTimetable();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchTimetable]);

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setSubmitting(true);
    try {
      await api.upsertTimetable({
        cls,
        section,
        day: editModal.day,
        period: editModal.period,
        subject: editModal.subject,
        room: editModal.room,
        staffId: editModal.staffId || undefined,
      });
      toast.success(`Updated ${cls}-${section} (${editModal.day} ${editModal.period}) slot successfully!`);
      setEditModal(null);
      fetchTimetable();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update timetable slot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="timetable-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · SCHEDULE"
        title={isTeacher ? "My Teaching Schedule" : "Class Timetable Manager"}
        subtitle={
          isTeacher
            ? `Assigned weekly period timetable for ${user?.name || "Teacher"}.`
            : `Manage & edit weekly period schedule for Class ${cls}-${section}.`
        }
        right={
          !isTeacher && (
            <div className="flex items-center gap-2">
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger className="w-[120px] rounded-full bg-white/80 text-xs font-semibold">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {["6", "7", "8", "9", "10", "11", "12"].map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[110px] rounded-full bg-white/80 text-xs font-semibold">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D"].map((s) => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching schedule from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll rounded-2xl border border-slate-200/80 bg-white/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 text-left border-r border-slate-200 w-24">Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className="p-3.5 text-center border-r border-slate-200 min-w-[150px]">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p} className="border-t border-slate-200">
                    <td className="p-3.5 font-bold font-mono text-slate-700 bg-slate-50/80 border-r border-slate-200">
                      {p}
                    </td>
                    {DAYS.map((d) => {
                      const slot = timetableData[p]?.[d] || {};
                      const subjectName = slot.subject || "No Class";
                      const colorClass = SUBJECT_COLORS[subjectName] || "bg-slate-50 text-slate-600 border-slate-200";

                      return (
                        <td
                          key={d}
                          onClick={() => {
                            if (!isTeacher) {
                              setEditModal({
                                day: d,
                                period: p,
                                subject: slot.subject || "Mathematics",
                                room: slot.room || "Room 201",
                                staffId: slot.staffId || "",
                              });
                            }
                          }}
                          className={`p-3 border-r border-slate-200 align-top ${!isTeacher ? "cursor-pointer hover:bg-blue-50/50 transition group" : ""}`}
                        >
                          <div className={`p-2.5 rounded-xl border ${colorClass} space-y-1`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[12.5px]">{subjectName}</span>
                              {!isTeacher && (
                                <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                              )}
                            </div>
                            {slot.room && (
                              <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                                <Building className="h-3 w-3" /> {slot.room}
                              </div>
                            )}
                            {slot.teacher && (
                              <div className="text-[11px] font-semibold opacity-90 flex items-center gap-1">
                                <User className="h-3 w-3 text-[#29ABE2]" /> {slot.teacher}
                              </div>
                            )}
                          </div>
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

      {/* Edit Slot Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">
                  Class {cls}-{section} Schedule
                </div>
                <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                  Edit {editModal.day} {editModal.period} Slot
                </h3>
              </div>
              <button onClick={() => setEditModal(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={editModal.subject}
                  onChange={(e) => setEditModal({ ...editModal, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#29ABE2]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Room / Lab Location</label>
                <input
                  type="text"
                  value={editModal.room}
                  onChange={(e) => setEditModal({ ...editModal, room: e.target.value })}
                  placeholder="e.g. Room 204 or Physics Lab"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Faculty Member</label>
                <select
                  value={editModal.staffId}
                  onChange={(e) => setEditModal({ ...editModal, staffId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#29ABE2] bg-white text-[#0c6a99]"
                >
                  <option value="">-- Unassigned --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.dept || "Teacher"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-[#29ABE2] text-white font-bold hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}