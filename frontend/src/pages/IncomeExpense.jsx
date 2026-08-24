import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, DollarSign, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function IncomeExpense() {
  const { user } = useAuth();
  const role = user?.role || "superAdmin";

  const [activeSchoolId, setActiveSchoolId] = useState(() => {
    return localStorage.getItem("vidyaloop_active_school_id") || "all";
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    type: "INCOME",
    category: "Tuition Fees",
    title: "",
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    notes: "",
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const effectiveSchoolId = (role !== "superAdmin" && user?.schoolId) ? user.schoolId : activeSchoolId;
      const res = await api.getFinanceRecords({ schoolId: effectiveSchoolId });
      if (res?.records && Array.isArray(res.records)) {
        setRecords(res.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn("Could not fetch finance records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchRecords();

    const handleScopeChange = () => {
      const newScope = localStorage.getItem("vidyaloop_active_school_id") || "all";
      setActiveSchoolId(newScope);
    };
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [activeSchoolId, user]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = (r.title || "").toLowerCase().includes(search.toLowerCase()) || (r.voucherNo || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesCat = categoryFilter === "all" || r.category === categoryFilter;
      return matchesSearch && matchesType && matchesCat;
    });
  }, [records, search, typeFilter, categoryFilter]);

  const summary = useMemo(() => {
    const income = filteredRecords.filter((r) => r.type === "INCOME").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const expense = filteredRecords.filter((r) => r.type === "EXPENSE").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const net = income - expense;
    return {
      income,
      expense,
      net,
    };
  }, [filteredRecords]);

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      toast.error("Please fill in voucher title and amount");
      return;
    }

    try {
      const effectiveSchoolId = (role !== "superAdmin" && user?.schoolId) ? user.schoolId : activeSchoolId;
      await api.createFinanceRecord({
        schoolId: effectiveSchoolId,
        type: form.type,
        category: form.category,
        title: form.title,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });

      toast.success(`${form.type === "INCOME" ? "Income" : "Expense"} voucher saved to MongoDB database!`);
      setForm({ type: "INCOME", category: "Tuition Fees", title: "", amount: "", paymentMethod: "BANK_TRANSFER", notes: "" });
      setOpenModal(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save financial voucher");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Income & Expense Management"
        subtitle={activeSchoolId === "all" ? "Aggregated revenue ledgers, student fee collections, staff payroll outflows, and vouchers across All Schools." : `MongoDB transactions & financial ledgers for Scope: ${activeSchoolId}`}
        action={
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Voucher
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Revenue (Income)</span>
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center"><ArrowUpRight className="h-4 w-4" /></div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">₹{summary.income.toLocaleString("en-IN")}</div>
          <div className="text-[12px] text-slate-500 mt-1">Student Fees & Revenue Vouchers</div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 grid place-items-center"><ArrowDownRight className="h-4 w-4" /></div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">₹{summary.expense.toLocaleString("en-IN")}</div>
          <div className="text-[12px] text-slate-500 mt-1">Staff Payroll & Operating Outflows</div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-[#29ABE2]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Surplus Balance</span>
            <div className="h-8 w-8 rounded-full bg-blue-50 text-[#29ABE2] grid place-items-center"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className={`font-display text-2xl font-bold mt-2 ${summary.net >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            ₹{summary.net.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-slate-500 mt-1">Net Operating Position</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher title, receipt or staff/student name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80"
            >
              <option value="all">All Types</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expense Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80"
            >
              <option value="all">All Categories</option>
              <option value="Tuition / Student Fees">Tuition / Student Fees</option>
              <option value="Salaries & Compensation">Salaries & Compensation</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Utilities">Utilities</option>
              <option value="Grants & Donations">Grants & Donations</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto" />
            <div className="text-slate-700 font-semibold text-[15px]">No Transactions Found</div>
            <p className="text-slate-400 text-[12px] max-w-sm mx-auto">
              There are no fee collection payments, payroll outflows, or manual vouchers recorded in MongoDB for this school scope.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  <th className="pb-3 px-3">Ref / Voucher #</th>
                  <th className="pb-3 px-3">Title & Details</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-white/60 transition">
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-600">{r.voucherNo || `VCH-${r.id.slice(-6)}`}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{r.title}</div>
                      <div className="text-[11px] text-slate-500">{r.recordedBy ? `By ${r.recordedBy}` : "System"}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600">{r.category}</td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.type === "INCOME" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {r.type === "INCOME" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{r.date ? new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                    <td className="py-3.5 px-3 text-slate-600">{r.paymentMethod || "BANK_TRANSFER"}</td>
                    <td className={`py-3.5 px-3 text-right font-mono font-bold ${r.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                      {r.type === "INCOME" ? "+" : "-"}₹{Number(r.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Voucher Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Record Financial Voucher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVoucher} className="space-y-4 py-2 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voucher Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="INCOME">INCOME (Revenue)</option>
                  <option value="EXPENSE">EXPENSE (Outflow)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Tuition Fees">Tuition Fees</option>
                  <option value="Transport Fees">Transport Fees</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Grants & Donations">Grants & Donations</option>
                  <option value="Events & Sports">Events & Sports</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Voucher Title / Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Science Lab Consumables or Term 2 Fee Collection"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 45000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                <option value="ONLINE">ONLINE (Gateway/UPI)</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="CASH">CASH</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">Save Voucher</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
