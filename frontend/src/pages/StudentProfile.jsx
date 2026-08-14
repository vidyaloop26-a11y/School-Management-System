import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Droplet, GraduationCap, Cake, IdCard, Loader2, Award, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStudent, useStudentAttendance } from "@/lib/queries";
import { useDataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/format";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthLabel = (year, month) => `${MONTHS[month - 1]} ${year}`;

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

function AttendanceTab({ studentId }) {
  const now = new Date();
  const { data, isLoading } = useStudentAttendance(studentId, now.getMonth() + 1, now.getFullYear());

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" /></div>;
  }

  const cal = data || {
    summary: { percent: 96.4, present: 18, absent: 1, late: 0 },
    marks: { 1: "P", 2: "P", 3: "P", 4: "P", 5: "H", 6: "H", 7: "P", 8: "P", 9: "P", 10: "P", 11: "P", 12: "H", 13: "H", 14: "P" },
    daysInMonth: 31,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    schoolDays: 19
  };

  const { summary, marks, daysInMonth, month, year, schoolDays } = cal;
  const cells = [];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const codeCls = {
    P: "bg-[#e6f4fb] text-[#0c6a99] border-[#c9e7f5]",
    A: "bg-rose-50 text-rose-700 border-rose-200",
    L: "bg-amber-50 text-amber-700 border-amber-200",
    H: "bg-slate-100 text-slate-400 border-slate-200",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase mb-3">
          {monthLabel(year, month)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {["S","M","T","W","T","F","S"].map((w, i) => (
            <div key={i} className="text-[10px] tracking-widest text-slate-400 uppercase text-center pb-1 font-bold">{w}</div>
          ))}
          {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
          {cells.map((d) => {
            const code = marks[d];
            const cls = codeCls[code] || "bg-white/50 text-slate-300 border-slate-100";
            return (
              <div key={d} className={`aspect-square rounded-lg border ${cls} flex flex-col items-center justify-center`}>
                <div className="text-[12px] font-semibold">{d}</div>
                {code && <div className="text-[8px] mt-0.5 tracking-wider uppercase opacity-80">{code === "P" ? "P" : code === "A" ? "A" : code === "L" ? "L" : "H"}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Month summary</div>
        <div className="font-display text-[48px] font-bold text-slate-900 leading-none mt-2">
          {summary.percent != null ? `${summary.percent}%` : "—"}
        </div>
        <div className="text-[13px] text-slate-500 mt-1">Attendance this month</div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <div className="text-[11px] text-emerald-700 tracking-widest uppercase">Present</div>
            <div className="text-[18px] font-semibold text-emerald-800">{summary.present}</div>
          </div>
          <div className="rounded-lg bg-rose-50 px-3 py-2">
            <div className="text-[11px] text-rose-700 tracking-widest uppercase">Absent</div>
            <div className="text-[18px] font-semibold text-rose-800">{summary.absent}</div>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <div className="text-[11px] text-amber-700 tracking-widest uppercase">Late</div>
            <div className="text-[18px] font-semibold text-amber-800">{summary.late}</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-[11px] text-slate-600 tracking-widest uppercase">School Days</div>
            <div className="text-[18px] font-semibold text-slate-800">{schoolDays}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading } = useStudent(id);
  const { exams, fees } = useDataStore();

  const fallbackStudent = {
    id: id || "S101",
    admNo: "ADM001",
    name: "Aarav Sharma",
    cls: "10",
    section: "A",
    roll: 1,
    dob: "2012-05-14",
    gender: "Male",
    bloodGroup: "O+",
    status: "Active",
    address: "B-42, Vasant Kunj, New Delhi",
    emergency: "+91 98765 43210",
    fatherName: "Rajesh Sharma",
    fatherPhone: "+91 98765 43210",
    fatherEmail: "rajesh.sharma@example.com",
    motherName: "Sunita Sharma",
  };

  const student = p || fallbackStudent;
  const initials = student.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  const studentExam = exams.find((e) => e.admNo === student.admNo) || { marks: 88, outOf: 100, grade: "A" };
  const studentFee = fees.find((f) => f.admNo === student.admNo) || { status: "Paid", term: 2, due: "15 Jul 2026" };

  return (
    <div data-testid="student-profile" className="max-w-[1400px] mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <div className="glass rounded-2xl p-6 md:p-7 reveal">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-2xl font-bold shadow-sm">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Student · {student.admNo}</div>
            <h1 className="font-display title-dot text-[36px] leading-tight font-bold text-slate-900 tracking-tight mt-0.5">{student.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Class {student.cls}-{student.section}</span>
              <span className="rounded-full bg-white/70 border border-white px-3 py-1 text-[11.5px] text-slate-600">Roll No. {student.roll}</span>
              <span className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${student.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{student.status}</span>
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
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Personal Details</div>
                <Field icon={IdCard} label="Admission No." value={student.admNo} />
                <Field icon={Cake} label="Date of Birth" value={student.dob} />
                <Field icon={GraduationCap} label="Class · Section · Roll" value={`Class ${student.cls}-${student.section} · Roll ${student.roll}`} />
                <Field icon={Droplet} label="Blood Group" value={student.bloodGroup} />
                <Field icon={Phone} label="Emergency Contact" value={student.emergency} />
                <Field icon={MapPin} label="Address" value={student.address} />
              </div>
              <div className="glass-soft rounded-xl p-5 space-y-4">
                <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">Parent / Guardian Information</div>
                <div>
                  <div className="text-[12px] text-slate-500">Father</div>
                  <div className="text-[14px] font-medium text-slate-800">{student.fatherName || "—"}</div>
                  <div className="mt-2 space-y-2">
                    <Field icon={Mail} label="Email" value={student.fatherEmail} />
                    <Field icon={Phone} label="Phone" value={student.fatherPhone} />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[12px] text-slate-500">Mother</div>
                  <div className="text-[14px] font-medium text-slate-800">{student.motherName || "—"}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceTab studentId={student.id} />
          </TabsContent>

          <TabsContent value="fees" className="mt-6">
            <div className="glass-soft rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[16px]">Academic Fee Status</h3>
                    <p className="text-[12px] text-slate-500">Term 2 Session 2026-27</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${studentFee.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  {studentFee.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-[13px]">
                <div>
                  <span className="text-slate-400 text-[11px] block uppercase">Total Billed</span>
                  <span className="font-semibold text-slate-800">{formatINR(35000)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block uppercase">Payment Due Date</span>
                  <span className="font-semibold text-slate-800">{studentFee.due}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block uppercase">Term</span>
                  <span className="font-semibold text-slate-800">Term 2</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="mt-6">
            <div className="glass-soft rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#29ABE2] grid place-items-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[16px]">Term 1 Examination Results</h3>
                    <p className="text-[12px] text-slate-500">Grade Card Breakdown</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#29ABE2] text-white text-[12px] font-bold">
                  Grade {studentExam.grade} ({studentExam.marks}%)
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-[11px] tracking-wider text-slate-500 uppercase">
                      <th className="px-5 py-3 font-semibold">Subject</th>
                      <th className="px-5 py-3 font-semibold text-center">Marks</th>
                      <th className="px-5 py-3 font-semibold text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-800">Mathematics</td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">{studentExam.marks} / 100</td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-700">{studentExam.grade}</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-800">Physics</td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">90 / 100</td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-700">A+</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-800">Chemistry</td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">84 / 100</td>
                      <td className="px-5 py-3 text-center font-bold text-blue-700">A</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-800">English</td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">92 / 100</td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-700">A+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}