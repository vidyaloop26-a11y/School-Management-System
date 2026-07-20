import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, CalendarDays, GraduationCap, BookOpen, IdCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STAFF, STAFF_PROFILE, TIMETABLE_8A, DAYS, PERIODS, SUBJECT_COLORS } from "@/lib/mockData";
import EmptyState from "@/components/common/EmptyState";
import { PlaneTakeoff } from "lucide-react";

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

export default function StaffProfile() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const base = STAFF.find((s) => s.id === staffId);
  const detail = STAFF_PROFILE[staffId];

  if (!base) return <div className="p-8">Staff not found.</div>;

  const p = detail || {
    name: base.name, id: base.id, joined: "—", subject: base.dept, classes: [],
    qualification: "—", email: "—", phone: "—",
  };
  const initials = p.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  // Build a personal timetable from the shared class 8-A grid where teacher matches
  const teacherTT = {};
  PERIODS.forEach((pr) => {
    teacherTT[pr.key] = {};
    DAYS.forEach((d) => {
      const cell = TIMETABLE_8A[pr.key][d];
      teacherTT[pr.key][d] = cell && cell.teacher === p.name ? { subject: cell.subject, room: cell.room } : null;
    });
  });

  return (
    <div data-testid="staff-profile" className="max-w-[1400px] mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Staff
      </button>

      <div className="glass rounded-2xl p-6 md:p-7 reveal">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-2xl font-bold shadow-sm">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">{base.role} · {p.id}</div>
            <h1 className="font-display title-dot text-[36px] leading-tight font-bold text-slate-900 tracking-tight mt-0.5">{p.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">{base.dept}</span>
              {(p.classes || []).map((c) => (
                <span key={c} className="rounded-full bg-[#e6f4fb] text-[#0c6a99] px-3 py-1 text-[11.5px] font-medium">{c}</span>
              ))}
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11.5px] font-medium">{base.status}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-7">
          <div className="overflow-x-auto thin-scroll -mx-1 px-1">
            <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1 w-max">
              <TabsTrigger value="overview" data-testid="stab-overview" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="timetable" data-testid="stab-timetable" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Timetable</TabsTrigger>
              <TabsTrigger value="leave" data-testid="stab-leave" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Leave Record</TabsTrigger>
              <TabsTrigger value="docs" data-testid="stab-docs" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Documents</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Employment</div>
                <Field icon={IdCard} label="Staff ID" value={p.id} />
                <Field icon={CalendarDays} label="Joined" value={p.joined} />
                <Field icon={BookOpen} label="Subject" value={p.subject} />
                <Field icon={GraduationCap} label="Qualification" value={p.qualification} />
              </div>
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Contact</div>
                <Field icon={Mail} label="Email" value={p.email} />
                <Field icon={Phone} label="Phone" value={p.phone} />
                <div>
                  <div className="text-[10.5px] tracking-[0.14em] font-semibold text-slate-400 uppercase mb-2">Assigned Classes</div>
                  <div className="flex flex-wrap gap-2">
                    {(p.classes || []).map((c) => (
                      <span key={c} className="rounded-full bg-white/70 border border-white px-3 py-1 text-[12px] text-slate-700">{c}</span>
                    ))}
                    {(!p.classes || p.classes.length === 0) && <span className="text-[12px] text-slate-500">—</span>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timetable" className="mt-6">
            <div className="glass-soft rounded-xl p-4 overflow-x-auto thin-scroll">
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className="text-left px-3 py-2 text-[10.5px] tracking-widest font-semibold text-slate-500 uppercase">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((pr) => (
                    <tr key={pr.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-slate-800">{pr.label}</div>
                        <div className="text-[10.5px] text-slate-500">{pr.time}</div>
                      </td>
                      {DAYS.map((d) => {
                        if (pr.key === "BREAK") {
                          return <td key={d} className="px-3 py-2"><div className="rounded-lg bg-slate-50 text-slate-400 text-[11px] px-2 py-2 text-center">Break</div></td>;
                        }
                        const cell = teacherTT[pr.key][d];
                        if (!cell) return <td key={d} className="px-3 py-2"><div className="rounded-lg border border-dashed border-slate-200 text-slate-300 text-[11px] px-2 py-2 text-center">—</div></td>;
                        const col = SUBJECT_COLORS[cell.subject] || { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };
                        return (
                          <td key={d} className="px-3 py-2">
                            <div className={`rounded-lg ${col.bg} px-2.5 py-2`}>
                              <div className={`text-[12px] font-medium ${col.text}`}>{cell.subject}</div>
                              <div className="text-[10.5px] text-slate-500">Room {cell.room} · 8-A</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="mt-6">
            <div className="glass-soft rounded-xl py-6">
              <EmptyState
                icon={PlaneTakeoff}
                title="No pending leave requests — smooth sailing"
                hint="Any staff or student leave submissions will appear here."
              />
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
