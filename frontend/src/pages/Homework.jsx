import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useRole } from "@/lib/RoleContext";
import { HOMEWORK } from "@/lib/stage2Data";
import { SUBJECT_COLORS } from "@/lib/mockData";
import { CheckCircle2, Clock, Circle, Check } from "lucide-react";

function SubjectPill({ subject }) {
  const col = SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${col.bg} px-2.5 py-0.5 text-[11px] font-medium ${col.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} /> {subject}
    </span>
  );
}

function TeacherList() {
  return (
    <div>
      <PageHeader
        eyebrow="TEACHER · HOMEWORK"
        title="Homework Tracker"
        subtitle="Assignments you have posted, with submission counters."
      />
      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Homework</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {HOMEWORK.map((h) => (
                <tr key={h.id} data-testid={`hw-teacher-${h.id}`} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                  <td className="px-5 py-3.5"><SubjectPill subject={h.subject} /></td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{h.title}</td>
                  <td className="px-5 py-3.5 text-slate-600">{h.due}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700">
                      <Check className="h-3 w-3 text-[#29ABE2]" /> {h.submissions}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChecklistView() {
  const [items, setItems] = useState(HOMEWORK.map((h) => ({ ...h })));
  const toggle = (id) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: i.status === "Pending" ? "Submitted" : "Pending" } : i));

  return (
    <div>
      <PageHeader
        eyebrow="HOMEWORK"
        title="Your Checklist"
        subtitle="Tick off submissions as your child completes them."
      />
      <ul className="space-y-3 max-w-3xl">
        {items.map((h, i) => {
          const done = h.status === "Submitted";
          return (
            <li key={h.id} data-testid={`hw-parent-${h.id}`} className={`glass rounded-2xl p-5 reveal d${Math.min(i + 1, 5)} flex items-center gap-4`}>
              <button
                onClick={() => toggle(h.id)}
                data-testid={`hw-toggle-${h.id}`}
                className={`h-10 w-10 rounded-full grid place-items-center border transition ${done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-slate-400 hover:border-[#29ABE2] hover:text-[#29ABE2]"}`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SubjectPill subject={h.subject} />
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Due {h.due}</span>
                </div>
                <div className={`text-[13.5px] font-medium ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{h.title}</div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0 ${done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {done ? "Submitted" : "Pending"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Homework() {
  const { role } = useRole();
  return (
    <div data-testid="homework-page" className="max-w-[1400px] mx-auto">
      {role === "Parent" ? <ChecklistView /> : <TeacherList />}
    </div>
  );
}
