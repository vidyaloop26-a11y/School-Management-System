import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, CalendarDays, GraduationCap, BookOpen, IdCard, Loader2, KeyRound, CheckCircle2, Briefcase, UserCheck, UserX } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DAYS, PERIODS } from "@/lib/mockData";
import EmptyState from "@/components/common/EmptyState";
import { PlaneTakeoff } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-white/70 border border-white grid place-items-center shrink-0">
        <Icon className="h-4 w-4 text-[#29ABE2]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] tracking-[0.14em] font-semibold text-slate-400 uppercase">{label}</div>
        <div className="text-[13.5px] text-slate-800 mt-0.5 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function StaffProfile() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffById(staffId).catch(async () => {
        const list = await api.getStaff();
        const match = list.find(
          (s) => s.id === staffId || s.staffId.toLowerCase() === staffId.toLowerCase()
        );
        if (match) return { staff: match };
        throw new Error("Staff member not found");
      });

      if (res && (res.staff || res.id)) {
        setStaff(res.staff || res);
      } else {
        setError("Staff member record not found in database.");
      }
    } catch (err) {
      console.error(err);
      setError("Staff member record not found in database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [staffId]);

  const handleToggleStatus = async () => {
    if (!staff || !staff.id) return;
    const newStatus = staff.status === "Active" ? "Inactive" : "Active";
    setUpdatingStatus(true);
    try {
      await api.updateStaff(staff.id, { status: newStatus });
      toast.success(`Staff status changed to ${newStatus}`);
      setStaff({ ...staff, status: newStatus });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update staff status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResetPassword = async () => {
    if (!staff || !staff.id) return;
    setResettingPassword(true);
    try {
      const res = await api.resetStaffPassword(staff.id);
      setResetResult(res);
      toast.success("New temp password generated for teacher!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to reset teacher password");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#29ABE2]" />
        <span className="text-sm text-slate-500">Loading staff profile from database...</span>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="max-w-[1400px] mx-auto py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </button>
        <div className="glass rounded-2xl p-8 text-center text-slate-500">
          {error || "Staff record not found in database."}
        </div>
      </div>
    );
  }

  const p = {
    id: staff.staffId,
    name: staff.name,
    role: staff.jobTitle || staff.role || "Teacher",
    dept: staff.dept || "General",
    subject: staff.subject || null,
    qualification: staff.qualification || null,
    email: staff.email || null,
    phone: staff.phone || null,
    joined: staff.joined || null,
    status: staff.status || "Active",
  };

  const isTeacher = p.role.toLowerCase().includes("teacher");
  const initials = p.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  return (
    <div data-testid="staff-profile" className="max-w-[1400px] mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Staff
      </button>

      <div className="glass rounded-2xl p-6 md:p-7 reveal">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5 min-w-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-2xl font-bold shadow-sm">{initials}</div>
            <div className="min-w-0">
              <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">{p.role} · {p.id}</div>
              <h1 className="font-display title-dot text-[36px] leading-tight font-bold text-slate-900 tracking-tight mt-0.5">{p.name}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">{p.dept}</span>
                {p.subject && (
                  <span className="rounded-full bg-[#e6f4fb] text-[#0c6a99] px-3 py-1 text-[11.5px] font-medium">{p.subject}</span>
                )}
                <button
                  onClick={handleToggleStatus}
                  disabled={updatingStatus}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition cursor-pointer hover:scale-105 ${
                    p.status === "Active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  {p.status === "Active" ? "● Active (Click to Deactivate)" : "● Inactive (Click to Activate)"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`inline-flex items-center gap-2 border px-4 py-2.5 rounded-full text-xs font-medium transition ${
                p.status === "Active"
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {updatingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : p.status === "Active" ? (
                <>
                  <UserX className="h-4 w-4 text-rose-600" /> Set as Inactive
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 text-emerald-600" /> Set as Active
                </>
              )}
            </button>

            {isTeacher && (
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-full text-xs font-medium shadow-xs transition"
              >
                {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 text-[#29ABE2]" />}
                Reset Portal Password
              </button>
            )}
          </div>
        </div>

        {resetResult && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Teacher Password Reset Success: </span>
                <span className="font-mono text-slate-700">Username: {resetResult.username} | Temp Password: <span className="font-bold text-emerald-800">{resetResult.password}</span></span>
              </div>
            </div>
            <button onClick={() => setResetResult(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}

        <Tabs defaultValue="overview" className="mt-7">
          <div className="overflow-x-auto thin-scroll -mx-1 px-1">
            <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1 w-max">
              <TabsTrigger value="overview" data-testid="stab-overview" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="timetable" data-testid="stab-timetable" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Timetable</TabsTrigger>
              <TabsTrigger value="leave" data-testid="stab-leave" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Leave Record</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Employment Details (Database)</div>
                <Field icon={IdCard} label="Staff ID" value={p.id} />
                <Field icon={CalendarDays} label="Date Joined" value={p.joined} />
                <Field icon={BookOpen} label="Subject Handled" value={p.subject} />
                <Field icon={GraduationCap} label="Qualification" value={p.qualification} />
              </div>
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Contact Information</div>
                <Field icon={Mail} label="Email Address" value={p.email} />
                <Field icon={Phone} label="Phone Number" value={p.phone} />
                <Field icon={Briefcase} label="Department" value={p.dept} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timetable" className="mt-6">
            <div className="glass-soft rounded-xl p-4 overflow-x-auto thin-scroll">
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className="text-left px-3 py-2 text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((pr) => (
                    <tr key={pr.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-slate-800">{pr.label}</div>
                        <div className="text-[10.5px] text-slate-500">{pr.time}</div>
                      </td>
                      {DAYS.map((d) => (
                        <td key={d} className="px-3 py-2">
                          <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                            <div className="text-[12px] font-medium text-slate-700">{p.subject || "Teaching"}</div>
                            <div className="text-[10.5px] text-slate-500">Room 204 · Class 8-A</div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="mt-6">
            <div className="glass-soft rounded-xl py-6">
              <EmptyState
                icon={PlaneTakeoff}
                title="No pending leave requests"
                hint="Any staff leave submissions will appear here."
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
