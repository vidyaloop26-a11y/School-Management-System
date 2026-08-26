import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Building2, Users, GraduationCap, Search, Loader2, Mail, Phone, ChevronRight, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function Support() {
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Find-student form
  const [findForm, setFindForm] = useState({ schoolId: "", email: "" });
  const [findResult, setFindResult] = useState(null);
  const [findLoading, setFindLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, schoolsRes] = await Promise.all([
        api.get("/support/stats"),
        api.get("/support/schools"),
      ]);
      setStats(statsRes.data.stats);
      setSchools(schoolsRes.data.schools || []);
    } catch (err) {
      toast.error("Failed to load platform data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSchoolClick = async (school) => {
    setSelectedSchool(school);
    setSchoolProfile(null);
    setProfileLoading(true);
    try {
      const res = await api.get(`/support/school/${school.id}`);
      setSchoolProfile(res.data.school);
    } catch (err) {
      toast.error("Failed to load school profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFindStudent = async (e) => {
    e.preventDefault();
    if (!findForm.schoolId || !findForm.email) {
      toast.error("School ID and email are required");
      return;
    }
    setFindLoading(true);
    setFindResult(null);
    try {
      const res = await api.post("/support/find-student", findForm);
      setFindResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lookup failed");
    } finally {
      setFindLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: "Schools", value: stats.schools, icon: Building2, color: "text-blue-600 bg-blue-50" },
    { label: "Students", value: stats.students, icon: Users, color: "text-emerald-600 bg-emerald-50" },
    { label: "Staff", value: stats.staff, icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
    { label: "Staff Accounts", value: stats.staffAccounts, icon: Users, color: "text-amber-600 bg-amber-50" },
    { label: "Parent Accounts", value: stats.parentAccounts, icon: Users, color: "text-rose-600 bg-rose-50" },
    { label: "Active School Admins", value: stats.activeSchoolAdmins, icon: Shield, color: "text-cyan-600 bg-cyan-50" },
  ] : [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="PLATFORM ADMIN"
        title="Support Console"
        subtitle="Platform-wide aggregates and audited support lookups. Per-school private data is never exposed here."
      />

      {/* Platform-wide stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass rounded-2xl p-4">
              <div className={`h-10 w-10 rounded-xl grid place-items-center ${s.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 mt-3">{(s.value ?? 0).toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Find Student Lookup */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[#29ABE2]" />
          <h2 className="font-bold text-slate-900 text-[15px]">Student Lookup</h2>
        </div>
        <form onSubmit={handleFindStudent} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="School ID or Code"
            value={findForm.schoolId}
            onChange={(e) => setFindForm({ ...findForm, schoolId: e.target.value })}
            className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30 flex-1 max-w-[200px]"
          />
          <input
            type="email"
            placeholder="Student or parent email"
            value={findForm.email}
            onChange={(e) => setFindForm({ ...findForm, email: e.target.value })}
            className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30 flex-1"
          />
          <button
            type="submit"
            disabled={findLoading}
            className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold rounded-xl transition disabled:opacity-50"
          >
            {findLoading ? "Searching..." : "Find Student"}
          </button>
        </form>

        {findResult && (
          <div className={`p-4 rounded-xl ${findResult.found ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
            {findResult.found ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[13px]">
                  <AlertCircle className="h-4 w-4" /> Student Found
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                  <div><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-800">{findResult.student.name}</span></div>
                  <div><span className="text-slate-500">Adm No:</span> <span className="font-mono text-slate-800">{findResult.student.admNo}</span></div>
                  <div><span className="text-slate-500">Class:</span> <span className="font-semibold text-slate-800">{findResult.student.cls}-{findResult.student.section}</span></div>
                  <div><span className="text-slate-500">School:</span> <span className="font-semibold text-slate-800">{findResult.school?.name}</span></div>
                </div>
                <div className="text-[11px] text-emerald-600">Parent login: {findResult.student.hasParentLogin ? "Yes" : "No"}</div>
              </div>
            ) : (
              <div className="text-amber-800 text-[13px] font-medium">No student found matching that email in the specified school.</div>
            )}
          </div>
        )}
      </div>

      {/* Schools Summary */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-slate-900 text-[15px]">Schools</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                <th className="pb-3 px-3">School</th>
                <th className="pb-3 px-3">Code</th>
                <th className="pb-3 px-3">Board</th>
                <th className="pb-3 px-3 text-center">Students</th>
                <th className="pb-3 px-3 text-center">Staff</th>
                <th className="pb-3 px-3 text-center">Accounts</th>
                <th className="pb-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-white/60 transition cursor-pointer" onClick={() => handleSchoolClick(s)}>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">{s.code}</td>
                  <td className="py-3.5 px-3 text-slate-600">{s.board}</td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-700">{s.students}</td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-700">{s.staff}</td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-700">{s.userAccounts}</td>
                  <td className="py-3.5 px-3 text-right">
                    <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No schools found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* School Profile Dialog */}
      <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {selectedSchool?.name || "School Profile"}
            </DialogTitle>
          </DialogHeader>
          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
            </div>
          ) : schoolProfile ? (
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div><span className="text-slate-400 text-[11px] block uppercase">Code</span><span className="font-semibold text-slate-800">{schoolProfile.code}</span></div>
                <div><span className="text-slate-400 text-[11px] block uppercase">Board</span><span className="font-semibold text-slate-800">{schoolProfile.board}</span></div>
                <div><span className="text-slate-400 text-[11px] block uppercase">Session</span><span className="font-semibold text-slate-800">{schoolProfile.session}</span></div>
                <div><span className="text-slate-400 text-[11px] block uppercase">Students</span><span className="font-semibold text-slate-800">{schoolProfile.counts?.students ?? 0}</span></div>
                <div><span className="text-slate-400 text-[11px] block uppercase">Staff</span><span className="font-semibold text-slate-800">{schoolProfile.counts?.staff ?? 0}</span></div>
                <div><span className="text-slate-400 text-[11px] block uppercase">Created</span><span className="font-semibold text-slate-800">{new Date(schoolProfile.createdAt).toLocaleDateString()}</span></div>
              </div>
              {schoolProfile.address && (
                <div><span className="text-slate-400 text-[11px] uppercase">Address</span><div className="text-slate-700 mt-0.5">{schoolProfile.address}</div></div>
              )}
              {schoolProfile.admins?.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-400 uppercase mb-2">School Admin Accounts</div>
                  {schoolProfile.admins.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-xs font-semibold">
                        {a.name?.charAt(0) || "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-[13px]">{a.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">No profile data available.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
