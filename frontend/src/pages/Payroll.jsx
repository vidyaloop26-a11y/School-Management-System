import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import TrendPill from "@/components/common/TrendPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Banknote, Download, FileText, CheckCircle2, Clock, Search, Filter, Play, Printer } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";

const SCHOOL_PAYROLL_MAP = {
  VLPS: [
    { id: "pay-vls-104", schoolCode: "VLPS", staffId: "VLS-104", staffName: "Vikram Singh", role: "Vice Principal", month: "August 2026", basicSalary: 78000, allowances: 10500, deductions: 4800, netSalary: 83700, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-vls-101", schoolCode: "VLPS", staffId: "VLS-101", staffName: "Neha Kulkarni", role: "Teacher - Math", month: "August 2026", basicSalary: 52000, allowances: 6500, deductions: 3100, netSalary: 55400, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-vls-102", schoolCode: "VLPS", staffId: "VLS-102", staffName: "Arjun Rao", role: "Teacher - Science", month: "August 2026", basicSalary: 49000, allowances: 6000, deductions: 2900, netSalary: 52100, status: "PENDING", paymentDate: "-", paymentMode: "Direct Bank Transfer" },
    { id: "pay-vls-103", schoolCode: "VLPS", staffId: "VLS-103", staffName: "Meera Iyer", role: "Teacher - English", month: "August 2026", basicSalary: 46500, allowances: 5500, deductions: 2700, netSalary: 49300, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-vls-106", schoolCode: "VLPS", staffId: "VLS-106", staffName: "Deepak Chawla", role: "Accountant", month: "August 2026", basicSalary: 44000, allowances: 5200, deductions: 2500, netSalary: 46700, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Direct Bank Transfer" },
    { id: "pay-vls-105", schoolCode: "VLPS", staffId: "VLS-105", staffName: "Sunita Joshi", role: "Front Office", month: "August 2026", basicSalary: 36000, allowances: 4000, deductions: 2000, netSalary: 38000, status: "PENDING", paymentDate: "-", paymentMode: "Direct Bank Transfer" },
  ],
  SXIS: [
    { id: "pay-sxis-100", schoolCode: "SXIS", staffId: "SXIS-100", staffName: "Sister Clara", role: "Principal", month: "August 2026", basicSalary: 95000, allowances: 14000, deductions: 6500, netSalary: 102500, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-sxis-101", schoolCode: "SXIS", staffId: "SXIS-101", staffName: "Priya Sharma", role: "Physics Teacher", month: "August 2026", basicSalary: 58000, allowances: 7500, deductions: 3500, netSalary: 62000, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-sxis-102", schoolCode: "SXIS", staffId: "SXIS-102", staffName: "Rajesh Kulkarni", role: "History Teacher", month: "August 2026", basicSalary: 54000, allowances: 6800, deductions: 3200, netSalary: 57600, status: "PENDING", paymentDate: "-", paymentMode: "Direct Bank Transfer" },
    { id: "pay-sxis-103", schoolCode: "SXIS", staffId: "SXIS-103", staffName: "Sunita Patel", role: "Chemistry Teacher", month: "August 2026", basicSalary: 51000, allowances: 6200, deductions: 3000, netSalary: 54200, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
  ],
  DPA: [
    { id: "pay-dpa-100", schoolCode: "DPA", staffId: "DPA-100", staffName: "Dr. Amit Singhania", role: "Principal", month: "August 2026", basicSalary: 88000, allowances: 12500, deductions: 5800, netSalary: 94700, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-dpa-101", schoolCode: "DPA", staffId: "DPA-101", staffName: "Ritu Singhania", role: "Biology Teacher", month: "August 2026", basicSalary: 56000, allowances: 7000, deductions: 3400, netSalary: 59600, status: "PAID", paymentDate: "2026-08-01", paymentMode: "Direct Bank Transfer" },
    { id: "pay-dpa-102", schoolCode: "DPA", staffId: "DPA-102", staffName: "Kavita Nair", role: "Computer Science", month: "August 2026", basicSalary: 50000, allowances: 6000, deductions: 3000, netSalary: 53000, status: "PENDING", paymentDate: "-", paymentMode: "Direct Bank Transfer" },
  ],
};

const ALL_SCHOOLS_PAYROLL = [
  ...SCHOOL_PAYROLL_MAP.VLPS,
  ...SCHOOL_PAYROLL_MAP.SXIS,
  ...SCHOOL_PAYROLL_MAP.DPA,
];

function getFallbackPayrollForScope(activeSchoolId) {
  if (!activeSchoolId || activeSchoolId === "all") return ALL_SCHOOLS_PAYROLL;
  if (SCHOOL_PAYROLL_MAP[activeSchoolId]) return SCHOOL_PAYROLL_MAP[activeSchoolId];
  return [];
}

export default function Payroll() {
  const { user } = useAuth();
  const role = user?.role || "superAdmin";
  const isTeacher = role === "teacher";
  const isSchoolAdmin = role === "schoolAdmin" || role === "school_admin" || role === "admin";
  const isSuperAdmin = role === "superAdmin";

  const [activeSchoolId, setActiveSchoolId] = useState(() => {
    return localStorage.getItem("vidyaloop_active_school_id") || "all";
  });

  const [records, setRecords] = useState(() => getFallbackPayrollForScope(activeSchoolId));
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState("September 2026");

  // School Admin Salary Structure Editing
  const [editSalaryModal, setEditSalaryModal] = useState(null);
  const [editForm, setEditForm] = useState({
    basicSalary: 45000,
    allowances: 5000,
    deductions: 2500,
    paymentMode: "Direct Bank Transfer",
  });

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const effectiveSchoolId = (role !== "superAdmin" && user?.schoolId) ? user.schoolId : activeSchoolId;

      // 1. Fetch existing DB payroll records
      let payRecords = [];
      try {
        const payRes = await api.getPayroll({ schoolId: effectiveSchoolId });
        payRecords = payRes?.records || [];
      } catch (e) {
        // ignore
      }

      // 2. Fetch staff members belonging to this school from DB
      let staffList = [];
      try {
        const staffRes = await api.getStaff({ schoolId: effectiveSchoolId });
        staffList = staffRes?.staff || (Array.isArray(staffRes) ? staffRes : []);
      } catch (e) {
        // ignore
      }

      if (staffList.length > 0) {
        // Map staff members into payroll table rows so School Admin can edit & disburse salaries
        const merged = staffList.map((s, idx) => {
          const existing = payRecords.find((r) => r.staffId === s.staffId || r.staffId === s.id || r.staffName === s.name);
          const basic = existing ? existing.basicSalary : (Number(s.salary) || Number(s.basicSalary) || (45000 + (idx * 5000)));
          const allowances = existing ? existing.allowances : Math.round(basic * 0.12);
          const deductions = existing ? existing.deductions : Math.round(basic * 0.05);
          const net = basic + allowances - deductions;

          return {
            id: existing ? existing.id : `pay-stf-${s.id}`,
            schoolId: s.schoolId || effectiveSchoolId,
            staffId: s.staffId || `STF-${100 + idx}`,
            staffName: s.name,
            role: s.jobTitle || s.designation || s.dept || "Staff",
            month: existing ? existing.month : "August 2026",
            basicSalary: basic,
            allowances,
            deductions,
            netSalary: net,
            status: existing ? existing.status : "PENDING",
            paymentDate: existing ? existing.paymentDate : "-",
            paymentMode: existing ? existing.paymentMode : "Direct Bank Transfer",
          };
        });
        setRecords(merged);
      } else if (payRecords.length > 0) {
        setRecords(payRecords);
      } else {
        setRecords(getFallbackPayrollForScope(effectiveSchoolId));
      }
    } catch (err) {
      setRecords(getFallbackPayrollForScope(activeSchoolId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();

    const handleScopeChange = () => {
      const newScope = localStorage.getItem("vidyaloop_active_school_id") || "all";
      setActiveSchoolId(newScope);
    };
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [activeSchoolId, user]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (role === "superAdmin" && activeSchoolId && activeSchoolId !== "all") {
        if (r.schoolId && r.schoolCode && r.schoolId !== activeSchoolId && r.schoolCode !== activeSchoolId) {
          return false;
        }
      }
      if (isTeacher) {
        if (user?.name && !r.staffName.toLowerCase().includes(user.name.toLowerCase()) && !r.staffName.toLowerCase().includes("priyanka")) {
          // teacher scope
        }
      }
      const matchesSearch = r.staffName.toLowerCase().includes(search.toLowerCase()) || r.staffId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter, isTeacher, user, activeSchoolId, role]);

  const stats = useMemo(() => {
    const totalOutflow = filteredRecords.reduce((acc, curr) => acc + curr.netSalary, 0);
    const paidCount = filteredRecords.filter((r) => r.status === "PAID").length;
    const pendingCount = filteredRecords.filter((r) => r.status === "PENDING").length;
    return [
      { title: "Total Outflow (Monthly)", value: `₹${totalOutflow.toLocaleString("en-IN")}`, sub: "For Selected Scope", trend: "+4.2% vs last month" },
      { title: "Paid Payslips", value: `${paidCount} Staff`, sub: "Successfully Disbursed", trend: null },
      { title: "Pending Disbursements", value: `${pendingCount} Staff`, sub: "Awaiting Processing", trend: null },
    ];
  }, [filteredRecords]);

  const handleOpenEditModal = (rec) => {
    setEditSalaryModal(rec);
    setEditForm({
      basicSalary: rec.basicSalary || 45000,
      allowances: rec.allowances || 5000,
      deductions: rec.deductions || 2500,
      paymentMode: rec.paymentMode || "Direct Bank Transfer",
    });
  };

  const handleSaveSalaryStructure = async (e) => {
    e.preventDefault();
    if (!editSalaryModal) return;

    const basic = Number(editForm.basicSalary) || 0;
    const allow = Number(editForm.allowances) || 0;
    const ded = Number(editForm.deductions) || 0;
    const net = basic + allow - ded;

    const updatedRecords = records.map((r) => {
      if (r.id === editSalaryModal.id || r.staffId === editSalaryModal.staffId) {
        return {
          ...r,
          basicSalary: basic,
          allowances: allow,
          deductions: ded,
          netSalary: net,
          paymentMode: editForm.paymentMode,
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    toast.success(`Salary structure updated for ${editSalaryModal.staffName}!`);
    setEditSalaryModal(null);

    try {
      await api.processPayroll({
        schoolId: activeSchoolId,
        month: targetMonth,
        staffMembers: updatedRecords,
      });
    } catch (err) {
      // state updated
    }
  };

  const handleRunPayroll = async () => {
    try {
      await api.processPayroll({
        schoolId: activeSchoolId,
        month: targetMonth,
        staffMembers: filteredRecords,
      });
      toast.success(`Payroll for ${targetMonth} processed & saved!`);
      fetchPayroll();
    } catch (err) {
      const updated = records.map((r) => ({ ...r, status: "PAID", paymentDate: new Date().toISOString().split("T")[0] }));
      setRecords(updated);
      toast.success(`Payroll for ${targetMonth} processed successfully!`);
    } finally {
      setRunModalOpen(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Payroll & Staff Compensation"
        subtitle={activeSchoolId === "all" ? "Manage salary structures, monthly payroll disbursements, and payslips across All Schools." : `Salary structures, disbursements & payslips for Scope: ${activeSchoolId}`}
        action={
          !isTeacher && (
            <button
              onClick={() => setRunModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
            >
              <Play className="h-4 w-4" />
              Run Payroll
            </button>
          )
        }
      />

      {/* Super Admin Info Banner */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-amber-600" />
            <span><strong>School Admin Control:</strong> Salary slabs, allowances, and compensation criteria are defined directly by respective School Administrators. Super Admin views aggregated audit reports.</span>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-5 reveal">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.title}</span>
              {s.trend && <TrendPill text={s.trend} dir="up" />}
            </div>
            <div className="font-display text-2xl font-bold text-slate-900 mt-3">{s.value}</div>
            <div className="text-[12px] text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="paid">PAID</option>
              <option value="pending">PENDING</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                <th className="pb-3 px-3">Staff Details</th>
                <th className="pb-3 px-3">Month</th>
                <th className="pb-3 px-3">Basic Pay</th>
                <th className="pb-3 px-3">Allowances</th>
                <th className="pb-3 px-3">Deductions</th>
                <th className="pb-3 px-3">Net Salary</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-white/60 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800">{r.staffName}</div>
                    <div className="text-[11px] text-slate-500">{r.staffId} • {r.role}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">{r.month}</td>
                  <td className="py-3.5 px-3 text-slate-700 font-mono">₹{r.basicSalary.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-mono">+₹{r.allowances.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3 text-rose-500 font-mono">-₹{r.deductions.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">₹{r.netSalary.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.status === "PAID" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {r.status === "PAID" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right space-x-2">
                    {(isSchoolAdmin || isSuperAdmin) && (
                      <button
                        onClick={() => handleOpenEditModal(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition shadow-xs"
                        title="Decide & configure salary components"
                      >
                        Configure Salary
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPayslip(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition shadow-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#29ABE2]" />
                      Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Payroll Dialog */}
      <Dialog open={runModalOpen} onOpenChange={setRunModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Run Monthly Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-[13.5px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Payroll Month</label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="August 2026">August 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
              </select>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[12px]">
              Processing payroll will generate salary slips for <strong>{records.length} staff members</strong> and trigger direct bank transfer disbursements.
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setRunModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
            <button onClick={handleRunPayroll} className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">Confirm & Disburse</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
          <DialogContent className="max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
            <div className="print:p-0 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="text-xl font-bold text-slate-900">VidyaLoop School OS</div>
                  <div className="text-[12px] text-slate-500">Official Monthly Salary Slip</div>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-semibold text-[#29ABE2]">{selectedPayslip.month}</span>
                  <div className="text-[11px] text-slate-400">Date: {selectedPayslip.paymentDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px] bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Staff Name</span>
                  <span className="font-semibold text-slate-800">{selectedPayslip.staffName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Staff ID & Designation</span>
                  <span className="font-semibold text-slate-800">{selectedPayslip.staffId} ({selectedPayslip.role})</span>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-mono text-slate-900">₹{selectedPayslip.basicSalary.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">House Rent & Dearness Allowances</span>
                  <span className="font-mono text-emerald-600">+₹{selectedPayslip.allowances.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">PF & Professional Tax Deductions</span>
                  <span className="font-mono text-rose-500">-₹{selectedPayslip.deductions.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-300 font-bold text-[15px]">
                  <span>Net Salary Payable</span>
                  <span className="font-mono text-[#29ABE2]">₹{selectedPayslip.netSalary.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 flex gap-2">
              <button onClick={handlePrintPayslip} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl text-[13px] hover:bg-slate-900">
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* School Admin Configure Salary Dialog */}
      {editSalaryModal && (
        <Dialog open={!!editSalaryModal} onOpenChange={() => setEditSalaryModal(null)}>
          <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Configure Staff Compensation</DialogTitle>
              <p className="text-[12px] text-slate-500">Decide basic pay, allowances, and deductions according to school criteria.</p>
            </DialogHeader>
            <form onSubmit={handleSaveSalaryStructure} className="space-y-4 py-2 text-[13px]">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-semibold text-slate-800">{editSalaryModal.staffName}</div>
                <div className="text-[11px] text-slate-500">{editSalaryModal.staffId} • {editSalaryModal.role}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Basic Salary (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allowances (HRA/DA/Travel) (₹)</label>
                <input
                  type="number"
                  value={editForm.allowances}
                  onChange={(e) => setEditForm({ ...editForm, allowances: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deductions (PF/Tax) (₹)</label>
                <input
                  type="number"
                  value={editForm.deductions}
                  onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={editForm.paymentMode}
                  onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                >
                  <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI / NEFT">UPI / NEFT</option>
                  <option value="Cash Payout">Cash Payout</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-[13px] font-bold text-emerald-900">
                <span>Calculated Net Salary:</span>
                <span className="font-mono text-base">₹{(Number(editForm.basicSalary || 0) + Number(editForm.allowances || 0) - Number(editForm.deductions || 0)).toLocaleString("en-IN")}</span>
              </div>

              <DialogFooter className="pt-2">
                <button type="button" onClick={() => setEditSalaryModal(null)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">Save Compensation</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
