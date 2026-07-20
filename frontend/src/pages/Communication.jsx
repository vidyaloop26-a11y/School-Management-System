import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useRole } from "@/lib/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOTICES } from "@/lib/stage2Data";
import { Megaphone, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";

function AdminForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All");

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN · COMMUNICATION"
        title="Post Notice"
        subtitle="Broadcast to the school. Audience selector lets you target specific groups."
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal">
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
              rows={7}
              placeholder="Write your notice…"
              className="mt-2 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-3 text-[13.5px] resize-none"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[220px]">
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Audience</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger data-testid="notice-audience" className="mt-2 rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Specific Class">Specific Class</SelectItem>
                  <SelectItem value="Specific Staff">Specific Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button data-testid="notice-send" onClick={() => toast(`Notice sent to ${audience}`)} className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm">
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-4">Preview</div>
          <div className="glass-soft rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#e6f4fb] text-[#0c6a99] grid place-items-center shrink-0">
                <Megaphone className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13.5px] font-semibold text-slate-800 leading-snug min-h-[18px]">
                    {title || <span className="text-slate-400 font-normal">Notice title</span>}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">Today</span>
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">Audience · {audience}</div>
                <div className="text-[13px] text-slate-700 mt-2 leading-relaxed min-h-[40px]">
                  {body || <span className="text-slate-400">Your message will appear here…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeBoard() {
  return (
    <div>
      <PageHeader
        eyebrow="COMMUNICATION"
        title="Notice Board"
        subtitle="Announcements from the school administration."
      />
      <ul className="space-y-4 max-w-3xl">
        {NOTICES.map((n, i) => (
          <li key={n.id} data-testid={`notice-${n.id}`} className={`glass rounded-2xl p-6 reveal d${Math.min(i + 1, 5)} flex items-start gap-4`}>
            <div className="h-11 w-11 rounded-xl bg-[#e6f4fb] text-[#0c6a99] grid place-items-center shrink-0">
              <Megaphone className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-display text-[18px] font-bold text-slate-900 tracking-tight leading-snug">{n.title}</div>
                <span className="text-[11.5px] text-slate-400 shrink-0">{n.date}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-white/70 border border-white px-2 py-0.5 text-[11px] font-medium text-slate-600">Audience · {n.audience}</span>
              </div>
              <div className="text-[13.5px] text-slate-700 leading-relaxed">{n.body}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Communication() {
  const { role } = useRole();
  return (
    <div data-testid="communication-page" className="max-w-[1400px] mx-auto">
      {role === "Admin" ? <AdminForm /> : <NoticeBoard />}
    </div>
  );
}
