import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaneTakeoff, Plus, CheckCircle2, XCircle, Clock, Calendar, Search, Filter, UserCheck, FileText } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";

export default function Leave() {
  const { user } = useAuth();
  const userRoleRaw = String(user?.role || "superAdmin").toLowerCase();
  const isTeacher = userRoleRaw.includes("teacher");
  const isParent = userRoleRaw.includes("parent");
  const isSuperAdmin = userRoleRaw === "superadmin";
  const isSchoolAdmin = userRoleRaw.includes("schooladmin") || userRoleRaw.includes("school_admin") || userRoleRaw.includes("admin") || isSuperAdmin;

  const [activeSchoolId, setActiveSchoolId] = useState(() => {
    return localStorage.getItem("vidyaloop_active_school_id") || "all";
  });

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (isParent) return "child";
    if (isTeacher) return "my-leaves";
    if (isSchoolAdmin) return "staff";
    return "my-leaves";
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { request, statusToSet: 'APPROVED'|'REJECTED' }
  const [comment, setComment] = useState("");

  const [form, setForm] = useState({
    applicantName: user?.name || "",
    leaveType: "Casual",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    if (user?.name && !form.applicantName) {
      setForm((prev) => ({ ...prev, applicantName: user.name }));
    }
  }, [user]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const effectiveSchoolId = (!isSuperAdmin && user?.schoolId) ? user.schoolId : activeSchoolId;
      const res = await api.getLeaveRequests({ schoolId: effectiveSchoolId });
      if (res?.records && Array.isArray(res.records)) {
        setLeaveRequests(res.records);
      } else {
        setLeaveRequests([]);
      }
    } catch (err) {
      console.warn("Could not fetch leave requests:", err);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();

    const handleScopeChange = () => {
      const newScope = localStorage.getItem("vidyaloop_active_school_id") || "all";
      setActiveSchoolId(newScope);
    };
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [activeSchoolId, user]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchesSearch = (r.applicantName || "").toLowerCase().includes(search.toLowerCase()) || (r.reason || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter.toLowerCase();

      if (activeTab === "staff") {
        return r.applicantType === "STAFF" && matchesSearch && matchesStatus;
      }
      if (activeTab === "student") {
        return r.applicantType === "STUDENT" && matchesSearch && matchesStatus;
      }
      if (activeTab === "my-leaves") {
        const isMyName = user?.name ? (r.applicantName || "").toLowerCase().includes(user.name.toLowerCase()) : false;
        const isMyId = user?.id ? r.applicantId === user.id : false;
        return (isMyName || isMyId || isTeacher || !isSchoolAdmin) && matchesSearch && matchesStatus;
      }
      if (activeTab === "child") {
        return r.applicantType === "STUDENT" && matchesSearch && matchesStatus;
      }
      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, activeTab, search, statusFilter, user, isTeacher, isSchoolAdmin]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!form.reason) {
      toast.error("Please enter a reason for leave");
      return;
    }

    try {
      const effectiveSchoolId = (!isSuperAdmin && user?.schoolId) ? user.schoolId : activeSchoolId;
      await api.applyLeave({
        schoolId: effectiveSchoolId,
        applicantType: isTeacher ? "STAFF" : (isParent ? "STUDENT" : "STAFF"),
        applicantName: form.applicantName || user?.name || "Teacher",
        roleOrClass: isTeacher ? (user?.jobTitle || "Teacher") : (isParent ? "Student" : user?.role || "Staff"),
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      toast.success("Leave application submitted to School Admin for approval!");
      setForm({ applicantName: user?.name || "", leaveType: "Casual", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], reason: "" });
      setApplyModalOpen(false);
      fetchLeaveRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit leave application");
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      await api.updateLeaveStatus(actionModal.request.id, {
        status: actionModal.statusToSet,
        comment,
      });

      toast.success(`Leave request ${actionModal.statusToSet.toLowerCase()} successfully!`);
      setActionModal(null);
      setComment("");
      fetchLeaveRequests();
    } catch (err) {
      toast.error("Failed to update leave status");
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-");

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Leave Management & Approvals"
        subtitle={isTeacher ? "Apply for leave, track approval status, and manage your annual leave quotas." : (activeSchoolId === "all" ? "Manage staff and student leave applications and approval workflows across All Schools." : `Leave applications & approval dashboard for Scope: ${activeSchoolId}`)}
        action={
          <button
            onClick={() => setApplyModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Apply For Leave
          </button>
        }
      />

      {/* Leave Balances / Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {leaveRequests.filter((r) => r.status === "PENDING").length} Requests
          </div>
          <div className="text-[12px] text-slate-500 mt-1">Awaiting School Admin Review</div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approved Applications</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {leaveRequests.filter((r) => r.status === "APPROVED").length} Approved
          </div>
          <div className="text-[12px] text-slate-500 mt-1">Processed in MongoDB</div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rejected Requests</span>
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {leaveRequests.filter((r) => r.status === "REJECTED").length} Rejected
          </div>
          <div className="text-[12px] text-slate-500 mt-1">Processed in MongoDB</div>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-slate-100/80 p-1 rounded-xl">
              {isSchoolAdmin && <TabsTrigger value="staff" className="rounded-lg text-[12.5px]">Staff Leaves</TabsTrigger>}
              {isSchoolAdmin && <TabsTrigger value="student" className="rounded-lg text-[12.5px]">Student Leaves</TabsTrigger>}
              <TabsTrigger value="my-leaves" className="rounded-lg text-[12.5px]">My Leaves</TabsTrigger>
              {isParent && <TabsTrigger value="child" className="rounded-lg text-[12.5px]">Child Leave Applications</TabsTrigger>}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicant or reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-[12.5px] rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-[12.5px] rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">PENDING</option>
              <option value="approved">APPROVED</option>
              <option value="rejected">REJECTED</option>
            </select>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PlaneTakeoff className="h-10 w-10 text-slate-300 mx-auto" />
            <div className="text-slate-700 font-semibold text-[15px]">No Leave Applications Found</div>
            <p className="text-slate-400 text-[12px] max-w-sm mx-auto">
              You haven't submitted any leave applications yet. Click "Apply For Leave" below to submit your leave dates to your School Admin.
            </p>
            <button
              type="button"
              onClick={() => setApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm mt-2"
            >
              <Plus className="h-4 w-4" />
              Apply For Leave Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  <th className="pb-3 px-3">Applicant</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Dates</th>
                  <th className="pb-3 px-3">Days</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/60 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{r.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{r.roleOrClass || r.applicantType}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{r.leaveType}</td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{r.totalDays || 1} Day(s)</td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : r.status === "REJECTED" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {r.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3" /> : r.status === "REJECTED" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {r.status === "PENDING" && isSchoolAdmin && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActionModal({ request: r, statusToSet: "APPROVED" })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11.5px] font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ request: r, statusToSet: "REJECTED" })}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11.5px] font-semibold transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status !== "PENDING" && (
                        <span className="text-[11.5px] text-slate-400">Reviewed by {r.actionBy || "School Admin"}</span>
                      )}
                      {r.status === "PENDING" && !isSchoolAdmin && (
                        <span className="text-[11.5px] text-amber-600 font-medium">Awaiting Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Submit Leave Application</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApplyLeave} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Applicant Name</label>
              <input
                type="text"
                value={form.applicantName}
                onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
              <select
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Casual">Casual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Privilege">Privilege / Festival Leave</option>
                <option value="Emergency">Emergency Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Leave</label>
              <textarea
                rows={3}
                required
                placeholder="State the reason for taking leave…"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setApplyModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">Submit Application</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Modal */}
      {actionModal && (
        <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
          <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {actionModal.statusToSet === "APPROVED" ? "Approve Leave Application" : "Reject Leave Application"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-[13px]">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-semibold text-slate-800">{actionModal.request.applicantName} ({actionModal.request.roleOrClass})</div>
                <div className="text-[12px] text-slate-600">{actionModal.request.leaveType} Leave • {fmtDate(actionModal.request.startDate)} to {fmtDate(actionModal.request.endDate)}</div>
                <div className="text-[12px] text-slate-500 italic">"{actionModal.request.reason}"</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Comment (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Approved by Principal or Substitute teacher assigned"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setActionModal(null)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-white font-semibold rounded-xl ${actionModal.statusToSet === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
              >
                Confirm {actionModal.statusToSet === "APPROVED" ? "Approval" : "Rejection"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
