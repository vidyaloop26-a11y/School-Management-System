import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Droplet, GraduationCap, Cake, IdCard, Loader2, Calendar, Award } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/format";
import api from "@/lib/api";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-white/70 border border-white grid place-items-center shrink-0">
        <Icon className="h-4 w-4 text-[#29ABE2]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] tracking-[0.14em] font-semibold text-slate-400 uppercase">{label}</div>
        <div className="text-[13.5px] text-slate-800 mt-0.5 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

function Heatmap({ pct }) {
  const total = 30;
  const present = Math.round(((pct || 90) / 100) * total);
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
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStudent() {
      setLoading(true);
      try {
        const res = await api.getStudentById(admNo).catch(async () => {
          const list = await api.getStudents();
          const match = list?.students?.find(
            (s) => s.id === admNo || s.admNo.toLowerCase() === admNo.toLowerCase()
          );
          if (match) return { student: match };
          throw new Error("Student not found");
        });

        if (res && res.student) {
          setStudent(res.student);
        } else {
          setError("Student record not found in database.");
        }
      } catch (err) {
        console.error(err);
        setError("Student record not found in database.");
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, [admNo]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#29ABE2]" />
        <span className="text-sm text-slate-500">Loading student profile from database...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-[1400px] mx-auto py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </button>
        <div className="glass rounded-2xl p-8 text-center text-slate-500">
          {error || "Student profile not found in database."}
        </div>
      </div>
    );
  }

  const p = {
    name: student.name,
    admNo: student.admNo,
    session: student.session || "2024-2025",
    batch: student.batch || "2020-2025",
    dob: student.dob || null,
    classSection: `${student.cls}-${student.section}`,
    roll: student.roll,
    bloodGroup: student.bloodGroup || null,
    emergency: student.emergency || null,
    address: student.address || null,
    father: {
      name: student.fatherName || null,
      email: student.fatherEmail || null,
      phone: student.fatherPhone || student.emergency || null,
    },
    mother: { name: student.motherName || null },
    attendanceTerm: 94,
    fees: [
      { term: "Term 1", status: "Paid", amount: 42000, date: "12 Apr 2026" },
      { term: "Term 2", status: "Pending", amount: 42000, date: "due 15 Aug 2026" },
    ],
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
              <span className="rounded-full bg-blue-50 text-[#0c6a99] border border-blue-100 px-3 py-1 text-[11.5px] font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#29ABE2]" /> Session {p.session}
              </span>
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Class {p.classSection}</span>
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Roll No. {p.roll}</span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11.5px] font-medium">{student.status || "Active"}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-7">
          <div className="overflow-x-auto thin-scroll -mx-1 px-1">
            <TabsList className="bg-white/70 border border-slate-200/70 rounded-full p-1 w-max">
              <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="attendance" data-testid="tab-attendance" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Attendance</TabsTrigger>
              <TabsTrigger value="fees" data-testid="tab-fees" className="rounded-full data-[state=active]:bg-[#29ABE2] data-[state=active]:text-white px-4 text-[12.5px] whitespace-nowrap">Fee History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Academic & Personal Info</div>
                <Field icon={IdCard} label="Admission No." value={p.admNo} />
                <Field icon={Calendar} label="Academic Session & Batch" value={`Session ${p.session} · Batch ${p.batch}`} />
                <Field icon={Cake} label="Date of Birth" value={p.dob} />
                <Field icon={GraduationCap} label="Class · Section · Roll" value={`Class ${p.classSection} · Roll ${p.roll}`} />
                <Field icon={Droplet} label="Blood Group" value={p.bloodGroup} />
                <Field icon={Phone} label="Emergency Contact" value={p.emergency} />
                <Field icon={MapPin} label="Address" value={p.address} />
              </div>
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Parent / Guardian</div>
                <div>
                  <div className="text-[12px] text-slate-500">Father / Guardian</div>
                  <div className="text-[14px] font-medium text-slate-800">{p.father.name || "—"}</div>
                  <div className="mt-2 space-y-2">
                    <Field icon={Mail} label="Email" value={p.father.email} />
                    <Field icon={Phone} label="Phone" value={p.father.phone} />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[12px] text-slate-500">Mother</div>
                  <div className="text-[14px] font-medium text-slate-800">{p.mother.name || "—"}</div>
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
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
