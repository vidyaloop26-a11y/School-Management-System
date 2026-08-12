import React, { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_ROWS, FEE_STAT_STRIP, PARENT_FEE_TERMS, PARENT_CHILD } from "@/lib/stage2Data";
import { formatINR } from "@/lib/format";
import { Wallet, TrendingUp, AlertCircle, Download, CreditCard } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";

function AdminView() {
  const [cls, setCls] = useState("all");
  const [status, setStatus] = useState("all");

  const classes = Array.from(new Set(FEE_ROWS.map((r) => r.classSection))).sort();

  const rows = useMemo(() => FEE_ROWS.filter((r) => {
    if (cls !== "all" && r.classSection !== cls) return false;
    if (status !== "all" && r.status.toLowerCase() !== status) return false;
    return true;
  }), [cls, status]);

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
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatINR(FEE_STAT_STRIP.totalCollected)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Across all classes · Term 2</div>
        </div>
        <div data-testid="fee-stat-due" className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <Wallet className="h-3.5 w-3.5 text-[#29ABE2]" /> Total Due
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatINR(FEE_STAT_STRIP.totalDue)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Term 2 projected receivables</div>
        </div>
        <div data-testid="fee-stat-overdue" className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Overdue Count
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{FEE_STAT_STRIP.overdueCount}</div>
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

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Adm. No.</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Class</th>
                <th className="px-5 py-3 font-semibold">Term</th>
                <th className="px-5 py-3 font-semibold">Fee Status</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.admNo} data-testid={`fee-row-${r.admNo}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{r.admNo}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.classSection}</td>
                  <td className="px-5 py-3.5 text-slate-600">Term {r.term}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.status === "Paid" ? "bg-emerald-50 text-emerald-700" : r.status === "Overdue" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.status === "Paid" ? "bg-emerald-500" : r.status === "Overdue" ? "bg-rose-500" : "bg-amber-500"}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{r.due}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No results found — try a different search term.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2.5">
          {rows.map((r) => (
            <div key={r.admNo} data-testid={`fee-card-${r.admNo}`} className="glass-soft rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-slate-500">{r.admNo}</div>
                  <div className="font-medium text-slate-800 text-[14.5px] mt-0.5 truncate">{r.name}</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0 ${r.status === "Paid" ? "bg-emerald-50 text-emerald-700" : r.status === "Overdue" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === "Paid" ? "bg-emerald-500" : r.status === "Overdue" ? "bg-rose-500" : "bg-amber-500"}`} />
                  {r.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <div className="text-slate-500 flex items-center gap-1.5">
                  <span>Class {r.classSection}</span>
                  <span className="text-slate-300">·</span>
                  <span>Term {r.term}</span>
                </div>
                <div className="text-slate-500">Due: <span className="font-medium text-slate-700">{r.due}</span></div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center text-slate-500 text-[13px] py-8 glass-soft rounded-xl">No fee records match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParentView() {
  return (
    <div>
      <PageHeader
        eyebrow="PARENT · FEES"
        title="Fees"
        subtitle={<>Term-wise breakdown for <span className="font-serif-i text-slate-700">{PARENT_CHILD.name}</span>.</>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal space-y-3">
          {PARENT_FEE_TERMS.map((t, i) => {
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
                  <button data-testid={`receipt-${t.term.toLowerCase().replace(/\s+/g, "-")}`} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] hover:text-[#0c6a99] transition px-3.5 py-2 text-[12.5px] font-medium text-slate-700">
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </button>
                ) : (
                  <button data-testid="pay-now" className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-[12.5px] font-medium shadow-sm">
                    <CreditCard className="h-3.5 w-3.5" /> Pay Now
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">Summary</div>
          <div className="font-display text-[22px] font-bold text-slate-900 mt-1 tracking-tight">This academic year</div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Total billed</span>
              <span className="font-semibold text-slate-800">{formatINR(PARENT_FEE_TERMS.reduce((s, t) => s + t.amount, 0))}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Paid</span>
              <span className="font-semibold text-emerald-700">{formatINR(PARENT_FEE_TERMS.filter(t => t.status === "Paid").reduce((s, t) => s + t.amount, 0))}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-semibold text-amber-700">{formatINR(PARENT_FEE_TERMS.filter(t => t.status !== "Paid").reduce((s, t) => s + t.amount, 0))}</span>
            </div>
          </div>
        </div>
      </div>
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
