import React, { useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import TrendPill from "@/components/common/TrendPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KANBAN_STAGES, APPLICANTS, ADMISSIONS_STATS } from "@/lib/stage3Data";
import { Plus, UserPlus, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";

function StatCard({ card, index }) {
  return (
    <div data-testid={`adm-stat-${card.key}`} className={`glass rounded-2xl p-5 reveal d${index + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">{card.title}</div>
        {card.trend && <TrendPill text={card.trend.text} dir="up" />}
      </div>
      <div className="font-display text-[38px] leading-[1.05] font-bold text-slate-900 mt-4 tracking-tight">{card.value}</div>
      <div className="text-[12.5px] text-slate-500 mt-1.5">{card.sub}</div>
    </div>
  );
}

function ApplicantCard({ a }) {
  const initials = a.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
  return (
    <div data-testid={`applicant-${a.id}`} className="glass-soft rounded-xl p-3.5 cursor-pointer hover:bg-white/85 transition group">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-[11px] font-semibold shrink-0">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800 truncate">{a.name}</div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">Class {a.classApplied}</div>
          <div className="text-[10.5px] text-slate-400 mt-1.5">{a.date}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
      </div>
    </div>
  );
}

function StageColumn({ stage, applicants }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full ${stage.accent} border px-2.5 py-0.5 text-[11px] font-semibold`}>{stage.label}</span>
        </div>
        {stage.count !== null && (
          <span className="text-[11.5px] font-semibold text-slate-500">{stage.count}</span>
        )}
      </div>
      <div className="flex-1 space-y-2.5">
        {applicants.length === 0 ? (
          <div className="text-[12px] text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">No applicants in this stage.</div>
        ) : applicants.map((a) => <ApplicantCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function NewInquiryDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", classApplied: "", parent: "", phone: "", email: "", prevSchool: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="new-inquiry-btn" className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-[13px] font-medium shadow-sm">
          <Plus className="h-4 w-4" /> New Inquiry
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] tracking-tight text-slate-900">New Admission Inquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {[
            { key: "name",         label: "Student Name",          type: "text" },
            { key: "classApplied", label: "Class Applied For",     type: "text" },
            { key: "parent",       label: "Parent Name",           type: "text" },
            { key: "phone",        label: "Contact Number",        type: "tel"  },
            { key: "email",        label: "Email",                 type: "email"},
            { key: "prevSchool",   label: "Previous School (optional)", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">{f.label}</label>
              <input
                data-testid={`inquiry-${f.key}`}
                type={f.type}
                value={form[f.key]}
                onChange={set(f.key)}
                className="mt-1.5 w-full rounded-xl bg-white border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-3.5 py-2 text-[13.5px]"
              />
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <button onClick={() => setOpen(false)} data-testid="inquiry-cancel" className="rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition px-4 py-2 text-[13px] font-medium text-slate-700">Cancel</button>
          <button onClick={() => { toast("Inquiry recorded"); setOpen(false); }} data-testid="inquiry-submit" className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2 text-[13px] font-medium shadow-sm">
            <UserPlus className="h-4 w-4" /> Submit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Admissions() {
  const byStage = useMemo(() => {
    const m = {};
    KANBAN_STAGES.forEach((s) => (m[s.key] = []));
    APPLICANTS.forEach((a) => m[a.stage]?.push(a));
    return m;
  }, []);

  const [activeStage, setActiveStage] = useState(KANBAN_STAGES[0].key);

  return (
    <div data-testid="admissions-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Admissions"
        subtitle="Inquiries, verifications, interactions & enrolments in one board."
        right={<NewInquiryDialog />}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {ADMISSIONS_STATS.map((c, i) => <StatCard key={c.key} card={c} index={i} />)}
      </div>

      {/* Mobile: tabs to switch stage (single column) */}
      <div className="md:hidden mb-4">
        <div className="overflow-x-auto thin-scroll -mx-1 px-1">
          <Tabs value={activeStage} onValueChange={setActiveStage}>
            <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1 flex w-max">
              {KANBAN_STAGES.map((s) => (
                <TabsTrigger key={s.key} value={s.key} data-testid={`stage-tab-${s.key}`} className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-3.5 text-[12px] whitespace-nowrap">
                  {s.label}{s.count !== null ? ` · ${s.count}` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="md:hidden">
        <StageColumn stage={KANBAN_STAGES.find((s) => s.key === activeStage)} applicants={byStage[activeStage] || []} />
      </div>

      {/* Desktop kanban */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 reveal">
        {KANBAN_STAGES.map((s) => (
          <StageColumn key={s.key} stage={s} applicants={byStage[s.key] || []} />
        ))}
      </div>
    </div>
  );
}
