import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SUBJECT_COLORS } from "@/lib/mockData";
import { Send, BookOpen } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import EmptyState from "@/components/common/EmptyState";
import api from "@/lib/api";

function SubjectPill({ subject }) {
  const col = SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${col.bg} px-2.5 py-0.5 text-[11px] font-medium ${col.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} /> {subject}
    </span>
  );
}

function TeacherForm() {
  const [cls, setCls] = useState("8-A");
  const [subject, setSubject] = useState("Mathematics");
  const [note, setNote] = useState("");
  const [attach, setAttach] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.getSubjects?.() || { subjects: [] };
        setSubjects(res.subjects || []);
      } catch {
        setSubjects(["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer"]);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="TEACHER · DIGITAL DIARY"
        title="Post to Diary"
        subtitle="Share notes, reminders and homework with parents in one place."
      />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-6 reveal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Class</label>
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger data-testid="diary-class" className="mt-2 rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8-A">Class 8-A</SelectItem>
                  <SelectItem value="8-B">Class 8-B</SelectItem>
                  <SelectItem value="9-A">Class 9-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger data-testid="diary-subject" className="mt-2 rounded-xl bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">Note</label>
            <textarea
              data-testid="diary-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              placeholder="Type your update for parents..."
              className="mt-2 w-full rounded-xl bg-white/80 border border-slate-200 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 outline-none px-4 py-3 text-[13.5px] resize-none"
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch data-testid="diary-attach" id="attach" checked={attach} onCheckedChange={setAttach} />
              <label htmlFor="attach" className="text-[13px] text-slate-700 cursor-pointer">Attach as homework</label>
            </div>
            <button data-testid="diary-post" className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2.5 text-[13px] font-medium shadow-sm">
              <Send className="h-4 w-4" /> Post
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 reveal d2">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-4">Preview</div>
          <div className="glass-soft rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <SubjectPill subject={subject} />
              <span className="text-[11px] text-slate-400">Today</span>
            </div>
            <div className="text-[13.5px] text-slate-700 leading-relaxed min-h-[60px]">
              {note || <span className="text-slate-400">Your note will appear here...</span>}
            </div>
            {attach && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e6f4fb] text-[#0c6a99] px-2.5 py-0.5 text-[11px] font-medium">
                Marked as homework
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedView() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const res = await api.getDiaryEntries?.() || { entries: [] };
        setEntries(res.entries || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDiary();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="DIGITAL DIARY"
        title="Feed"
        subtitle="Latest notes from teachers, in reverse-chronological order."
      />
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-[#29ABE2] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No diary entries yet"
          hint="Teacher notes and updates will appear here."
        />
      ) : (
        <ul className="space-y-4 max-w-3xl">
          {entries.map((d, i) => (
            <li key={d.id} className={`glass rounded-2xl p-5 reveal d${Math.min(i + 1, 5)}`}>
              <div className="flex items-center justify-between mb-2">
                <SubjectPill subject={d.subject} />
                <span className="text-[11.5px] text-slate-400">{d.date}</span>
              </div>
              <div className="text-[14px] text-slate-700 leading-relaxed">{d.entry}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DigitalDiary() {
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div data-testid="diary-page" className="max-w-[1400px] mx-auto">
      {role === "staff" && (user?.duties || []).includes("teacher") ? <TeacherForm /> : <FeedView />}
    </div>
  );
}
