import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Search, Plus, ChevronRight, Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, UserPlus, KeyRound, Briefcase, GraduationCap, Phone, Mail, UserCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

const DEPARTMENTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Hindi",
  "Computer Science",
  "Humanities",
  "Administration",
  "Finance",
];

const JOB_TITLES = [
  "Teacher",
  "Senior Teacher",
  "Vice Principal",
  "Principal",
  "Front Office",
  "Accountant",
  "Librarian",
  "Lab Assistant",
];

export default function Staff() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Single Staff Form
  const [singleForm, setSingleForm] = useState({
    staffId: "",
    name: "",
    jobTitle: "Teacher",
    dept: "Mathematics",
    subject: "Mathematics",
    qualification: "M.Sc, B.Ed",
    email: "",
    phone: "",
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  });

  const [createdTeacherCreds, setCreatedTeacherCreds] = useState(null);

  // Bulk Import State
  const [csvRaw, setCsvRaw] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStaff({ search: q, dept, status });
      if (Array.isArray(data)) {
        setStaffList(data);
      } else if (data && data.staff) {
        setStaffList(data.staff);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      toast.error("Failed to load staff from database");
    } finally {
      setLoading(false);
    }
  }, [q, dept, status]);

  useEffect(() => {
    fetchStaff();

    // Re-fetch when SuperAdmin changes active school in topbar
    const handleScopeChange = () => fetchStaff();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchStaff]);

  const depts = useMemo(
    () => Array.from(new Set(staffList.map((s) => s.dept).filter(Boolean))).sort(),
    [staffList]
  );

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (e, staffMember) => {
    e.stopPropagation();
    const newStatus = staffMember.status === "Active" ? "Inactive" : "Active";
    try {
      await api.updateStaff(staffMember.id, { status: newStatus });
      toast.success(`Staff member "${staffMember.name}" status updated to ${newStatus}`);
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    }
  };

  // Handle Single Staff Creation
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleForm.staffId || !singleForm.name || !singleForm.jobTitle) {
      toast.error("Please fill in required fields (Staff ID, Full Name, Job Title).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createStaff(singleForm);
      toast.success(`Staff member "${singleForm.name}" created successfully!`);
      if (res && res.credentials) {
        setCreatedTeacherCreds(res.credentials);
      } else {
        setShowSingleModal(false);
      }
      fetchStaff();
      setSingleForm({
        staffId: "",
        name: "",
        jobTitle: "Teacher",
        dept: "Mathematics",
        subject: "Mathematics",
        qualification: "M.Sc, B.Ed",
        email: "",
        phone: "",
        status: "Active",
        joined: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Template Downloader
  const downloadSampleCsv = () => {
    const csvContent =
      "staffId,name,jobTitle,dept,subject,qualification,email,phone,status,joined\n" +
      "VLS-107,Anjali Sharma,Teacher,Mathematics,Mathematics,M.Sc Maths B.Ed,anjali.sharma@vidyaloop.local,+91 9811003301,Active,2024-04-15\n" +
      "VLS-108,Rohan Sen,Teacher,Science,Physics,M.Sc Physics B.Ed,rohan.sen@vidyaloop.local,+91 9811003302,Active,2024-04-15\n" +
      "VLS-109,Sunita Kulkarni,Front Office,Administration,Front Office,B.A,sunita.k@vidyaloop.local,+91 9811003303,Inactive,2023-06-01";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vidyaloop_staff_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parser Helper
  const parseCsvText = (text) => {
    setCsvRaw(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (!currentLine) continue;

      const values = currentLine.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || "";
      });

      const staffId = rowObj.staffId || rowObj.id || "";
      const name = rowObj.name || rowObj.fullName || "";
      const jobTitle = rowObj.jobTitle || rowObj.role || "Teacher";

      const isValid = Boolean(staffId && name && jobTitle);

      rows.push({
        staffId,
        name,
        jobTitle,
        dept: rowObj.dept || "General",
        subject: rowObj.subject || undefined,
        qualification: rowObj.qualification || undefined,
        email: rowObj.email || undefined,
        phone: rowObj.phone || undefined,
        status: rowObj.status || "Active",
        joined: rowObj.joined || new Date().toISOString().slice(0, 10),
        isValid,
        errorMsg: !isValid ? "Missing Staff ID, Name, or Job Title" : "",
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => parseCsvText(evt.target.result);
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    setSubmitting(true);
    try {
      const res = await api.bulkCreateStaff(validRows);
      toast.success(`Successfully imported ${res.successCount} staff members into database!`);
      setImportSummary(res);
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to execute bulk staff import");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="staff-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Staff & Faculty"
        subtitle={`${staffList.length} teaching & non-teaching faculty members in database.`}
        right={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ExportButton testId="staff-export" />
            <button
              onClick={() => {
                setCsvRaw("");
                setParsedRows([]);
                setImportSummary(null);
                setShowBulkModal(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white/80 hover:bg-slate-100 border border-slate-200 transition text-slate-700 px-3.5 py-2.5 rounded-full text-xs font-semibold shadow-xs"
            >
              <Upload className="h-4 w-4 text-[#29ABE2]" /> Bulk CSV Import
            </button>
            <button
              onClick={() => {
                setCreatedTeacherCreds(null);
                setShowSingleModal(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Staff Member
            </button>
          </div>
        }
      />

      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        {/* Filter Controls Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              data-testid="staff-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search staff member by name or staff ID..."
              className="w-full bg-transparent outline-none text-xs sm:text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger data-testid="filter-dept" className="w-full sm:w-[170px] rounded-full bg-white/80 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {depts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active / Inactive Status Filter */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="filter-status" className="w-full sm:w-[150px] rounded-full bg-white/80 border-blue-200 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active Only</SelectItem>
                <SelectItem value="Inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Loading faculty members from database...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Staff ID</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Role / Job Title</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Status (Click to toggle)</th>
                    <th className="px-5 py-3 w-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr
                      key={s.id || s.staffId}
                      data-testid={`staff-row-${s.staffId}`}
                      onClick={() => navigate(`/staff/${s.id || s.staffId}`)}
                      className="border-t border-slate-100 hover:bg-[#f3faff] cursor-pointer transition group"
                    >
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{s.staffId}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 group-hover:text-[#0c6a99] transition">{s.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">{s.jobTitle || s.role}</td>
                      <td className="px-5 py-3.5 text-slate-600">{s.dept || "General"}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => handleToggleStatus(e, s)}
                          title="Click to toggle Active / Inactive status"
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition cursor-pointer hover:scale-105 ${
                            s.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {s.status || "Active"}
                        </button>
                      </td>
                      <td className="px-3 py-3.5 text-slate-400 group-hover:text-[#0c6a99] text-right">
                        <ChevronRight className="h-4 w-4 inline" />
                      </td>
                    </tr>
                  ))}
                  {staffList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                        No staff database records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Responsive Mobile Cards List */}
            <div className="md:hidden space-y-3">
              {staffList.map((s) => (
                <div
                  key={s.id || s.staffId}
                  data-testid={`staff-card-${s.staffId}`}
                  onClick={() => navigate(`/staff/${s.id || s.staffId}`)}
                  className="glass-soft rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition border border-slate-100 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-slate-400">ID: {s.staffId}</div>
                      <div className="font-bold text-slate-800 text-[15px] mt-0.5 truncate text-[#0c6a99]">
                        {s.name}
                      </div>
                    </div>
                    {/* Toggle Status Button on Mobile */}
                    <button
                      onClick={(e) => handleToggleStatus(e, s)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shrink-0 ${
                        s.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {s.status || "Active"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {s.jobTitle || s.role}
                      </span>
                      <span className="font-semibold text-[#0c6a99] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {s.dept || "General"}
                      </span>
                    </div>

                    <div className="text-[#0c6a99] font-bold flex items-center gap-1 text-xs">
                      View Details <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
              {staffList.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs glass-soft rounded-2xl p-4">
                  No staff records found matching filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 1. Add Single Staff Member Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Faculty Onboarding</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#29ABE2]" /> Add New Staff Member
                </h3>
              </div>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </div>

            {/* Created Teacher Account Credentials Banner */}
            {createdTeacherCreds ? (
              <div className="my-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Teacher Portal Account Generated!
                </div>
                <p className="text-xs text-emerald-900">
                  Because this staff member's job title is <strong>Teacher</strong>, a login portal account was created automatically:
                </p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-mono space-y-1">
                  <div><strong>Portal Username:</strong> {createdTeacherCreds.username}</div>
                  <div><strong>Temporary Password:</strong> {createdTeacherCreds.tempPassword}</div>
                </div>
                <button
                  onClick={() => {
                    setCreatedTeacherCreds(null);
                    setShowSingleModal(false);
                  }}
                  className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSingleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Staff ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VLS-107"
                      value={singleForm.staffId}
                      onChange={(e) => setSingleForm({ ...singleForm, staffId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anjali Sharma"
                      value={singleForm.name}
                      onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Job Title / Role *</label>
                    <select
                      value={singleForm.jobTitle}
                      onChange={(e) => setSingleForm({ ...singleForm, jobTitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#29ABE2] bg-white text-[#0c6a99]"
                    >
                      {JOB_TITLES.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Department</label>
                    <select
                      value={singleForm.dept}
                      onChange={(e) => setSingleForm({ ...singleForm, dept: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Subject Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. Mathematics"
                      value={singleForm.subject}
                      onChange={(e) => setSingleForm({ ...singleForm, subject: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. M.Sc Maths, B.Ed"
                      value={singleForm.qualification}
                      onChange={(e) => setSingleForm({ ...singleForm, qualification: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="anjali@vidyaloop.local"
                      value={singleForm.email}
                      onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9811003301"
                      value={singleForm.phone}
                      onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSingleModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Staff Member
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Faculty Data Import</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-[#29ABE2]" /> Bulk Import Staff via CSV
                </h3>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-5 w-5 text-[#29ABE2] shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">1. Download CSV Sample Template</div>
                    <div className="text-[11px] text-slate-500">Headers: staffId, name, jobTitle, dept, subject, qualification, email, phone, status</div>
                  </div>
                </div>
                <button
                  onClick={downloadSampleCsv}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-full bg-white border border-blue-200 text-[#0c6a99] text-xs font-semibold hover:bg-blue-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">2. Upload CSV File or Paste Text</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="w-full rounded-2xl border border-dashed border-slate-300 p-3 text-xs bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  value={csvRaw}
                  onChange={(e) => parseCsvText(e.target.value)}
                  placeholder="Paste CSV contents here..."
                  className="w-full rounded-2xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-[#29ABE2]"
                />
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Parsed Staff Records ({parsedRows.length})</span>
                    <span className="text-emerald-700">{parsedRows.filter(r => r.isValid).length} Valid Records</span>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] thin-scroll rounded-xl border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2 text-left">Staff ID</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Job Title</th>
                          <th className="p-2 text-left">Dept</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className={`border-t border-slate-100 ${r.isValid ? "bg-emerald-50/30" : "bg-rose-50/40"}`}>
                            <td className="p-2 font-mono">{r.staffId || "—"}</td>
                            <td className="p-2 font-medium">{r.name || "—"}</td>
                            <td className="p-2 font-semibold text-[#0c6a99]">{r.jobTitle}</td>
                            <td className="p-2">{r.dept}</td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                              ) : (
                                <span className="text-rose-700 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {r.errorMsg}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  disabled={submitting || parsedRows.filter(r => r.isValid).length === 0}
                  onClick={handleBulkSubmit}
                  className="px-6 py-2 rounded-full bg-[#29ABE2] text-[#fff] text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Import Valid Staff to DB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}