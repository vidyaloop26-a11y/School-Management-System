import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { SUBJECT_COLORS } from "@/lib/mockData";
import { CheckCircle2, Clock, Circle, Check, PartyPopper, BookOpen } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

function SubjectPill({ subject }) {
  const col = SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${col.bg} px-2.5 py-0.5 text-[11px] font-medium ${col.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} /> {subject}
    </span>
  );
}

function TeacherList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newHw, setNewHw] = useState({ cls: "8-A", subject: "Mathematics", title: "", description: "", dueDate: "" });

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await api.getHomework();
        setItems(res.homework || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, []);

  const handleCreate = async () => {
    if (!newHw.title.trim() || !newHw.dueDate) {
      toast.error("Title and due date are required");
      return;
    }
    try {
      const [cl, sec] = newHw.cls.split("-");
      await api.createHomework({
        cls: cl,
        section: sec,
        subject: newHw.subject,
        title: newHw.title.trim(),
        description: newHw.description || undefined,
        dueDate: newHw.dueDate,
      });
      toast.success("Homework assigned");
      setShowForm(false);
      setNewHw({ cls: "8-A", subject: "Mathematics", title: "", description: "", dueDate: "" });
      const res = await api.getHomework();
      setItems(res.homework || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create homework");
    }
  };

  const formatDue = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <PageHeader
        eyebrow="TEACHER · HOMEWORK"
        title="Homework Tracker"
        subtitle="Assignments you have posted, with submission counters."
      />
      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-[#29ABE2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No homework assigned yet"
            hint="Create homework assignments to track student submissions."
          />
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <button
                data-testid="assign-homework-btn"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-[12.5px] font-medium shadow-sm"
              >
                <BookOpen className="h-4 w-4" /> Assign Homework
              </button>
            </div>
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">Homework</th>
                    <th className="px-5 py-3 font-semibold">Class</th>
                    <th className="px-5 py-3 font-semibold">Due Date</th>
                    <th className="px-5 py-3 font-semibold">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((h) => (
                    <tr key={h.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                      <td className="px-5 py-3.5"><SubjectPill subject={h.subject} /></td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{h.title}</td>
                      <td className="px-5 py-3.5 text-slate-600">{h.cls}-{h.section}</td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDue(h.dueDate)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700">
                          <Check className="h-3 w-3 text-[#29ABE2]" /> {h.submittedCount ?? 0}/{h.submissionCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2.5">
              {items.map((h) => (
                <div key={h.id} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <SubjectPill subject={h.subject} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700 shrink-0">
                      <Check className="h-3 w-3 text-[#29ABE2]" /> {h.submittedCount ?? 0}/{h.submissionCount ?? 0}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 text-[14px]">{h.title}</div>
                  <div className="text-[11.5px] text-slate-500 mt-1">{h.cls}-{h.section} · Due {formatDue(h.dueDate)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass rounded-2xl p-6">
            <div className="font-display text-[20px] font-bold text-slate-900 mb-4">Assign Homework</div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Class</label>
                <Select value={newHw.cls} onValueChange={(v) => setNewHw({ ...newHw, cls: v })}>
                  <SelectTrigger className="mt-1.5 w-full rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["8-A", "8-B", "9-A", "9-B", "10-A", "10-B"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Subject</label>
                <Select value={newHw.subject} onValueChange={(v) => setNewHw({ ...newHw, subject: v })}>
                  <SelectTrigger className="mt-1.5 w-full rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Title</label>
                <input
                  value={newHw.title}
                  onChange={(e) => setNewHw({ ...newHw, title: e.target.value })}
                  placeholder="e.g. Chapter 5 exercises"
                  className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px]"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Description</label>
                <textarea
                  value={newHw.description}
                  onChange={(e) => setNewHw({ ...newHw, description: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px] resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Due Date</label>
                <input
                  type="date"
                  value={newHw.dueDate}
                  onChange={(e) => setNewHw({ ...newHw, dueDate: e.target.value })}
                  className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreate} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2 text-[13px] font-medium">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistView() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const childId = user?.studentId || user?.student?.id;

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await api.getHomework();
        const homework = res.homework || [];
        let statuses = {};
        try {
          if (childId) {
            const subs = await Promise.all(homework.map((h) => api.getHomeworkSubmissions(h.id).catch(() => ({ submissions: [] }))));
            homework.forEach((h, idx) => {
              const sub = subs[idx]?.submissions?.find((s) => s.studentId === childId);
              if (sub) statuses[h.id] = sub.status || "Pending";
            });
          }
        } catch {
          statuses = {};
        }
        setItems(homework.map((h) => ({ ...h, status: statuses[h.id] || "Pending" })));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, [childId]);

  const toggle = async (id) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newStatus = target.status === "Pending" ? "Submitted" : "Pending";
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    try {
      if (childId) {
        await api.submitHomework(id, { studentId: childId, status: newStatus });
      } else {
        toast.error("Unable to identify student link on this account");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update submission");
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: target.status } : i));
    }
  };

  const allDone = items.length > 0 && items.every((i) => i.status === "Submitted");

  const formatDue = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <PageHeader
        eyebrow="HOMEWORK"
        title="Your Checklist"
        subtitle="Tick off submissions as your child completes them."
      />
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-[#29ABE2] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No homework assigned"
          hint="New assignments will appear here when teachers post them."
        />
      ) : (
        <ul className="space-y-3 max-w-3xl">
          {allDone && (
            <li className="glass rounded-2xl">
              <EmptyState
                icon={PartyPopper}
                title="No pending homework right now"
                hint="You're all caught up. New assignments will appear here."
              />
            </li>
          )}
          {items.map((h, i) => {
            const done = h.status === "Submitted";
            return (
              <li key={h.id} className={`glass rounded-2xl p-5 reveal d${Math.min(i + 1, 5)} flex items-center gap-4`}>
                <button
                  onClick={() => toggle(h.id)}
                  className={`h-10 w-10 rounded-full grid place-items-center border transition ${done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-slate-400 hover:border-[#29ABE2] hover:text-[#29ABE2]"}`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SubjectPill subject={h.subject} />
                    <span className="text-[11px] text-slate-400 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Due {formatDue(h.dueDate)}</span>
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
      )}
    </div>
  );
}

export default function Homework() {
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div data-testid="homework-page" className="max-w-[1400px] mx-auto">
      {role === "parent" ? <ChecklistView /> : <TeacherList />}
    </div>
  );
}
