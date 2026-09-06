import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { Wallet, TrendingUp, AlertCircle, Download, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", UNPAID: "Due" };
const STATUS_STYLE = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-blue-50 text-blue-700",
  UNPAID: "bg-amber-50 text-amber-700",
};
const PAYMENT_MODES = ["CASH", "UPI", "CARD", "CHEQUE", "ONLINE"];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status] || STATUS_STYLE.UNPAID}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function AdminView() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalDue: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState("all");
  const [status, setStatus] = useState("all");
  const [collectRow, setCollectRow] = useState(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMode, setCollectMode] = useState("CASH");
  const [processing, setProcessing] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (cls !== "all") filters.cls = cls;
      if (status !== "all") {
        if (status === "paid") filters.status = "PAID";
        else if (status === "partial") filters.status = "PARTIAL";
        else if (status === "pending") filters.status = "UNPAID";
      }
      const [ledgerRes, summaryRes] = await Promise.all([
        api.getFeeLedger(filters),
        api.getFeeSummary(),
      ]);
      setRecords(ledgerRes.entries || ledgerRes.ledger || []);
      setSummary(summaryRes || { totalCollected: 0, totalDue: 0, overdueCount: 0 });
    } catch (err) {
      toast.error("Failed to load fee records");
    } finally {
      setLoading(false);
    }
  }, [cls, status]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const classes = useMemo(() => Array.from(new Set(records.map((r) => r.student?.cls || "N/A"))).sort(), [records]);

  const rows = useMemo(() => records.map((r) => ({
    id: r.id,
    admNo: r.student?.admNo || r.id,
    name: r.student?.name || "Student",
    classSection: `${r.student?.cls || "N/A"}-${r.student?.section || ""}`,
    term: r.term || "Term",
    status: r.status || "UNPAID",
    due: r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—",
    amount: r.amount || 0,
    paid: r.paid || 0,
    balance: (r.amount || 0) - (r.paid || 0),
  })), [records]);

  const totalCollected = summary.totalCollected || rows.reduce((s, r) => s + r.paid, 0);
  const totalDue = summary.totalDue || rows.reduce((s, r) => s + r.balance, 0);
  const overdueCount = summary.overdueCount ?? rows.filter((r) => r.status === "UNPAID").length;

  const [receipt, setReceipt] = useState(null);

  const handleCollect = async () => {
    const amount = parseFloat(collectAmount);
    if (!collectRow || !amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > collectRow.balance) {
      toast.error(`Amount exceeds balance (${formatINR(collectRow.balance)})`);
      return;
    }
    setProcessing(true);
    try {
      const res = await api.recordFeePayment({
        studentId: collectRow.studentId,
        ledgerId: collectRow.id,
        amount,
        paymentMode: collectMode,
      });
      toast.success(`Payment collected for ${collectRow.name}`);
      const savedPayment = res?.payment;
      setCollectRow(null);
      setCollectAmount("");
      setCollectMode("CASH");
      await fetchRecords();
      if (savedPayment) {
        setReceipt({
          ...savedPayment,
          student: res?.student || { name: collectRow.name, admNo: collectRow.admNo },
          term: collectRow.term,
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN · OPERATIONS"
        title="Fee Collection & Ledger"
        subtitle="Track term-wise dues, manual payments, and instant digital receipts."
        right={<ExportButton testId="fees-export" />}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div data-testid="fee-stat-collected" className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Total Collected
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatINR(totalCollected)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Across all classes · {records.length} ledger entries</div>
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
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
                <th className="px-5 py-3 font-semibold">Adm No</th>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Class</th>
                <th className="px-5 py-3 font-semibold">Term</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Paid</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid={`fee-row-${r.id}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.admNo}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.classSection}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.term}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{formatINR(r.amount)}</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-700">{formatINR(r.paid)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500">{r.due}</td>
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                    {r.paid > 0 && (
                      <button
                        onClick={() => {
                          setReceipt({
                            receiptNo: `RCP-${r.id.slice(-6).toUpperCase()}`,
                            student: { name: r.name, admNo: r.admNo, cls: r.classSection },
                            amount: r.paid,
                            paymentMode: "CASH / ONLINE",
                            paidAt: new Date(),
                            term: r.term,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] text-slate-700 hover:text-[#0c6a99] transition px-2.5 py-1.5 text-[11.5px] font-medium"
                      >
                        <Download className="h-3 w-3" /> Receipt
                      </button>
                    )}
                    {r.balance > 0 && (
                      <button
                        onClick={() => { setCollectRow({ ...r, studentId: records.find((x) => x.id === r.id)?.studentId }); setCollectAmount(String(r.balance)); }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[12px] font-medium shadow-sm"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Collect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">No fee records found.</td></tr>
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
                  <div className="text-[11.5px] text-slate-500 mt-1">{r.classSection} · {r.term}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900">{formatINR(r.amount)}</div>
                  <div className="mt-1"><StatusBadge status={r.status} /></div>
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    {r.paid > 0 && (
                      <button
                        onClick={() => {
                          setReceipt({
                            receiptNo: `RCP-${r.id.slice(-6).toUpperCase()}`,
                            student: { name: r.name, admNo: r.admNo, cls: r.classSection },
                            amount: r.paid,
                            paymentMode: "CASH / ONLINE",
                            paidAt: new Date(),
                            term: r.term,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 text-slate-700 px-2.5 py-1 text-[11px] font-medium"
                      >
                        Receipt
                      </button>
                    )}
                    {r.balance > 0 && (
                      <button
                        onClick={() => { setCollectRow({ ...r, studentId: records.find((x) => x.id === r.id)?.studentId }); setCollectAmount(String(r.balance)); }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[12px] font-medium"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Collect
                      </button>
                    )}
                  </div>
                </div>
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

      {/* Collect Payment Dialog */}
      <Dialog open={!!collectRow} onOpenChange={() => setCollectRow(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Record Payment</DialogTitle>
          </DialogHeader>
          {collectRow && (
            <div className="space-y-4 py-2">
              <div className="glass-soft rounded-xl p-4 text-[13.5px] space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Student:</span>
                  <span className="font-semibold text-slate-800">{collectRow.name} ({collectRow.admNo})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Term:</span>
                  <span className="font-semibold text-slate-800">{collectRow.term}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Due:</span>
                  <span className="font-semibold text-amber-700">{formatINR(collectRow.balance)}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Amount (INR)</label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  min="1"
                  max={collectRow.balance}
                  className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px]"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Payment Mode</label>
                <Select value={collectMode} onValueChange={setCollectMode}>
                  <SelectTrigger className="mt-1.5 w-full rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCollectRow(null)} className="rounded-full">Cancel</Button>
            <Button onClick={handleCollect} disabled={processing} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
              {processing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />} Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Receipt View Dialog */}
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Official Fee Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4 py-2">
              <div className="glass-soft rounded-xl p-5 text-[13.5px] space-y-2.5 border-l-4 border-emerald-400 bg-emerald-50/20">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-900">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Student:</span>
                  <span className="font-semibold text-slate-800">{receipt.student?.name} ({receipt.student?.admNo || "—"})</span>
                </div>
                {receipt.term && (
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Fee Head:</span>
                    <span className="text-slate-800">{receipt.term}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-700 text-[15px]">{formatINR(receipt.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Payment Mode:</span>
                  <span className="font-semibold text-slate-800 uppercase">{receipt.paymentMode || "CASH"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Timestamp:</span>
                  <span className="text-slate-700">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span>Vidyaloop School OS</span>
                <span className="text-emerald-600 font-semibold">✓ Verified & Recorded</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceipt(null)} className="rounded-full">Close</Button>
            <Button onClick={handlePrintReceipt} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
              <Download className="h-4 w-4 mr-1.5" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParentView() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const childId = user?.studentId || user?.student?.id;
  const childName = user?.name || user?.student?.name || "Student";

  const fetchHistory = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.getStudentFeeHistory(childId);
      setLedger(res.ledger || []);
      setPayments(res.payments || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load fee history");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleConfirmPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!paying || !amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setProcessing(true);
    try {
      const res = await api.recordFeePayment({
        studentId: childId,
        ledgerId: paying.id,
        amount,
        paymentMode: payMode,
      });
      toast.success(`Payment successful! Receipt ${res.payment?.receiptNo || ""} generated.`);
      setPaying(null);
      setPayAmount("");
      await fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const showReceipt = async (paymentId) => {
    try {
      const res = await api.getFeeReceipt(paymentId);
      setReceipt(res.payment || res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load receipt");
    }
  };

  const totalBilled = ledger.reduce((s, l) => s + l.amount, 0);
  const totalPaid = ledger.reduce((s, l) => s + (l.paid || 0), 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <div>
      <PageHeader
        eyebrow="PARENT · FEES"
        title="Fees & Dues"
        subtitle={<>Term-wise breakdown for <span className="font-serif-i text-slate-700">{childName}</span>.</>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" /></div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-[13.5px]">No fee records linked to this account yet.</div>
          ) : ledger.map((t, i) => {
            const paid = t.status === "PAID";
            const balance = (t.amount || 0) - (t.paid || 0);
            return (
              <div key={t.id} data-testid={`parent-fee-${t.term.toLowerCase().replace(/\s+/g, "-")}`} className="glass-soft rounded-xl p-5 flex items-center gap-5">
                <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-display text-[19px] font-bold text-slate-900 tracking-tight">{t.term}</div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-[12.5px] text-slate-500 mt-1">
                    {paid
                      ? <>{formatINR(t.amount)} · paid {t.paidDate ? new Date(t.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "this session"}</>
                      : <><span className="font-medium text-slate-700">{formatINR(t.amount)}</span> · due {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</>}
                  </div>
                </div>
                {paid ? (
                  <button
                    data-testid={`receipt-${t.term.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => {
                      const p = payments.find((x) => x.ledgerId === t.id);
                      if (p) showReceipt(p.id);
                      else toast.info(`Paid for ${t.term}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] hover:text-[#0c6a99] transition px-3.5 py-2 text-[12.5px] font-medium text-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </button>
                ) : (
                  <button
                    data-testid="pay-now"
                    onClick={() => { setPaying(t); setPayAmount(String(balance)); }}
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
              <span className="font-semibold text-slate-800">{formatINR(totalBilled)}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-semibold text-emerald-700">{formatINR(totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Outstanding Balance</span>
              <span className="font-semibold text-amber-700">{formatINR(outstanding)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Now Dialog */}
      <Dialog open={!!paying} onOpenChange={() => setPaying(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Confirm Payment</DialogTitle>
          </DialogHeader>
          {paying && (
            <div className="space-y-4 py-2">
              <div className="glass-soft rounded-xl p-4 text-[13.5px] space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Student Name:</span>
                  <span className="font-semibold text-slate-800">{childName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Term Fee:</span>
                  <span className="font-semibold text-slate-800">{paying.term}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Balance Due:</span>
                  <span className="font-semibold text-amber-700">{formatINR((paying.amount || 0) - (paying.paid || 0))}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Amount (INR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="1"
                  className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px]"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Payment Mode</label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger className="mt-1.5 w-full rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaying(null)} className="rounded-full">Cancel</Button>
            <Button data-testid="confirm-payment-btn" onClick={handleConfirmPayment} disabled={processing} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
              {processing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />} Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Payment Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4 py-2">
              <div className="glass-soft rounded-xl p-5 text-[13.5px] space-y-2 border-l-4 border-emerald-400">
                <div className="flex justify-between text-slate-600">
                  <span>Receipt No:</span>
                  <span className="font-mono font-semibold text-slate-800">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Student:</span>
                  <span className="font-semibold text-slate-800">{receipt.student?.name || childName} ({receipt.student?.admNo || "—"})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount:</span>
                  <span className="font-mono font-semibold text-emerald-700">{formatINR(receipt.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mode:</span>
                  <span className="font-semibold text-slate-800">{receipt.paymentMode || "—"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid At:</span>
                  <span className="font-semibold text-slate-800">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 text-center">This is a valid digitally generated receipt.</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceipt(null)} className="rounded-full">Close</Button>
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