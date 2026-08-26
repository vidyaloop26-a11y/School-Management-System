import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { useDataStore } from "@/lib/dataStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PARENT_CHILD } from "@/lib/stage2Data";
import { formatINR } from "@/lib/format";
import { Wallet, TrendingUp, AlertCircle, Download, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "sonner";
import api from "@/lib/api";

function AdminView() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState("all");
  const [status, setStatus] = useState("all");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getFinanceRecords({ type: "INCOME" });
      const allRecords = res?.records || [];
      // Filter to fee-collection records only
      const feeRecords = allRecords.filter(
        (r) => r.category?.toLowerCase().includes("fee") || r.category?.toLowerCase().includes("tuition")
      );
      setRecords(feeRecords);
    } catch (err) {
      toast.error("Failed to load fee records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const classes = useMemo(() => Array.from(new Set(records.map((r) => r.classSection || r.title?.split(" ")[0] || "N/A"))).sort(), [records]);

  const rows = useMemo(() => {
    return records.map((r) => ({
      id: r.id,
      admNo: r.voucherNo || r.id,
      name: r.title?.replace("Fee Collection: ", "") || "Student",
      classSection: r.classSection || "N/A",
      term: r.term || "Term 2",
      status: r.status || "Paid",
      due: r.dueDate || "—",
      amount: r.amount || 0,
    })).filter((r) => {
      if (cls !== "all" && r.classSection !== cls) return false;
      if (status !== "all" && r.status.toLowerCase() !== status) return false;
      return true;
    });
  }, [records, cls, status]);

  const totalCollected = rows.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
  const totalDue = rows.filter((r) => r.status !== "Paid").reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = rows.filter((r) => r.status === "Overdue").length;

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN · OPERATIONS"
        title="Fee Collection"
        subtitle="Track term-wise dues, collections, and overdue accounts."
        right={<ExportButton testId="fees-export" />}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div data-testid="fee-stat-collected" className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Total Collected
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatINR(totalCollected)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Across all classes</div>
        </div>
        <div data-testid="fee-stat-due" className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <Wallet className="h-3.5 w-3.5 text-[#29ABE2]" /> Total Due
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatINR(totalDue)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Pending receivables</div>
        </div>
        <div data-testid="fee-stat-overdue" className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Overdue Count
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{overdueCount}</div>
          <div className="text-[12px] text-slate-500 mt-1">Requires immediate follow-up</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl p-4 md:p-5 reveal d3">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mr-auto">Filters</div>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger data-testid="fee-filter-class" className="w-[160px] rounded-full bg-white/80"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="fee-filter-status" className="w-[160px] rounded-full bg-white/80"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
          </div>
        ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Voucher</th>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Payment Method</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid={`fee-row-${r.id}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.admNo}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{formatINR(r.amount)}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.paymentMethod || "Online"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.due}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.recordedBy || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No fee records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-2.5">
          {rows.map((r) => (
            <div key={r.id} data-testid={`fee-card-${r.id}`} className="glass-soft rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-slate-500">{r.admNo}</div>
                  <div className="font-medium text-slate-800 text-[14.5px] mt-0.5 truncate">{r.name}</div>
                </div>
                <div className="font-mono font-semibold text-slate-900">{formatINR(r.amount)}</div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-[13px]">No fee records found.</div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function ParentView() {
  const { parentFees, payParentFeeTerm } = useDataStore();
  const [payingTerm, setPayingTerm] = useState(null);

  const handleConfirmPayment = () => {
    if (payingTerm) {
      payParentFeeTerm(payingTerm.term);
      toast.success(`Payment successful for ${payingTerm.term}! Receipt generated.`);
      setPayingTerm(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="PARENT · FEES"
        title="Fees & Dues"
        subtitle={<>Term-wise breakdown for <span className="font-serif-i text-slate-700">{PARENT_CHILD.name}</span>.</>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal space-y-3">
          {parentFees.map((t, i) => {
            const paid = t.status === "Paid";
            return (
              <div key={i} data-testid={`parent-fee-${t.term.toLowerCase().replace(/\s+/g, "-")}`} className="glass-soft rounded-xl p-5 flex items-center gap-5">
                <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-[20px] font-bold text-slate-900 tracking-tight">{t.term}</div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{t.status}</span>
                  </div>
                  <div className="text-[12.5px] text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{formatINR(t.amount)}</span> · {t.date}
                  </div>
                </div>
                {paid ? (
                  <button
                    data-testid={`receipt-${t.term.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => toast.info(`Viewing receipt for ${t.term}`)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] hover:text-[#0c6a99] transition px-3.5 py-2 text-[12.5px] font-medium text-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </button>
                ) : (
                  <button
                    data-testid="pay-now"
                    onClick={() => setPayingTerm(t)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-[12.5px] font-medium shadow-sm"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Pay Now
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Summary</div>
          <div className="font-display text-[22px] font-bold text-slate-900 mt-1 tracking-tight">This Academic Year</div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Total Billed</span>
              <span className="font-semibold text-slate-800">{formatINR(parentFees.reduce((s, t) => s + t.amount, 0))}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-semibold text-emerald-700">{formatINR(parentFees.filter(t => t.status === "Paid").reduce((s, t) => s + t.amount, 0))}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Outstanding Balance</span>
              <span className="font-semibold text-amber-700">{formatINR(parentFees.filter(t => t.status !== "Paid").reduce((s, t) => s + t.amount, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Now Dialog */}
      <Dialog open={!!payingTerm} onOpenChange={() => setPayingTerm(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Payment Gateway Simulation</DialogTitle>
          </DialogHeader>
          {payingTerm && (
            <div className="space-y-4 py-2">
              <div className="glass-soft rounded-xl p-4 text-[13.5px] space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Student Name:</span>
                  <span className="font-semibold text-slate-800">{PARENT_CHILD.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Term Fee:</span>
                  <span className="font-semibold text-slate-800">{payingTerm.term}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200 font-bold">
                  <span>Amount Payable:</span>
                  <span className="text-[#29ABE2] text-[16px]">{formatINR(payingTerm.amount)}</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 text-center">
                Clicking confirm will simulate instantaneous payment authorization and update fee records.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayingTerm(null)} className="rounded-full">Cancel</Button>
            <Button data-testid="confirm-payment-btn" onClick={handleConfirmPayment} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Fees() {
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div data-testid="fees-page" className="max-w-[1400px] mx-auto">
      {role === "parent" ? <ParentView /> : <AdminView />}
    </div>
  );
}
