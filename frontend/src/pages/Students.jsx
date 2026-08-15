import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Search, Plus, ChevronRight, Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, UserPlus, Calendar, User, Phone, Mail, MapPin, Hash, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

const SESSIONS_LIST = ["2024-2025", "2023-2024", "2022-2023", "2021-2022", "2020-2025"];

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("all");
  const [sec, setSec] = useState("all");
  const [session, setSession] = useState("all");
  const [status, setStatus] = useState("all");

  // Modals state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Single Student Form (Academic Session & Batch included)
  const [singleForm, setSingleForm] = useState({
    admNo: "",
    name: "",
    cls: "8",
    section: "A",
    roll: "",
    session: "2024-2025",
    batch: "2020-2025",
    dob: "",
    bloodGroup: "B+",
    emergency: "",
    address: "",
    fatherName: "",
    fatherEmail: "",
    fatherPhone: "",
    motherName: "",
  });

  // Bulk Import State
  const [csvRaw, setCsvRaw] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({ search: q, cls, section: sec, session, status });
      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data?.students?.students)
        ? data.students.students
        : [];

      setStudents(
        rawList.map((s) => ({
          id: s.id,
          admNo: s.admNo,
          name: s.name,
          class: s.cls,
          section: s.section,
          roll: s.roll,
          session: s.session || "2024-2025",
          batch: s.batch || "2020-2025",
          status: s.status || "Active",
          schoolName: s.school?.name || "",
        }))
      );
    } catch (err) {
      toast.error("Failed to load students from database");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [q, cls, sec, session, status]);

  useEffect(() => {
    fetchStudents();

    // Re-fetch when SuperAdmin changes active school in topbar
    const handleScopeChange = () => fetchStudents();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchStudents]);

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class))).sort(), [students]);
  const sections = useMemo(() => Array.from(new Set(students.map((s) => s.section))).sort(), [students]);

  // Handle Single Student Creation
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleForm.admNo || !singleForm.name || !singleForm.cls || !singleForm.section) {
      toast.error("Please fill in required fields (Adm. No, Full Name, Class, Section).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...singleForm,
        roll: singleForm.roll ? parseInt(singleForm.roll, 10) : 1,
        fatherEmail: singleForm.fatherEmail?.trim() || undefined,
        parentEmail: singleForm.fatherEmail?.trim() || undefined,
        dob: singleForm.dob || undefined,
        bloodGroup: singleForm.bloodGroup || undefined,
        emergency: singleForm.emergency || undefined,
        address: singleForm.address || undefined,
        fatherName: singleForm.fatherName || undefined,
        fatherPhone: singleForm.fatherPhone || singleForm.emergency || undefined,
        motherName: singleForm.motherName || undefined,
      };
      await api.createStudent(payload);
      toast.success(`Student "${singleForm.name}" created successfully for Session ${payload.session}!`);
      setShowSingleModal(false);
      fetchStudents();
      setSingleForm({
        admNo: "",
        name: "",
        cls: "8",
        section: "A",
        roll: "",
        session: "2024-2025",
        batch: "2020-2025",
        dob: "",
        bloodGroup: "B+",
        emergency: "",
        address: "",
        fatherName: "",
        fatherEmail: "",
        fatherPhone: "",
        motherName: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Template Downloader
  const downloadSampleCsv = () => {
    const csvContent =
      "admNo,name,cls,section,roll,session,batch,dob,bloodGroup,emergency,address,fatherName,fatherEmail,fatherPhone,motherName\n" +
      "VL2026101,Aarav Malhotra,8,A,1,2024-2025,2020-2025,2012-05-14,B+,+91 9811002201,Sector 45 Gurugram,Rajesh Malhotra,rajesh.malhotra@email.com,+91 9811002201,Priya Malhotra\n" +
      "VL2026102,Diya Sharma,8,A,2,2023-2024,2019-2024,2012-08-22,O+,+91 9811002202,Vasant Kunj Delhi,Sunil Sharma,sunil.sharma@email.com,+91 9811002202,Meena Sharma\n" +
      "VL2026103,Rohan Verma,9,B,5,2024-2025,2020-2025,2011-11-10,A+,+91 9811002203,Sector 62 Noida,Karan Verma,karan.verma@email.com,+91 9811002203,Suman Verma";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vidyaloop_student_bulk_import_template.csv");
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

      const admNo = rowObj.admNo || rowObj.admissionNo || "";
      const name = rowObj.name || rowObj.studentName || "";
      const clsVal = rowObj.cls || rowObj.class || "8";
      const secVal = rowObj.section || rowObj.sec || "A";

      const isValid = Boolean(admNo && name && clsVal && secVal);

      rows.push({
        admNo,
        name,
        cls: clsVal,
        section: secVal,
        roll: parseInt(rowObj.roll, 10) || 1,
        session: rowObj.session || "2024-2025",
        batch: rowObj.batch || "2020-2025",
        dob: rowObj.dob || undefined,
        bloodGroup: rowObj.bloodGroup || undefined,
        emergency: rowObj.emergency || undefined,
        address: rowObj.address || undefined,
        fatherName: rowObj.fatherName || undefined,
        fatherEmail: rowObj.fatherEmail || undefined,
        fatherPhone: rowObj.fatherPhone || rowObj.emergency || undefined,
        motherName: rowObj.motherName || undefined,
        isValid,
        errorMsg: !isValid ? "Missing Adm No, Name, Class, or Section" : "",
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
      const res = await api.bulkCreateStudents(validRows);
      toast.success(`Successfully imported ${res.successCount} students into database!`);
      setImportSummary(res);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to execute bulk student import");
    } finally {
      setSubmitting(false);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("vidyaloop_user") || "{}");
  const isTeacherRole = currentUser?.role === "teacher";

  return (
    <div data-testid="students-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Students & Batches"
        subtitle={`${students.length} students enrolled in school database.`}
        right={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ExportButton testId="students-export" />
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
              data-testid="add-student-btn"
              onClick={() => setShowSingleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Student
            </button>
          </div>
        }
      />

      {isTeacherRole && (
        <div className="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-3.5 mb-5 flex items-center gap-3 text-xs text-[#0c6a99] font-medium shadow-sm">
          <Shield className="h-4 w-4 text-[#29ABE2] shrink-0" />
          <span>
            <strong className="font-bold">Class Teacher Scope Active:</strong> You are authorized to view students belonging to your assigned Class & Section as designated by your School Admin.
          </span>
        </div>
      )}

      <div className="glass rounded-2xl p-3 sm:p-5 reveal space-y-4">
        {/* Filter Controls Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              data-testid="students-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by student name, roll no, or admission no..."
              className="w-full bg-transparent outline-none text-xs sm:text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* Session / Batch Filter Dropdown */}
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger data-testid="filter-session" className="w-full sm:w-[150px] rounded-full bg-white/80 border-blue-200 text-xs">
                <SelectValue placeholder="Session / Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {SESSIONS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>
                    Session {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger data-testid="filter-class" className="w-full sm:w-[130px] rounded-full bg-white/80 text-xs">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sec} onValueChange={setSec}>
              <SelectTrigger data-testid="filter-section" className="w-full sm:w-[130px] rounded-full bg-white/80 text-xs">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="filter-status" className="w-full sm:w-[130px] rounded-full bg-white/80 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Loading students from database...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Adm. No.</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Academic Session</th>
                    <th className="px-5 py-3 font-semibold">Class & Sec</th>
                    <th className="px-5 py-3 font-semibold">Roll No.</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      data-testid={`student-row-${s.admNo}`}
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="border-t border-slate-100 hover:bg-[#f3faff] transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{s.admNo}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 group-hover:text-[#0c6a99] transition">
                        {s.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                          <Calendar className="h-3 w-3 text-[#29ABE2]" /> {s.session}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-semibold">{s.class}-{s.section}</td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{s.roll}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 group-hover:text-[#0c6a99] text-right">
                        <ChevronRight className="h-4 w-4 inline" />
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No student records found in database matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Responsive Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {students.map((s) => (
                <div
                  key={s.id}
                  data-testid={`student-card-${s.admNo}`}
                  onClick={() => navigate(`/students/${s.id}`)}
                  className="glass-soft rounded-2xl p-4 transition hover:border-blue-200 active:scale-[0.99] cursor-pointer space-y-2.5 border border-slate-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Adm: {s.admNo}</span> · <span>Roll #{s.roll}</span>
                      </div>
                      <div className="font-bold text-slate-800 text-[15px] mt-0.5 truncate text-[#0c6a99]">
                        {s.name}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Class {s.class}-{s.section}
                      </span>
                      <span className="font-semibold text-[#0c6a99] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#29ABE2]" /> {s.session}
                      </span>
                    </div>

                    <div className="text-[#0c6a99] font-bold flex items-center gap-1 text-xs">
                      View Profile <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs glass-soft rounded-2xl p-4">
                  No student records found matching filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Single Student Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Student Registration</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#29ABE2]" /> Add New Student
                </h3>
              </div>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4 sm:space-y-5 mt-4">
              <div className="bg-blue-50/60 p-3 sm:p-4 rounded-2xl border border-blue-100 space-y-3">
                <div className="text-xs font-bold text-[#0c6a99] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#29ABE2]" /> Academic Session & Class Assignment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Academic Session *</label>
                    <select
                      value={singleForm.session}
                      onChange={(e) => setSingleForm({ ...singleForm, session: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#29ABE2] bg-white text-[#0c6a99]"
                    >
                      {SESSIONS_LIST.map((s) => (
                        <option key={s} value={s}>Session {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 8"
                      value={singleForm.cls}
                      onChange={(e) => setSingleForm({ ...singleForm, cls: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Section *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A"
                      value={singleForm.section}
                      onChange={(e) => setSingleForm({ ...singleForm, section: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VL2026001"
                      value={singleForm.admNo}
                      onChange={(e) => setSingleForm({ ...singleForm, admNo: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Roll Number</label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      value={singleForm.roll}
                      onChange={(e) => setSingleForm({ ...singleForm, roll: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#29ABE2]" /> Personal Details
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter student's full name"
                    value={singleForm.name}
                    onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-[#29ABE2]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={singleForm.dob}
                      onChange={(e) => setSingleForm({ ...singleForm, dob: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Blood Group</label>
                    <select
                      value={singleForm.bloodGroup}
                      onChange={(e) => setSingleForm({ ...singleForm, bloodGroup: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] bg-white"
                    >
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9811002201"
                      value={singleForm.emergency}
                      onChange={(e) => setSingleForm({ ...singleForm, emergency: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="House No., Street, City, Pincode"
                    value={singleForm.address}
                    onChange={(e) => setSingleForm({ ...singleForm, address: e.target.value })}
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
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Student to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-[#0c6a99] uppercase tracking-wider">Bulk Data Import</div>
                <h3 className="font-bold text-base sm:text-xl text-slate-900 mt-0.5 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-[#29ABE2]" /> Bulk Import Students via CSV
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
                    <div className="text-[11px] text-slate-500">Includes headers: admNo, name, cls, section, session, batch, fatherName, etc.</div>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">2. Upload CSV File or Paste Raw Text</label>
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
                    <span className="text-slate-700">Parsed Student Records ({parsedRows.length})</span>
                    <span className="text-emerald-700">{parsedRows.filter(r => r.isValid).length} Valid Records</span>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] thin-scroll rounded-xl border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2 text-left">Adm No.</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Class-Sec</th>
                          <th className="p-2 text-left">Session</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className={`border-t border-slate-100 ${r.isValid ? "bg-emerald-50/30" : "bg-rose-50/40"}`}>
                            <td className="p-2 font-mono">{r.admNo || "—"}</td>
                            <td className="p-2 font-medium">{r.name || "—"}</td>
                            <td className="p-2">{r.cls}-{r.section}</td>
                            <td className="p-2 font-semibold text-[#0c6a99]">{r.session}</td>
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
                  className="px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Import Valid Students to DB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}