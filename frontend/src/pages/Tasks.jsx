import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, CheckCircle2, Clock, AlertTriangle, Trash2, Filter } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const CATEGORIES = ["Academic", "Administration", "Maintenance", "Events", "Finance", "Transport", "Other"];

const STATUS_CONFIG = {
  PENDING: { label: "Pending", classes: "bg-amber-50 text-amber-700 border border-amber-200" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-blue-50 text-blue-700 border border-blue-200" },
  COMPLETED: { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

const PRIORITY_CONFIG = {
  LOW: { label: "Low", classes: "bg-slate-100 text-slate-600" },
  MEDIUM: { label: "Medium", classes: "bg-blue-50 text-blue-700" },
  HIGH: { label: "High", classes: "bg-amber-50 text-amber-700" },
  URGENT: { label: "Urgent", classes: "bg-red-50 text-red-700" },
};

function getNextStatus(current) {
  const order = { PENDING: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: "PENDING" };
  return order[current] || "PENDING";
}

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user?.role === "superAdmin" || user?.role === "schoolAdmin";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "MEDIUM",
    category: "Academic",
    dueDate: "",
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({ status: statusFilter, priority: priorityFilter, category: categoryFilter, search });
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  const fetchStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(Array.isArray(res) ? res : res.staff || []);
    } catch {
      setStaffList([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createTask(form);
      toast.success("Task created successfully");
      setShowCreateDialog(false);
      setForm({ title: "", description: "", assignee: "", priority: "MEDIUM", category: "Academic", dueDate: "" });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const next = getNextStatus(task.status);
    try {
      await api.updateTask(task.id, { status: next });
      toast.success(`Task marked as ${STATUS_CONFIG[next].label}`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async () => {
    if (!showDeleteDialog) return;
    setSubmitting(true);
    try {
      await api.deleteTask(showDeleteDialog.id);
      toast.success("Task deleted successfully");
      setShowDeleteDialog(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

  return (
    <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="TASK MANAGEMENT"
        title="Task Board"
        subtitle="Create, assign, and track tasks across your school team."
        right={
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2 text-xs font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Task
          </button>
        }
      />

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Tasks", value: totalTasks, icon: Filter, color: "border-l-slate-400" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "border-l-amber-500" },
          { label: "In Progress", value: inProgressCount, icon: AlertTriangle, color: "border-l-blue-500" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "border-l-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`glass rounded-2xl p-5 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">{label}</span>
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
            <div className="font-display text-2xl font-bold text-slate-900 mt-2">{value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/80 border border-slate-200 text-xs outline-none focus:border-[#29ABE2]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs rounded-full bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs rounded-full bg-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs rounded-full bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#29ABE2]" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-6">
          <EmptyState
            icon={CheckCircle2}
            title="No tasks found"
            hint="Create a task to get started, or adjust your filters."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
            const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

            return (
              <div
                key={task.id}
                className="glass rounded-2xl p-5 hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className="shrink-0"
                    title="Click to advance status"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <Clock className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Clock className="h-8 w-8 text-amber-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className={`font-display font-bold text-sm leading-snug ${task.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {task.title}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityConf.classes}`}>
                        {priorityConf.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConf.classes}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      {task.assignee && (
                        <span className="font-semibold text-slate-700">
                          Assigned: {task.assignee}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.category && (
                        <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 font-medium">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusToggle(task)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                        task.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-[#29ABE2] text-white hover:bg-[#0e7fb1]"
                      }`}
                    >
                      {task.status === "COMPLETED" ? "Reopen" : `Mark ${getNextStatus(task.status) === "COMPLETED" ? "Complete" : "In Progress"}`}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteDialog(task)}
                        className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 py-2 text-[13px]">
              <div>
                <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Prepare annual day props"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#29ABE2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the task..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#29ABE2]"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Assignee</label>
                <Select value={form.assignee || "none"} onValueChange={(v) => setForm({ ...form, assignee: v === "none" ? "" : v })}>
                  <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}{s.jobTitle ? ` (${s.jobTitle})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Priority</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Category</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#29ABE2]"
                />
              </div>

              <DialogFooter className="pt-2">
                <button type="button" onClick={() => setShowCreateDialog(false)} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Task
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-slate-600 py-2">
            Are you sure you want to delete <span className="font-semibold text-slate-900">"{showDeleteDialog?.title}"</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <button onClick={() => setShowDeleteDialog(null)} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleDeleteTask} disabled={submitting} className="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
