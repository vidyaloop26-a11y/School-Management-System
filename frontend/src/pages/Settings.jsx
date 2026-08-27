import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Settings as SettingsIcon, Calendar, Clock, BookOpen, PartyPopper, Plus, Trash2, Loader2, Save, GripVertical, Flag, CalendarDays } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

const TABS = [
  { key: "academic", label: "Academic Session", icon: Calendar },
  { key: "timetable", label: "Timetable Config", icon: Clock },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "events", label: "Events & Holidays", icon: PartyPopper },
];

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEFAULT_PERIODS = [
  { label: "P1", time: "08:30-09:15" },
  { label: "P2", time: "09:15-10:00" },
  { label: "P3", time: "10:00-10:45" },
  { label: "P4", time: "11:00-11:45" },
  { label: "P5", time: "11:45-12:30" },
];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AcademicTab({ settings, saving, onSave }) {
  const [form, setForm] = useState({
    academicSession: settings?.academicSession || "2024-2025",
    term: settings?.term || 2,
    grading: settings?.grading || "",
  });

  return (
    <div className="space-y-5">
      <div className="glass-soft rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Academic Session</label>
          <input
            value={form.academicSession}
            onChange={(e) => setForm({ ...form, academicSession: e.target.value })}
            placeholder="e.g. 2024-2025"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13.5px] outline-none focus:border-[#29ABE2]"
          />
          <div className="text-[11px] text-slate-400 mt-1">Current active academic year displayed across the platform.</div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Number of Terms</label>
          <select
            value={form.term}
            onChange={(e) => setForm({ ...form, term: parseInt(e.target.value) })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13.5px] outline-none focus:border-[#29ABE2] bg-white"
          >
            {[1, 2, 3, 4].map((t) => (
              <option key={t} value={t}>{t} Term{t > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grading System</label>
          <select
            value={form.grading}
            onChange={(e) => setForm({ ...form, grading: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13.5px] outline-none focus:border-[#29ABE2] bg-white"
          >
            <option value="">Default (A+ to F)</option>
            <option value="cbse">CBSE Grading</option>
            <option value="percentage">Percentage</option>
            <option value="gpa">GPA (10-point)</option>
          </select>
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] text-white px-5 py-2.5 text-[13px] font-semibold transition disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
      </button>
    </div>
  );
}

function TimetableTab({ settings, saving, onSave }) {
  const [days, setDays] = useState(settings?.days || DEFAULT_DAYS);
  const [periods, setPeriods] = useState(() => {
    try {
      return typeof settings?.periods === "string" ? JSON.parse(settings.periods) : (settings?.periods || DEFAULT_PERIODS);
    } catch { return DEFAULT_PERIODS; }
  });

  const toggleDay = (day) => {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  const addPeriod = () => {
    const num = periods.length + 1;
    setPeriods([...periods, { label: `P${num}`, time: "12:30-13:15" }]);
  };

  const removePeriod = (idx) => {
    if (periods.length <= 1) return;
    setPeriods(periods.filter((_, i) => i !== idx));
  };

  const updatePeriod = (idx, field, val) => {
    setPeriods(periods.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  return (
    <div className="space-y-5">
      {/* Days Config */}
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Working Days</div>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-full text-[12px] font-semibold transition border ${
                days.includes(day)
                  ? "bg-[#29ABE2] text-white border-[#29ABE2]"
                  : "bg-white text-slate-500 border-slate-200 hover:border-[#29ABE2]"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-400 mt-2">{days.length} day{days.length !== 1 ? "s" : ""} selected</div>
      </div>

      {/* Periods Config */}
      <div className="glass-soft rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periods / Lectures</div>
          <button
            onClick={addPeriod}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c6a99] hover:text-[#29ABE2] transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Period
          </button>
        </div>
        <div className="space-y-2">
          {periods.map((p, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
              <input
                value={p.label}
                onChange={(e) => updatePeriod(idx, "label", e.target.value)}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-bold text-center outline-none focus:border-[#29ABE2]"
                placeholder="P1"
              />
              <input
                value={p.time}
                onChange={(e) => updatePeriod(idx, "time", e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[12px] outline-none focus:border-[#29ABE2]"
                placeholder="08:30-09:15"
              />
              <button
                onClick={() => removePeriod(idx)}
                disabled={periods.length <= 1}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSave({ days, periods })}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] text-white px-5 py-2.5 text-[13px] font-semibold transition disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Timetable Config
      </button>
    </div>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("Subject name required"); return; }
    setAdding(true);
    try {
      await api.createSubject({ name: newName.trim(), code: newCode.trim() || undefined });
      toast.success(`Subject "${newName}" added`);
      setNewName(""); setNewCode("");
      fetchSubjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add subject");
    } finally { setAdding(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete subject "${s.name}"?`)) return;
    setDeletingId(s.id);
    try {
      await api.deleteSubject(s.id);
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (err) {
      toast.error("Failed to delete subject");
    } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-5">
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Add New Subject</div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-slate-500 font-medium">Subject Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Physics"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2]"
            />
          </div>
          <div className="w-28">
            <label className="text-[11px] text-slate-500 font-medium">Code (optional)</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="e.g. PHY"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2] uppercase"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] text-white px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 shrink-0"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
          </button>
        </div>
      </div>

      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          School Subjects ({subjects.length})
        </div>
        {loading ? (
          <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-[#29ABE2] mx-auto" /></div>
        ) : subjects.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-[13px]">No subjects configured yet.</div>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-4 py-3 group hover:border-slate-200 transition">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[13px] text-slate-800">{s.name}</span>
                  {s.code && <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{s.code}</span>}
                </div>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", sub: "", date: "", type: "Event" });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [syncCountry, setSyncCountry] = useState("IN");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEvents();
      setEvents(res.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleAdd = async () => {
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    setAdding(true);
    try {
      await api.createEvent(form);
      toast.success(`${form.type} added`);
      setForm({ title: "", sub: "", date: "", type: "Event" });
      fetchEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add event");
    } finally { setAdding(false); }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"?`)) return;
    setDeletingId(ev.id);
    try {
      await api.deleteEvent(ev.id);
      toast.success("Deleted");
      fetchEvents();
    } catch (err) {
      toast.error("Failed to delete");
    } finally { setDeletingId(null); }
  };

  const handleSyncHolidays = async () => {
    setSyncing(true);
    try {
      const res = await api.syncHolidays(syncYear, syncCountry);
      toast.success(`Synced ${res.imported} holidays for ${res.year} (${res.country}). ${res.skipped} already existed.`);
      fetchEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to sync holidays");
    } finally { setSyncing(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <div className="space-y-5">
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Add Event / Holiday</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] text-slate-500 font-medium">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Independence Day"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2]"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2]"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-medium">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2] bg-white"
            >
              <option value="Event">Event</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] text-slate-500 font-medium">Description (optional)</label>
            <input
              value={form.sub}
              onChange={(e) => setForm({ ...form, sub: e.target.value })}
              placeholder="e.g. National Holiday"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] outline-none focus:border-[#29ABE2]"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] text-white px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </button>
      </div>

      {/* Sync Holidays from Calendar API */}
      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Sync Public Holidays from Calendar</div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-24">
            <label className="text-[11px] text-slate-500 font-medium">Year</label>
            <select
              value={syncYear}
              onChange={(e) => setSyncYear(parseInt(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-[#29ABE2] bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-[11px] text-slate-500 font-medium">Country</label>
            <select
              value={syncCountry}
              onChange={(e) => setSyncCountry(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-[#29ABE2] bg-white"
            >
              <option value="IN">India (IN)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="AE">UAE (AE)</option>
              <option value="SG">Singapore (SG)</option>
              <option value="AU">Australia (AU)</option>
            </select>
          </div>
          <button
            onClick={handleSyncHolidays}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />}
            {syncing ? "Syncing…" : "Sync Holidays"}
          </button>
          <div className="text-[11px] text-slate-400">
            Powered by Nager.Date — free, no API key needed
          </div>
        </div>
      </div>

      <div className="glass-soft rounded-xl p-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Calendar ({events.length})
        </div>
        {loading ? (
          <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-[#29ABE2] mx-auto" /></div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-[13px]">No events or holidays configured.</div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-4 py-3 group hover:border-slate-200 transition">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${ev.type === "Holiday" ? "bg-rose-50 text-rose-600" : "bg-[#e6f4fb] text-[#0c6a99]"}`}>
                    {ev.type === "Holiday" ? <Flag className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-slate-800">{ev.title}</div>
                    <div className="text-[11px] text-slate-400">{fmtDate(ev.date)}{ev.sub ? ` · ${ev.sub}` : ""}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.type === "Holiday" ? "bg-rose-50 text-rose-600" : "bg-[#e6f4fb] text-[#0c6a99]"}`}>
                  {ev.type}
                </span>
                <button
                  onClick={() => handleDelete(ev)}
                  disabled={deletingId === ev.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("academic");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((res) => setSettings(res.settings))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const res = await api.updateSettings(data);
      setSettings(res.settings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="settings-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="SCHOOL ADMIN"
        title="School Settings"
        subtitle="Configure academic session, timetable, subjects, and events in one place."
      />

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#29ABE2] mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
          {/* Tab Nav */}
          <div className="glass rounded-2xl p-3 h-fit">
            <div className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-[#29ABE2] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="glass rounded-2xl p-5">
            {activeTab === "academic" && <AcademicTab settings={settings} saving={saving} onSave={handleSave} />}
            {activeTab === "timetable" && <TimetableTab settings={settings} saving={saving} onSave={handleSave} />}
            {activeTab === "subjects" && <SubjectsTab />}
            {activeTab === "events" && <EventsTab />}
          </div>
        </div>
      )}
    </div>
  );
}
