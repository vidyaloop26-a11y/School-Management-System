import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { ChevronLeft, ChevronRight, CalendarDays, PartyPopper, Flag, Loader2 } from "lucide-react";
import api from "@/lib/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAY_LABELS = ["S","M","T","W","T","F","S"];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

function TypeChip({ type }) {
  if (type === "Holiday") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10.5px] font-semibold">
        <Flag className="h-3 w-3" /> Holiday
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4fb] text-[#0c6a99] border border-[#c9e7f5] px-2 py-0.5 text-[10.5px] font-semibold">
      <PartyPopper className="h-3 w-3" /> Event
    </span>
  );
}

export default function Events() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = map[day] || [];
        map[day].push({
          ...ev,
          y: d.getFullYear(),
          m: d.getMonth(),
          d: day,
        });
      }
    });
    return map;
  }, [events, year, month]);

  const monthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).map((e) => {
      const d = new Date(e.date);
      return { ...e, y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
    });
  }, [events, year, month]);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  const dim = daysInMonth(year, month);
  const startWeekday = firstDayOfMonth(year, month);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  return (
    <div data-testid="events-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ENGAGEMENT"
        title="Events & Holidays"
        subtitle="School calendar of events and public holidays."
        right={
          <div className="hidden md:flex items-center gap-2 glass rounded-full px-2 py-1">
            <button data-testid="cal-prev" onClick={prev} className="h-8 w-8 rounded-full hover:bg-slate-100 transition grid place-items-center text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
            <div className="px-3 text-[13px] font-semibold text-slate-800 min-w-[140px] text-center">{MONTHS[month]} {year}</div>
            <button data-testid="cal-next" onClick={next} className="h-8 w-8 rounded-full hover:bg-slate-100 transition grid place-items-center text-slate-600"><ChevronRight className="h-4 w-4" /></button>
          </div>
        }
      />

      {/* Mobile month switcher */}
      <div className="md:hidden mb-4 flex items-center justify-between glass rounded-full px-2 py-1">
        <button onClick={prev} className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
        <div className="text-[13.5px] font-semibold text-slate-800">{MONTHS[month]} {year}</div>
        <button onClick={next} className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center text-slate-600"><ChevronRight className="h-4 w-4" /></button>
      </div>

      {/* Desktop: month grid + agenda */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
        <div className="glass rounded-2xl p-5 reveal">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="text-[10.5px] tracking-widest text-slate-400 uppercase text-center pb-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square rounded-xl bg-slate-50/40" />;
              const evs = eventsByDay[d] || [];
              const hasHoliday = evs.some((e) => e.type === "Holiday");
              const hasEvent = evs.some((e) => e.type === "Event");
              return (
                <div
                  key={i}
                  data-testid={`events-cell-${d}`}
                  className={`relative aspect-square rounded-xl border p-2 flex flex-col ${
                    hasHoliday ? "bg-rose-50/70 border-rose-200"
                    : hasEvent ? "bg-[#e6f4fb]/60 border-[#c9e7f5]"
                    : "bg-white/60 border-slate-100"
                  }`}
                >
                  <div className={`text-[12px] font-semibold ${hasHoliday ? "text-rose-700" : hasEvent ? "text-[#0c6a99]" : "text-slate-700"}`}>{d}</div>
                  <div className="mt-auto space-y-1">
                    {evs.slice(0, 2).map((e, idx) => (
                      <div key={idx} className={`truncate text-[9.5px] rounded px-1.5 py-0.5 font-medium ${e.type === "Holiday" ? "bg-rose-100 text-rose-700" : "bg-[#cfe8f6] text-[#0c6a99]"}`}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-[11.5px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#29ABE2]" /> Event</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Holiday</span>
          </div>
        </div>

        {/* Agenda */}
        <div className="glass rounded-2xl p-5 reveal d1">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> This month</div>
          <ul className="space-y-3">
            {monthEvents.length === 0 && <li className="text-[13px] text-slate-500 py-4">No events scheduled this month.</li>}
            {monthEvents.map((e, i) => (
              <li key={i} className="glass-soft rounded-xl p-3.5 flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${e.type === "Holiday" ? "bg-rose-50 text-rose-700" : "bg-[#e6f4fb] text-[#0c6a99]"}`}>
                  <div className="text-center leading-none">
                    <div className="text-[9.5px] tracking-widest font-semibold">{MONTHS[e.m].slice(0,3).toUpperCase()}</div>
                    <div className="font-display font-bold text-lg mt-0.5">{String(e.d).padStart(2, "0")}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-slate-800 truncate">{e.title}</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">{e.sub}</div>
                </div>
                <TypeChip type={e.type} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile agenda-only */}
      <div className="md:hidden reveal">
        <div className="glass rounded-2xl p-4">
          <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {MONTHS[month]} agenda</div>
          <ul className="space-y-3">
            {monthEvents.length === 0 && <li className="text-[13px] text-slate-500 py-6 text-center">No events scheduled this month.</li>}
            {monthEvents.map((e, i) => (
              <li key={i} className="glass-soft rounded-xl p-3.5 flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${e.type === "Holiday" ? "bg-rose-50 text-rose-700" : "bg-[#e6f4fb] text-[#0c6a99]"}`}>
                  <div className="text-center leading-none">
                    <div className="text-[9.5px] tracking-widest font-semibold">{MONTHS[e.m].slice(0,3).toUpperCase()}</div>
                    <div className="font-display font-bold text-lg mt-0.5">{String(e.d).padStart(2, "0")}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-slate-800 truncate">{e.title}</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">{e.sub}</div>
                </div>
                <TypeChip type={e.type} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
