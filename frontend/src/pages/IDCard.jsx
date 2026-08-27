import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ID_CARD_TEMPLATES } from "@/lib/stage3Data";
import { useStudents } from "@/lib/queries";
import { Loader2 } from "lucide-react";
import { Download, Printer, Droplet, IdCard as IdCardIcon, Phone, GraduationCap } from "lucide-react";
import { toast } from "@/components/ui/sonner";

function ClassicBlueCard({ s }) {
  const initials = s.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
  return (
    <div data-testid="id-card-classic-blue" className="relative w-full max-w-[340px] mx-auto aspect-[1/1.58] rounded-[22px] overflow-hidden shadow-[0_25px_60px_-20px_rgba(20,60,100,0.35)] border border-[#0e7fb1]/40">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c6a99] via-[#0e7fb1] to-[#29ABE2]" />
      <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 90% 90%, rgba(255,255,255,0.4) 0, transparent 45%)" }} />

      {/* Header */}
      <div className="relative px-5 pt-5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/95 grid place-items-center">
            <span className="font-display font-bold text-[#0c6a99] text-[15px]">V</span>
          </div>
          <div className="font-display font-bold tracking-tight text-[15px]">
            Vidya<span className="opacity-80">loop</span>
          </div>
        </div>
        <span className="text-[9.5px] tracking-[0.24em] font-semibold uppercase opacity-80">Student</span>
      </div>

      {/* Photo */}
      <div className="relative flex justify-center mt-4">
        <div className="h-24 w-24 rounded-full bg-white/95 border-4 border-white/80 grid place-items-center text-[#0c6a99] shadow-lg">
          <span className="font-display font-bold text-2xl">{initials}</span>
        </div>
      </div>

      {/* Details */}
      <div className="relative text-center px-5 mt-3">
        <div className="font-display font-bold text-white text-[19px] leading-tight tracking-tight">{s.name}</div>
        <div className="text-white/85 text-[11.5px] mt-0.5">Class {s.classSection}{s.roll ? ` · Roll ${s.roll}` : ""}</div>
      </div>

      <div className="relative mx-5 mt-4 rounded-2xl bg-white/95 backdrop-blur px-4 py-3.5 grid grid-cols-2 gap-y-2.5 gap-x-3">
        <div>
          <div className="text-[9px] tracking-widest text-slate-500 uppercase font-semibold">ID No.</div>
          <div className="text-[12px] font-semibold text-slate-800 mt-0.5 font-mono">{s.idNo}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-slate-500 uppercase font-semibold">Blood Group</div>
          <div className="text-[12px] font-semibold text-slate-800 mt-0.5">{s.bloodGroup}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-slate-500 uppercase font-semibold">Valid Till</div>
          <div className="text-[12px] font-semibold text-slate-800 mt-0.5">{s.validTill}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-slate-500 uppercase font-semibold">Emergency</div>
          <div className="text-[11.5px] font-semibold text-slate-800 mt-0.5">{s.emergency}</div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/25 backdrop-blur-sm px-5 py-2 flex items-center justify-between text-white/90">
        <div className="text-[9.5px] tracking-[0.2em] uppercase font-semibold">Vidyaloop School · Session 2026-27</div>
        <div className="text-[9.5px] font-semibold opacity-80">Signature</div>
      </div>
    </div>
  );
}

function MinimalWhiteCard({ s }) {
  const initials = s.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
  return (
    <div data-testid="id-card-minimal-white" className="relative w-full max-w-[340px] mx-auto aspect-[1/1.58] rounded-[22px] overflow-hidden shadow-[0_25px_60px_-20px_rgba(20,60,100,0.18)] border border-slate-200 bg-white">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#29ABE2]" />

      <div className="px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#e6f4fb] grid place-items-center">
            <span className="font-display font-bold text-[#29ABE2] text-[15px]">V</span>
          </div>
          <div className="font-display font-bold tracking-tight text-slate-900 text-[15px]">
            Vidya<span className="text-[#29ABE2]">loop</span>
          </div>
        </div>
        <span className="text-[9.5px] tracking-[0.24em] font-semibold text-slate-400 uppercase">Student</span>
      </div>

      <div className="flex justify-center mt-4">
        <div className="h-24 w-24 rounded-full bg-slate-50 border border-slate-200 grid place-items-center text-slate-700">
          <span className="font-display font-bold text-2xl">{initials}</span>
        </div>
      </div>

      <div className="text-center px-5 mt-3">
        <div className="font-display font-bold text-slate-900 text-[19px] leading-tight tracking-tight">{s.name}</div>
        <div className="text-slate-500 text-[11.5px] mt-0.5">Class {s.classSection}{s.roll ? ` · Roll ${s.roll}` : ""}</div>
      </div>

      <div className="mx-5 mt-4 rounded-2xl border border-slate-200 px-4 py-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-slate-500 inline-flex items-center gap-1.5"><IdCardIcon className="h-3 w-3 text-slate-400" /> ID No.</span>
          <span className="font-semibold text-slate-800 font-mono">{s.idNo}</span>
        </div>
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-slate-500 inline-flex items-center gap-1.5"><Droplet className="h-3 w-3 text-slate-400" /> Blood Group</span>
          <span className="font-semibold text-slate-800">{s.bloodGroup}</span>
        </div>
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-slate-500 inline-flex items-center gap-1.5"><GraduationCap className="h-3 w-3 text-slate-400" /> Valid Till</span>
          <span className="font-semibold text-slate-800">{s.validTill}</span>
        </div>
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-slate-500 inline-flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> Emergency</span>
          <span className="font-semibold text-slate-800">{s.emergency}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 px-5 py-2.5 flex items-center justify-between text-slate-500">
        <div className="text-[9.5px] tracking-[0.2em] uppercase font-semibold">Session 2026-27</div>
        <div className="text-[9.5px] font-semibold">Signature</div>
      </div>
    </div>
  );
}

export default function IDCard() {
  const [template, setTemplate] = useState("classic-blue");
  const [admNo, setAdmNo] = useState("");
  const { data: students = [], isLoading } = useStudents();
  const firstAdmNo = students[0]?.admNo;
  const effectiveAdmNo = admNo || firstAdmNo || "";

  const student = students.find((s) => s.admNo === effectiveAdmNo);
  const cardData = {
    name: student?.name || "Select a student",
    idNo: student?.admNo || effectiveAdmNo || "—",
    classSection: student ? `${student.cls}-${student.section}` : "—",
    roll: student?.roll || "",
    bloodGroup: student?.bloodGroup || "—",
    emergency: student?.emergency || "—",
  };

  return (
    <div data-testid="idcard-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="SYSTEM"
        title="ID Card Generator"
        subtitle="Pick a template, choose a student, and print or export."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        {/* Controls */}
        <div className="glass rounded-2xl p-6 reveal space-y-5">
          <div>
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase mb-3">Template</div>
            <div className="grid grid-cols-2 gap-3">
              {ID_CARD_TEMPLATES.map((t) => {
                const active = template === t.key;
                return (
                  <button
                    key={t.key}
                    data-testid={`template-${t.key}`}
                    onClick={() => setTemplate(t.key)}
                    className={`rounded-2xl p-3.5 text-left transition border ${active ? "border-[#29ABE2] bg-[#f3fbff] shadow-sm" : "border-slate-200 bg-white/70 hover:border-slate-300"}`}
                  >
                    <div className={`h-16 rounded-lg mb-2.5 ${t.key === "classic-blue" ? "bg-gradient-to-br from-[#0c6a99] to-[#29ABE2]" : "bg-white border border-slate-200"}`}>
                      <div className={`h-full w-full grid place-items-center ${t.key === "classic-blue" ? "" : ""}`}>
                        {t.key === "minimal-white" && <div className="h-2 w-2/3 rounded-full bg-[#29ABE2]/60" />}
                      </div>
                    </div>
                    <div className={`text-[13px] font-semibold ${active ? "text-[#0c6a99]" : "text-slate-800"}`}>{t.label}</div>
                    {active && <div className="text-[10.5px] text-[#29ABE2] font-semibold mt-1 tracking-wider uppercase">Selected</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase mb-2">Student</div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-[13px] px-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading students…</div>
            ) : (
              <Select value={effectiveAdmNo} onValueChange={(v) => v && setAdmNo(v)}>
                <SelectTrigger data-testid="idcard-student" className="w-full rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.admNo} value={s.admNo}>{s.name} · {s.admNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="glass-soft rounded-xl p-4 grid grid-cols-2 gap-y-2 gap-x-3 text-[12.5px]">
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">Name</div><div className="text-slate-800 font-medium mt-0.5">{cardData.name}</div></div>
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">ID No.</div><div className="text-slate-800 font-medium mt-0.5 font-mono">{cardData.idNo}</div></div>
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">Class</div><div className="text-slate-800 font-medium mt-0.5">{cardData.classSection}</div></div>
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">Blood Group</div><div className="text-slate-800 font-medium mt-0.5">{cardData.bloodGroup}</div></div>
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">Valid Till</div><div className="text-slate-800 font-medium mt-0.5">{cardData.validTill}</div></div>
            <div><div className="text-slate-400 text-[10.5px] tracking-widest uppercase">Emergency</div><div className="text-slate-800 font-medium mt-0.5">{cardData.emergency}</div></div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button data-testid="idcard-print" className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] transition text-slate-700 hover:text-[#0c6a99] px-4 py-2 text-[13px] font-medium">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button data-testid="idcard-download" onClick={() => toast("ID card generated — ready to download")} className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2.5 text-[13px] font-medium shadow-sm">
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="glass rounded-2xl p-6 md:p-8 reveal d1">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-5 text-center">Live Preview</div>
          <div className="grid place-items-center">
            {template === "classic-blue" ? <ClassicBlueCard s={cardData} /> : <MinimalWhiteCard s={cardData} />}
          </div>
        </div>
      </div>
    </div>
  );
}
