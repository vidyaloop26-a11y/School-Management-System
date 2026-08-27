import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  BarChart3,
  List,
  RotateCw,
  Calendar,
  Target,
  MessageSquare,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];
const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BEHIND"];

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Target },
  COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  BEHIND: { label: "Behind", color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
};

function ProgressPill({ percent }) {
  let barColor = "bg-rose-500";
  let textColor = "text-rose-700";
  let bgColor = "bg-rose-50";
  let borderColor = "border-rose-200";

  if (percent >= 80) {
    barColor = "bg-emerald-500";
    textColor = "text-emerald-700";
    bgColor = "bg-emerald-50";
    borderColor = "border-emerald-200";
  } else if (percent >= 50) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-200";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold ${textColor} tabular-nums min-w-[36px] text-right`}>
        {Math.round(percent)}%
      </span>
    </div>
  );
}

function ClassCard({ item, subjects }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white shadow-xs shrink-0">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Class {item.cls}-{item.section}</div>
            <div className="text-[13.5px] font-bold text-slate-900 leading-tight mt-0.5">
              {item.completedTopics}/{item.totalTopics} topics
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
          item.overallPercent >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
          item.overallPercent >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
          {Math.round(item.overallPercent)}% done
        </span>
      </div>

      <div className="space-y-2.5 pt-1">
        {(item.subjects || []).slice(0, 6).map((sub) => (
          <div key={sub.subject} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 truncate">{sub.subject}</span>
              <span className="text-[10px] text-slate-400 tabular-nums">{sub.completed}/{sub.total}</span>
            </div>
            <ProgressPill percent={sub.percent} />
          </div>
        ))}
        {(item.subjects || []).length > 6 && (
          <div className="text-[10px] text-slate-400 text-center">+{(item.subjects || []).length - 6} more subjects</div>
        )}
      </div>
    </div>
  );
}

function PaceDashboard({ onRefresh }) {
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSyllabusDashboard();
      setDashboard(res.dashboard || []);
    } catch {
      toast.error("Failed to load dashboard data");
      setDashboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleScopeChange = () => fetchData();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchData]);

  const allSubjects = [...new Set(dashboard.flatMap((d) => (d.subjects || []).map((s) => s.subject)))].sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#29ABE2]" />
          Syllabus Pace Overview
        </div>
        <button
          onClick={() => { fetchData(); onRefresh?.(); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs"
        >
          <RotateCw className="h-3.5 w-3.5 text-[#29ABE2]" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
          <span className="text-xs">Loading dashboard...</span>
        </div>
      ) : dashboard.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No syllabus data yet"
          hint="Create syllabus topics to see pace overview across classes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dashboard.map((item) => (
            <ClassCard key={`${item.cls}-${item.section}`} item={item} subjects={allSubjects} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicListView({ onRefresh }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsList, setSubjectsList] = useState([]);

  const [clsFilter, setClsFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [markingId, setMarkingId] = useState(null);
  const [markNotes, setMarkNotes] = useState("");
  const [markDialogOpen, setMarkDialogOpen] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (clsFilter !== "all") params.cls = clsFilter;
      if (sectionFilter !== "all") params.section = sectionFilter;
      if (subjectFilter !== "all") params.subject = subjectFilter;
      const res = await api.getSyllabusTopics(params);
      let list = res.topics || [];
      if (statusFilter !== "all") {
        list = list.filter((t) => t.status === statusFilter);
      }
      setTopics(list);
    } catch {
      toast.error("Failed to load syllabus topics");
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [clsFilter, sectionFilter, subjectFilter, statusFilter]);

  useEffect(() => {
    fetchTopics();
    api.getSubjects()
      .then((res) => {
        if (res.subjects && res.subjects.length > 0) {
          setSubjectsList(res.subjects.map((s) => s.name));
        }
      })
      .catch(() => {});
    const handleScopeChange = () => fetchTopics();
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, [fetchTopics]);

  const handleMarkComplete = async () => {
    if (!markingId) return;
    try {
      await api.markSyllabusProgress(markingId, { notes: markNotes });
      toast.success("Topic marked as completed");
      setMarkDialogOpen(false);
      setMarkingId(null);
      setMarkNotes("");
      fetchTopics();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark progress");
    }
  };

  const handleStatusChange = async (topicId, newStatus) => {
    try {
      await api.updateSyllabusTopic(topicId, { status: newStatus });
      toast.success("Topic status updated");
      fetchTopics();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mr-2">
          <List className="h-4 w-4 text-[#29ABE2]" />
          Topic List
        </div>

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

        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[85px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sec</SelectItem>
            {SECTIONS.map((s) => (
              <SelectItem key={s} value={s}>Sec {s}</SelectItem>
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-[11px] font-semibold rounded-full bg-white border-slate-200 w-[115px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={fetchTopics}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
        >
          <RotateCw className="h-3.5 w-3.5 text-[#29ABE2]" />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
          <span className="text-xs">Loading topics...</span>
        </div>
      ) : topics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No topics found"
          hint="Create syllabus topics or adjust your filters."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="p-3 text-left">Topic</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-center">Class</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Target Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-800 max-w-[220px] truncate">{t.name || t.topic}</td>
                      <td className="p-3 text-slate-600">{t.subject}</td>
                      <td className="p-3 text-center font-mono text-slate-600">{t.cls}-{t.section}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-500">
                        {t.targetDate ? new Date(t.targetDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Select value={t.status} onValueChange={(val) => handleStatusChange(t.id, val)}>
                            <SelectTrigger className="h-7 text-[10px] font-semibold rounded-full bg-white border-slate-200 w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {t.status !== "COMPLETED" && (
                            <button
                              onClick={() => { setMarkingId(t.id); setMarkNotes(""); setMarkDialogOpen(true); }}
                              className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-2.5 py-1 text-[10px] font-bold shadow-xs"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {topics.map((t) => {
              const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;
              return (
                <div key={t.id} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                      {t.subject}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 text-[14px]">{t.name || t.topic}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Class {t.cls}-{t.section}</span>
                    <span>{t.targetDate ? new Date(t.targetDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "No date"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={t.status} onValueChange={(val) => handleStatusChange(t.id, val)}>
                      <SelectTrigger className="h-7 text-[10px] font-semibold rounded-full bg-white border-slate-200 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {t.status !== "COMPLETED" && (
                      <button
                        onClick={() => { setMarkingId(t.id); setMarkNotes(""); setMarkDialogOpen(true); }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1 text-[10px] font-bold shadow-xs shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Mark Progress Dialog */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Mark Topic as Completed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-slate-600">
              You are marking this topic as completed. Optionally add notes.
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Notes (optional)
              </label>
              <Textarea
                value={markNotes}
                onChange={(e) => setMarkNotes(e.target.value)}
                placeholder="Any notes about this topic completion..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleMarkComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateTopicDialog({ open, onOpenChange, subjectsList, onCreated }) {
  const [form, setForm] = useState({
    subject: "",
    cls: "1",
    section: "A",
    name: "",
    targetDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.name.trim()) {
      toast.error("Subject and topic name are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createSyllabusTopic({
        subject: form.subject,
        cls: form.cls,
        section: form.section,
        name: form.name.trim(),
        targetDate: form.targetDate || undefined,
      });
      toast.success("Syllabus topic created");
      setForm({ subject: "", cls: "1", section: "A", name: "", targetDate: "" });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create topic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#29ABE2]" />
            Create Syllabus Topic
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
                {subjectsList.map((s) => (
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Topic Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Chapter 3 - Photosynthesis"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Target Date (optional)
            </label>
            <Input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
              className="rounded-xl text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-[#29ABE2] hover:bg-[#0e7fb1] text-white">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create Topic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Syllabus() {
  const { user } = useAuth();
  const role = user?.role;

  const isHOD = role === "hod" || role === "principal" || role === "admin";
  const [view, setView] = useState(isHOD ? "dashboard" : "topics");
  const [createOpen, setCreateOpen] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getSubjects()
      .then((res) => {
        if (res.subjects && res.subjects.length > 0) {
          setSubjectsList(res.subjects.map((s) => s.name));
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div data-testid="syllabus-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · SYLLABUS TRACKING"
        title="Syllabus & Lesson Progress"
        subtitle="Track syllabus completion per class, section, and subject."
        right={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isHOD && (
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 shadow-xs">
                <button
                  onClick={() => setView("dashboard")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    view === "dashboard"
                      ? "bg-[#29ABE2] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setView("topics")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    view === "topics"
                      ? "bg-[#29ABE2] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <List className="h-3.5 w-3.5" /> Topics
                </button>
              </div>
            )}
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-xs font-bold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Topic
            </button>
          </div>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Topics", icon: BookOpen, color: "from-[#29ABE2] to-[#0c6a99]" },
          { label: "Completed", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
          { label: "In Progress", icon: Target, color: "from-blue-500 to-blue-600" },
          { label: "Behind", icon: AlertTriangle, color: "from-rose-500 to-rose-600" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 border border-white/80 shadow-xs flex items-center gap-3">
            <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${stat.color} grid place-items-center text-white shadow-xs shrink-0`}>
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="glass rounded-2xl p-3 sm:p-5 reveal">
        {view === "dashboard" ? (
          <PaceDashboard key={refreshKey} onRefresh={handleRefresh} />
        ) : (
          <TopicListView key={refreshKey} onRefresh={handleRefresh} />
        )}
      </div>

      <CreateTopicDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        subjectsList={subjectsList}
        onCreated={handleRefresh}
      />
    </div>
  );
}
