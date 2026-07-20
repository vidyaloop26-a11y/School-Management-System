import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Droplet, GraduationCap, Cake, IdCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STUDENTS, STUDENT_PROFILE } from "@/lib/mockData";
import { formatINR } from "@/lib/format";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-white/70 border border-white grid place-items-center shrink-0">
        <Icon className="h-4 w-4 text-[#29ABE2]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] tracking-[0.14em] font-semibold text-slate-400 uppercase">{label}</div>
        <div className="text-[13.5px] text-slate-800 mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

function Heatmap({ pct }) {
  // 6 weeks x 5 school days = 30 cells; presence based loosely on pct
  const total = 30;
  const present = Math.round((pct / 100) * total);
  const cells = Array.from({ length: total }).map((_, i) => i < present);
  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5">
        {cells.map((p, i) => (
          <div key={i} className={`h-5 rounded-[5px] ${p ? "bg-[#29ABE2]/70" : "bg-slate-200/70"}`} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-3">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#29ABE2]/70" /> Present</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Absent</span>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { admNo } = useParams();
  const navigate = useNavigate();
  const base = STUDENTS.find((s) => s.admNo === admNo);
  const detail = STUDENT_PROFILE[admNo];

  if (!base) return <div className="p-8">Student not found.</div>;

  // Fall back to a light record for students without a full profile
  const p = detail || {
    name: base.name,
    admNo: base.admNo,
    dob: "—",
    classSection: `${base.class}-${base.section}`,
    roll: base.roll,
    bloodGroup: "—",
    emergency: "—",
    address: "—",
    father: { name: "—", email: "—", phone: "—" },
    mother: { name: "—" },
    attendanceTerm: 92,
    fees: [],
  };

  const initials = p.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  return (
    <div data-testid="student-profile" className="max-w-[1400px] mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <div className="glass rounded-2xl p-6 md:p-7 reveal">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-2xl font-bold shadow-sm">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Student · {p.admNo}</div>
            <h1 className="font-display title-dot text-[36px] leading-tight font-bold text-slate-900 tracking-tight mt-0.5">{p.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Class {p.classSection}</span>
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Roll No. {p.roll}</span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11.5px] font-medium">{base.status}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-7">
          <div className="overflow-x-auto thin-scroll -mx-1 px-1">
            <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1 w-max">
              <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="attendance" data-testid="tab-attendance" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Attendance</TabsTrigger>
              <TabsTrigger value="fees" data-testid="tab-fees" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Fee History</TabsTrigger>
              <TabsTrigger value="academic" data-testid="tab-academic" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Academic Records</TabsTrigger>
              <TabsTrigger value="docs" data-testid="tab-docs" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Documents</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Personal</div>
                <Field icon={IdCard} label="Admission No." value={p.admNo} />
                <Field icon={Cake} label="Date of Birth" value={p.dob} />
                <Field icon={GraduationCap} label="Class · Section · Roll" value={`Class ${p.classSection} · Roll ${p.roll}`} />
                <Field icon={Droplet} label="Blood Group" value={p.bloodGroup} />
                <Field icon={Phone} label="Emergency Contact" value={p.emergency} />
                <Field icon={MapPin} label="Address" value={p.address} />
              </div>
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Parent / Guardian</div>
                <div>
                  <div className="text-[12px] text-slate-500">Father</div>
                  <div className="text-[14px] font-medium text-slate-800">{p.father.name}</div>
                  <div className="mt-2 space-y-2">
                    <Field icon={Mail} label="Email" value={p.father.email} />
                    <Field icon={Phone} label="Phone" value={p.father.phone} />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[12px] text-slate-500">Mother</div>
                  <div className="text-[14px] font-medium text-slate-800">{p.mother.name}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
              <div className="glass-soft rounded-xl p-5">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase mb-3">This term</div>
                <Heatmap pct={p.attendanceTerm} />
              </div>
              <div className="glass-soft rounded-xl p-5">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Term summary</div>
                <div className="font-display text-[48px] font-bold text-slate-900 leading-none mt-2">{p.attendanceTerm}%</div>
                <div className="text-[13px] text-slate-500 mt-1">Present this term</div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <div className="text-[11px] text-emerald-700 tracking-widest uppercase">Present</div>
                    <div className="text-[18px] font-semibold text-emerald-800">{Math.round(60 * p.attendanceTerm/100)}</div>
                  </div>
                  <div className="rounded-lg bg-rose-50 px-3 py-2">
                    <div className="text-[11px] text-rose-700 tracking-widest uppercase">Absent</div>
                    <div className="text-[18px] font-semibold text-rose-800">{60 - Math.round(60 * p.attendanceTerm/100)}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fees" className="mt-6">
            <div className="glass-soft rounded-xl overflow-hidden">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Term</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(p.fees || []).map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{f.term}</td>
                      <td className="px-5 py-3.5 text-slate-700">{formatINR(f.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${f.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{f.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{f.date}</td>
                    </tr>
                  ))}
                  {(!p.fees || p.fees.length === 0) && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No fee records available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="mt-6">
            <div className="glass-soft rounded-xl p-8 text-center text-slate-500 text-[13.5px]">
              Academic records will appear here after Term 1 exams are published.
            </div>
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <div className="glass-soft rounded-xl p-8 text-center text-slate-500 text-[13.5px]">
              No documents uploaded yet.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
