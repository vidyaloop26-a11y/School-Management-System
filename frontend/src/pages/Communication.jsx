import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useNotices, useCreateNotice } from "@/lib/queries";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today";

function AdminForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const createMutation = useCreateNotice();
  const queryClient = useQueryClient();
  const { data: notices = [], isLoading: noticesLoading } = useNotices();

  const handleSend = async () => {
    if (!title || !body) {
      toast.error("Title and message are required");
      return;
    }
    if (audience === "class" && (!cls || !section)) {
      toast.error("Class and section are required for class-scoped notice");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title,
        body,
        audience: audience === "class" ? "class" : "all",
        ...(audience === "class" ? { cls, section } : {}),
      });
      toast.success("Notice published");
      setTitle("");
      setBody("");
      setCls("");
      setSection("");
      setAudience("all");
      queryClient.invalidateQueries({ queryKey: ["communication", "notices"] });
    } catch (err) {
      toast.error(err?.message || "Could not publish notice");
    }
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Delete notice "${notice.title}"? This cannot be undone.`)) return;
    setDeletingId(notice.id);
    try {
      await api.deleteNotice(notice.id);
      toast.success("Notice deleted");
      queryClient.invalidateQueries({ queryKey: ["communication", "notices"] });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete notice");
    } finally {
      setDeletingId(null);
    }
  };

  const label = audience === "all" ? "All" : "Specific Class";

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN · COMMUNICATION"
        title="Notice Board"
        subtitle="Publish, view, and manage school notices."
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        {/* Create Form */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-6 reveal">
            <div className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase mb-4 flex items-center gap-2">
              <Send className="h-3.5 w-3.5 text-[#29ABE2]" /> New Notice
            </div>
            <div>
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Title</label>
              <input
                data-testid="notice-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Parent-Teacher Meeting Schedule Released"
                className="mt-2 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-2.5 text-[13.5px]"
              />
            </div>
            <div className="mt-4">
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Message</label>
              <textarea
                data-testid="notice-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write your notice…"
                className="mt-2 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-3 text-[13.5px] resize-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[220px]">
                <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Audience</label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger data-testid="notice-audience" className="mt-2 rounded-xl bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audience === "class" && (
                <div className="flex items-end gap-2">
                  <div className="min-w-[120px]">
                    <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Class</label>
                    <input
                      data-testid="notice-cls"
                      value={cls}
                      onChange={(e) => setCls(e.target.value)}
                      placeholder="e.g. 8"
                      className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] outline-none px-3 py-2 text-[13px]"
                    />
                  </div>
                  <div className="min-w-[100px]">
                    <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Section</label>
                    <input
                      data-testid="notice-section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="e.g. A"
                      className="mt-1.5 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] outline-none px-3 py-2 text-[13px]"
                    />
                  </div>
                </div>
              )}
              <button
                data-testid="notice-send"
                onClick={handleSend}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {createMutation.isPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>

        {/* Published Notices List */}
        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Published Notices
            {notices.length > 0 && (
              <span className="ml-auto bg-[#29ABE2]/10 text-[#0c6a99] px-2 py-0.5 rounded-full text-[11px] font-bold">{notices.length}</span>
            )}
          </div>
          {noticesLoading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-[#29ABE2] mx-auto" /></div>
          ) : notices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[13px] flex flex-col items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              No notices published yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto thin-scroll pr-1">
              {notices.map((n) => (
                <div key={n.id} className="glass-soft rounded-xl p-4 group hover:border-slate-200 transition">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-bold text-[13.5px] text-slate-800 leading-snug">{n.title}</div>
                    <button
                      onClick={() => handleDelete(n)}
                      disabled={deletingId === n.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                      title="Delete notice"
                    >
                      {deletingId === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="text-[12px] text-slate-500 mb-1.5">
                    {n.audience === "class" && n.cls ? `Class ${n.cls}-${n.section || ""}` : "All"}
                    <span className="mx-1.5">·</span>
                    {fmtDate(n.createdAt)}
                    {n.createdBy?.name && <><span className="mx-1.5">·</span>by {n.createdBy.name}</>}
                  </div>
                  <div className="text-[12.5px] text-slate-600 leading-relaxed line-clamp-3">{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoticeBoard() {
  const { data: notices = [], isLoading, isError } = useNotices();

  if (isLoading) {
    return (
      <div>
        <PageHeader eyebrow="COMMUNICATION" title="Notice Board" subtitle="Loading notices…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader eyebrow="COMMUNICATION" title="Notice Board" subtitle="Announcements from the school administration." />
        <p className="text-sm text-red-500 mt-6">Could not load notices.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="COMMUNICATION"
        title="Notice Board"
        subtitle="Announcements from the school administration."
      />
      <ul className="space-y-4 max-w-3xl">
        {notices.length === 0 ? (
          <li className="text-sm text-slate-400">No notices have been posted.</li>
        ) : (
          notices.map((n, i) => (
            <li
              key={n.id}
              data-testid={`notice-${n.id}`}
              className={`glass rounded-2xl p-6 reveal d${Math.min(i + 1, 5)} flex items-start gap-4`}
            >
              <div className="h-11 w-11 rounded-xl bg-[#e6f4fb] text-[#0c6a99] grid place-items-center shrink-0">
                <Megaphone className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-display text-[18px] font-bold text-slate-900 tracking-tight leading-snug">{n.title}</div>
                  <span className="text-[11.5px] text-slate-400 shrink-0">{fmtDate(n.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-full bg-white/70 border border-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Audience · {n.audience === "class" && n.cls ? `${n.cls}-${n.section || ""}` : n.audience === "all" ? "All" : "All"}
                  </span>
                </div>
                <div className="text-[13.5px] text-slate-700 leading-relaxed">{n.body}</div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function Communication() {
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div data-testid="communication-page" className="max-w-[1400px] mx-auto">
      {role === "schoolAdmin" || role === "superAdmin" ? <AdminForm /> : <NoticeBoard />}
    </div>
  );
}
