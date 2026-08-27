import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckSquare, Clock, ArrowLeft, Pen } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useStudents } from "@/lib/queries";

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];
const TERMS = ["Term 1", "Term 2", "Term 3", "Half Yearly", "Final"];
const SUBJECTS = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer Science", "Sanskrit", "French", "Art", "Physical Education"];

const STATUS_CONFIG = {
  NOT_STARTED: { label: "Not Started", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Pen },
  COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckSquare },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function StatsStrip({ batches }) {
  const total = batches.length;
  const inProgress = batches.filter((b) => b.status === "IN_PROGRESS").length;
  const completed = batches.filter((b) => b.status === "COMPLETED").length;

  const stats = [
    { label: "Total Batches", value: total, icon: CheckSquare, color: "from-[#29ABE2] to-[#0c6a99]" },
    { label: "In Progress", value: inProgress, icon: Pen, color: "from-blue-500 to-blue-600" },
    { label: "Completed", value: completed, icon: CheckSquare, color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="glass rounded-2xl p-4 border border-white/80 shadow-xs flex items-center gap-3">
          <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${stat.color} grid place-items-center text-white shadow-xs shrink-0`}>
            <stat.icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="font-display text-[24px] font-bold text-slate-900 tracking-tight leading-none">{stat.value}</div>
            <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateBatchDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    subject: "",
    cls: "1",
    section: "A",
    term: "Term 1",
    totalCopies: 1,
    assignedTeacher: "",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) {
      toast.error("Subject is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createCopyCheckBatch(form);
      toast.success("Copy check batch created");
      setForm({ subject: "", cls: "1", section: "A", term: "Term 1", totalCopies: 1, assignedTeacher: "", dueDate: "" });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[20px]">
            <Plus className="h-5 w-5 text-[#29ABE2]" />
            Create Copy Check Batch
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Subject *</label>
            <Select value={form.subject} onValueChange={(val) => setForm((p) => ({ ...p, subject: val }))}>
              <SelectTrigger className="h-9 text-sm rounded-xl">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Class *</label>
              <Select value={form.cls} onValueChange={(val) => setForm((p) => ({ ...p, cls: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Section *</label>
              <Select value={form.section} onValueChange={(val) => setForm((p) => ({ ...p, section: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Term *</label>
              <Select value={form.term} onValueChange={(val) => setForm((p) => ({ ...p, term: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Total Copies *</label>
              <input
                type="number"
                min="1"
                value={form.totalCopies}
                onChange={(e) => setForm((p) => ({ ...p, totalCopies: parseInt(e.target.value) || 1 }))}
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Assigned Teacher</label>
            <input
              type="text"
              value={form.assignedTeacher}
              onChange={(e) => setForm((p) => ({ ...p, assignedTeacher: e.target.value }))}
              placeholder="e.g. Mrs. Sharma"
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#29ABE2]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#29ABE2]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-[#29ABE2] hover:bg-[#0e7fb1] text-white">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddEntryDialog({ open, onOpenChange, batch, students, onCreated }) {
  const [form, setForm] = useState({ studentId: "", marks: "", maxMarks: "" });
  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = students.filter(
    (s) => String(s.cls || s.class) === String(batch?.cls) && s.section === batch?.section
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || form.marks === "" || form.maxMarks === "") {
      toast.error("Student, marks, and max marks are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.addCopyCheckEntry(batch.id, {
        studentId: form.studentId,
        marks: Number(form.marks),
        maxMarks: Number(form.maxMarks),
      });
      toast.success("Entry added successfully");
      setForm({ studentId: "", marks: "", maxMarks: "" });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[20px]">
            <Plus className="h-5 w-5 text-[#29ABE2]" />
            Add Copy Check Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Student *</label>
            <Select value={form.studentId} onValueChange={(val) => setForm((p) => ({ ...p, studentId: val }))}>
              <SelectTrigger className="h-9 text-sm rounded-xl">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.length === 0 ? (
                  <SelectItem value="none" disabled>No students in this class</SelectItem>
                ) : (
                  filteredStudents.map((s) => (
                    <SelectItem key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Marks Obtained *</label>
              <input
                type="number"
                min="0"
                value={form.marks}
                onChange={(e) => setForm((p) => ({ ...p, marks: e.target.value }))}
                placeholder="e.g. 85"
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Max Marks *</label>
              <input
                type="number"
                min="1"
                value={form.maxMarks}
                onChange={(e) => setForm((p) => ({ ...p, maxMarks: e.target.value }))}
                placeholder="e.g. 100"
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-[#29ABE2] hover:bg-[#0e7fb1] text-white">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BatchDetailView({ batch, onBack, onRefresh }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const { data: studentsData } = useStudents();
  const students = Array.isArray(studentsData) ? studentsData : [];

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCopyCheckBatches({ status: batch.status, cls: batch.cls, subject: batch.subject });
      const found = (res.batches || []).find((b) => b.id === batch.id);
      setEntries(found?.entries || batch.entries || []);
    } catch {
      setEntries(batch.entries || []);
    } finally {
      setLoading(false);
    }
  }, [batch]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const getStudentName = (id) => {
    const s = students.find((st) => (st.id || st._id) === id);
    return s?.name || "Unknown";
  };

  const completedCount = entries.filter((e) => e.marks !== undefined && e.marks !== null).length;
  const isComplete = batch.totalCopies > 0 && completedCount >= batch.totalCopies;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex-1">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {batch.subject} — Class {batch.cls}-{batch.section}
          </div>
          <div className="font-display text-[22px] font-bold text-slate-900 leading-tight mt-0.5">
            {batch.term}
          </div>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass rounded-xl p-3 border border-white/80 text-center">
          <div className="font-display text-[20px] font-bold text-slate-900">{batch.totalCopies}</div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Copies</div>
        </div>
        <div className="glass rounded-xl p-3 border border-white/80 text-center">
          <div className="font-display text-[20px] font-bold text-blue-600">{completedCount}</div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Checked</div>
        </div>
        <div className="glass rounded-xl p-3 border border-white/80 text-center">
          <div className={`font-display text-[20px] font-bold ${isComplete ? "text-emerald-600" : "text-slate-900"}`}>
            {batch.totalCopies - completedCount}
          </div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Remaining</div>
        </div>
      </div>

      {batch.assignedTeacher && (
        <div className="text-[12px] text-slate-500 mb-4">
          Assigned to: <span className="font-semibold text-slate-700">{batch.assignedTeacher}</span>
          {batch.dueDate && <span className="ml-3">Due: <span className="font-semibold text-slate-700">{new Date(batch.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></span>}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Entries ({entries.length})
        </div>
        {batch.status !== "COMPLETED" && (
          <button
            onClick={() => setAddEntryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3.5 py-2 text-[11px] font-bold shadow-xs"
          >
            <Plus className="h-3 w-3" /> Add Entry
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Pen}
          title="No entries yet"
          hint="Add copy check entries for each student in this batch."
        />
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
            <table className="min-w-full text-[13px]">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold text-center">Marks</th>
                  <th className="px-5 py-3 font-semibold text-center">Max Marks</th>
                  <th className="px-5 py-3 font-semibold text-center">Percentage</th>
                  <th className="px-5 py-3 font-semibold">Checked Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const pct = e.maxMarks > 0 ? Math.round((e.marks / e.maxMarks) * 100) : 0;
                  return (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{getStudentName(e.studentId)}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">{e.marks}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-slate-600">{e.maxMarks}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          pct >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          pct >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                        {e.checkedDate ? new Date(e.checkedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2.5">
            {entries.map((e) => {
              const pct = e.maxMarks > 0 ? Math.round((e.marks / e.maxMarks) * 100) : 0;
              return (
                <div key={e.id} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-800 text-[14px]">{getStudentName(e.studentId)}</div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      pct >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      pct >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-2">
                    <span>Marks: <span className="font-semibold text-slate-700">{e.marks}/{e.maxMarks}</span></span>
                    <span>{e.checkedDate ? new Date(e.checkedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddEntryDialog
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        batch={batch}
        students={students}
        onCreated={() => { fetchEntries(); onRefresh?.(); }}
      />
    </div>
  );
}

export default function CopyChecking() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const { data: studentsData } = useStudents();
  const students = Array.isArray(studentsData) ? studentsData : [];

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (clsFilter !== "all") params.cls = clsFilter;
      if (subjectFilter !== "all") params.subject = subjectFilter;
      const res = await api.getCopyCheckBatches(params);
      setBatches(res.batches || []);
    } catch {
      toast.error("Failed to load copy check batches");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clsFilter, subjectFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleDelete = async (id) => {
    try {
      await api.deleteCopyCheckBatch(id);
      toast.success("Batch deleted");
      fetchBatches();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete batch");
    }
  };

  const subjectsList = [...new Set(batches.map((b) => b.subject).filter(Boolean))].sort();

  if (selectedBatch) {
    return (
      <div data-testid="copychecking-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
        <PageHeader
          eyebrow="ACADEMICS · COPY CHECKING"
          title="Batch Details"
          subtitle="View and manage copy check entries for this batch."
        />
        <div className="glass rounded-2xl p-3 sm:p-5 reveal">
          <BatchDetailView
            batch={selectedBatch}
            onBack={() => setSelectedBatch(null)}
            onRefresh={fetchBatches}
          />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="copychecking-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · COPY CHECKING"
        title="Copy Checking"
        subtitle="Manage copy check batches, track student marks, and monitor progress."
        right={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> New Batch
          </button>
        }
      />

      <StatsStrip batches={batches} />

      <div className="glass rounded-2xl p-3 sm:p-5 reveal">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mr-2">
            <Pen className="h-4 w-4 text-[#29ABE2]" /> Batch List
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[115px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clsFilter} onValueChange={setClsFilter}>
            <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[90px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>Class {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[130px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjectsList.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={fetchBatches}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
          >
            <Loader2 className="h-3.5 w-3.5 text-[#29ABE2]" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon={Pen}
            title="No copy check batches"
            hint="Create your first batch to start tracking copy checking."
          />
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">Class</th>
                    <th className="px-5 py-3 font-semibold">Term</th>
                    <th className="px-5 py-3 font-semibold text-center">Copies</th>
                    <th className="px-5 py-3 font-semibold text-center">Checked</th>
                    <th className="px-5 py-3 font-semibold">Teacher</th>
                    <th className="px-5 py-3 font-semibold">Due Date</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{b.subject}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{b.cls}-{b.section}</td>
                      <td className="px-5 py-3.5 text-slate-600">{b.term}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">{b.totalCopies}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700">
                          <CheckSquare className="h-3 w-3 text-[#29ABE2]" /> {b.completedCopies ?? (b.entries?.length || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{b.assignedTeacher || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                        {b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBatch(b)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[11px] font-semibold shadow-xs"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2.5">
              {batches.map((b) => (
                <div key={b.id} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {b.subject}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="font-medium text-slate-800 text-[14px]">Class {b.cls}-{b.section}</div>
                  <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-1.5">
                    <span>{b.term}</span>
                    <span>Copies: <span className="font-semibold text-slate-700">{b.completedCopies ?? (b.entries?.length || 0)}/{b.totalCopies}</span></span>
                  </div>
                  {b.assignedTeacher && (
                    <div className="text-[11.5px] text-slate-500 mt-1">Teacher: <span className="font-semibold text-slate-700">{b.assignedTeacher}</span></div>
                  )}
                  {b.dueDate && (
                    <div className="text-[11.5px] text-slate-500 mt-0.5">Due: <span className="font-semibold text-slate-700">{new Date(b.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span></div>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                    <button
                      onClick={() => setSelectedBatch(b)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[11px] font-semibold flex-1 justify-center"
                    >
                      View Entries
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CreateBatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchBatches}
      />
    </div>
  );
}
