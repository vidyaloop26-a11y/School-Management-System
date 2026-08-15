import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Search, Plus, ChevronRight, Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, UserPlus, KeyRound, Briefcase, GraduationCap, Phone, Mail, UserCheck, Shield } from "lucide-react";
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
    assignedClass: "8",
    assignedSection: "A",
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  });

  const [createdTeacherCreds, setCreatedTeacherCreds] = useState(null);
  const [bulkCredentialsReport, setBulkCredentialsReport] = useState(null);

  // Bulk Import State
  const [csvRaw, setCsvRaw] = useState("");
  const [parsedRows, setParsedRows] = useState([]);

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
        assignedClass: "8",
        assignedSection: "A",
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
      "staffId,name,jobTitle,dept,subject,qualification,email,assignedClass,assignedSection,phone,status\n" +
      "VLS-107,Anjali Sharma,Teacher,Mathematics,Mathematics,M.Sc Maths B.Ed,anjali.sharma@vidyaloop.local,8,A,+91 9811003301,Active\n" +
      "VLS-108,Rohan Sen,Teacher,Science,Physics,M.Sc Physics B.Ed,rohan.sen@vidyaloop.local,10,B,+91 9811003302,Active\n" +
      "VLS-109,Sunita Kulkarni,Front Office,Administration,Front Office,B.A,sunita.k@vidyaloop.local,,,+91 9811003303,Inactive";

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
        assignedClass: rowObj.assignedClass || rowObj.cls || undefined,
        assignedSection: rowObj.assignedSection || rowObj.section || undefined,
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

  // Handle Bulk CSV Submission: Immediately close CSV import modal window and refresh table
  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    setSubmitting(true);
    try {
      const res = await api.bulkCreateStaff(validRows);
      toast.success(`Successfully imported ${res.successCount} staff members into database!`);
      
      // Close the bulk import window immediately
      setShowBulkModal(false);
      setParsedRows([]);
      setCsvRaw("");
      fetchStaff();

      // If credentials were generated, pop up clean standalone credentials summary window
      if (res && res.credentials && res.credentials.length > 0) {
        setBulkCredentialsReport(res.credentials);
      }
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
        eyebrow="SCHOOL ADMIN · STAFF DIRECTORY"
        title="Staff & Faculty Directory"
        subtitle="Manage teachers, Class Teacher assignments, administrative personnel, and system roles."
        right={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <Upload className="h-3.5 w-3.5 text-[#29ABE2]" /> Bulk CSV Import
            </button>

            <button
              onClick={() => setShowSingleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-xs font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Single Staff
            </button>
          </div>
        }
      />

      {/* Filter and stats */}
      <div className="glass rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search staff name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/80 border border-slate-200 text-xs outline-none focus:border-[#29ABE2]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-[160px] h-9 text-xs rounded-full bg-white">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {depts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[130px] h-9 text-xs rounded-full bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <ExportButton
              data={staffList}
              filename="staff_directory"
              columns={[
                { label: "Staff ID", key: "staffId" },
                { label: "Name", key: "name" },
                { label: "Job Title", key: "jobTitle" },
                { label: "Department", key: "dept" },
                { label: "Subject", key: "subject" },
                { label: "Assigned Class", key: "assignedClass" },
                { label: "Assigned Section", key: "assignedSection" },
                { label: "Email", key: "email" },
                { label: "Status", key: "status" },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#29ABE2]" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-slate-500">
          No staff members found matching your query.
        </div>
      ) : (
        /* Staff Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="glass rounded-2xl p-5 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white font-bold text-sm shadow-sm">
                      {staff.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-sm leading-snug">{staff.name}</h3>
                      <span className="font-mono text-[11px] font-semibold text-[#29ABE2]">{staff.staffId}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleStatus(e, staff)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                      staff.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {staff.status || "Active"}
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Role / Job Title:</span>
                    <span className="font-semibold text-slate-800">{staff.jobTitle}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-800">{staff.dept || "General"}</span>
                  </div>
                  {staff.subject && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500">Subject:</span>
                      <span className="font-semibold text-slate-800">{staff.subject}</span>
                    </div>
                  )}

                  {staff.assignedClass && (
                    <div className="flex items-center justify-between text-slate-600 pt-1">
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Shield className="h-3.5 w-3.5 text-[#29ABE2]" /> Class Teacher:
                      </span>
                      <span className="font-bold text-[#0c6a99] bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full text-[11px]">
                        Class {staff.assignedClass}-{staff.assignedSection || "A"}
                      </span>
                    </div>
                  )}

                  {staff.email && (
                    <div className="flex items-center justify-between text-slate-600 truncate pt-1">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[170px]">{staff.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Staff Add Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Add Single Staff Member</h3>
            <p className="text-xs text-slate-500 mb-4">Fill in member details. Assigning Class Teacher role isolates student access to that class.</p>

            <form onSubmit={handleSingleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Staff ID *</label>
                  <input
                    type="text"
                    required
                    value={singleForm.staffId}
                    onChange={(e) => setSingleForm({ ...singleForm, staffId: e.target.value.toUpperCase() })}
                    placeholder="e.g. VLS-106"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 uppercase font-mono outline-none focus:border-[#29ABE2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={singleForm.name}
                    onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                    placeholder="e.g. Anjali Sharma"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#29ABE2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Job Title *</label>
                  <Select value={singleForm.jobTitle} onValueChange={(val) => setSingleForm({ ...singleForm, jobTitle: val })}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TITLES.map((jt) => (
                        <SelectItem key={jt} value={jt}>{jt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department</label>
                  <Select value={singleForm.dept} onValueChange={(val) => setSingleForm({ ...singleForm, dept: val })}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class Teacher Assignment Section */}
              {singleForm.jobTitle === "Teacher" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Class Teacher Assignment (Class)</label>
                    <Select
                      value={singleForm.assignedClass || "none"}
                      onValueChange={(val) => setSingleForm({ ...singleForm, assignedClass: val === "none" ? "" : val })}
                    >
                      <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-white">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (General Subject Teacher)</SelectItem>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                          <SelectItem key={c} value={c}>Class {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Section</label>
                    <Select
                      value={singleForm.assignedSection || "A"}
                      onValueChange={(val) => setSingleForm({ ...singleForm, assignedSection: val })}
                    >
                      <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-white">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D", "E"].map((s) => (
                          <SelectItem key={s} value={s}>Section {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Subject Taught</label>
                  <input
                    type="text"
                    value={singleForm.subject}
                    onChange={(e) => setSingleForm({ ...singleForm, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#29ABE2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Qualification</label>
                  <input
                    type="text"
                    value={singleForm.qualification}
                    onChange={(e) => setSingleForm({ ...singleForm, qualification: e.target.value })}
                    placeholder="e.g. M.Sc, B.Ed"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#29ABE2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={singleForm.email}
                    onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                    placeholder="teacher@school.edu.in"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#29ABE2]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={singleForm.phone}
                    onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                    placeholder="+91 9811002233"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#29ABE2]"
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
          </div>
        </div>
      )}

      {/* Bulk CSV Modal Window */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Bulk Import Staff via CSV</h3>
            <p className="text-xs text-slate-500 mb-4">Upload a CSV file or paste formatted CSV content to add multiple staff members at once.</p>

            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-5 w-5 text-[#0c6a99] shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">1. Download CSV Sample Template</div>
                    <div className="text-[11px] text-slate-500">Headers: staffId, name, jobTitle, dept, subject, qualification, email, assignedClass, assignedSection</div>
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
                          <th className="p-2 text-left">Assigned Class</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className={`border-t border-slate-100 ${r.isValid ? "bg-emerald-50/30" : "bg-rose-50/40"}`}>
                            <td className="p-2 font-mono">{r.staffId || "—"}</td>
                            <td className="p-2 font-medium">{r.name || "—"}</td>
                            <td className="p-2 font-semibold text-[#0c6a99]">{r.jobTitle}</td>
                            <td className="p-2 font-mono">{r.assignedClass ? `${r.assignedClass}-${r.assignedSection || "A"}` : "—"}</td>
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
                  onClick={() => { setShowBulkModal(false); setParsedRows([]); setCsvRaw(""); }}
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

      {/* Standalone Generated Bulk Credentials Report Modal */}
      {bulkCredentialsReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">Bulk Teacher Accounts & Credentials Created!</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Teacher accounts have been generated for all imported teachers. You can copy or distribute these login credentials.
            </p>

            <div className="overflow-x-auto max-h-[220px] thin-scroll rounded-xl border border-slate-200 bg-slate-50/50 mb-5">
              <table className="min-w-full text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5 text-left font-sans">Staff ID</th>
                    <th className="p-2.5 text-left font-sans">Teacher Name</th>
                    <th className="p-2.5 text-left font-sans">Username</th>
                    <th className="p-2.5 text-left font-sans">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkCredentialsReport.map((c, idx) => (
                    <tr key={idx} className="border-t border-slate-200 bg-white">
                      <td className="p-2.5 font-bold text-[#29ABE2]">{c.staffId}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-900">{c.name}</td>
                      <td className="p-2.5 text-slate-700">{c.username}</td>
                      <td className="p-2.5 font-bold text-slate-900">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const txt = bulkCredentialsReport
                    .map((c) => `Staff ID: ${c.staffId} | Name: ${c.name} | Username: ${c.username} | Password: ${c.password}`)
                    .join("\n");
                  navigator.clipboard.writeText(txt);
                  toast.success("Copied all imported teacher credentials to clipboard!");
                }}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Copy All Credentials
              </button>
              <button
                onClick={() => setBulkCredentialsReport(null)}
                className="px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Teacher Created Credentials Modal */}
      {createdTeacherCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">Teacher Account & Credentials Created!</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              A teacher account has been auto-generated for portal access. Provide these credentials to the teacher.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs mb-5 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Teacher Name:</span>
                <span className="font-bold text-slate-900 font-sans">{createdTeacherCreds.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Staff ID / Username:</span>
                <span className="font-bold text-[#29ABE2]">{createdTeacherCreds.username}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Email:</span>
                <span className="font-bold text-slate-800">{createdTeacherCreds.email}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans font-bold">Class Teacher Scope:</span>
                <span className="font-bold text-[#0c6a99] font-sans">
                  {createdTeacherCreds.assignedClass ? `Class ${createdTeacherCreds.assignedClass}-${createdTeacherCreds.assignedSection || "A"}` : "None"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans font-bold">Password:</span>
                <span className="font-bold text-slate-900">{createdTeacherCreds.password}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Teacher Name: ${createdTeacherCreds.name}\nUsername: ${createdTeacherCreds.username}\nEmail: ${createdTeacherCreds.email}\nPassword: ${createdTeacherCreds.password}`);
                  toast.success("Teacher credentials copied to clipboard!");
                }}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Copy Credentials
              </button>
              <button
                onClick={() => {
                  setCreatedTeacherCreds(null);
                  setShowSingleModal(false);
                }}
                className="px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}