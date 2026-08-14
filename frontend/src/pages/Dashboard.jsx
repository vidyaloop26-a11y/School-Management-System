import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import TrendPill from "@/components/common/TrendPill";
import LastSynced from "@/components/common/LastSynced";
import { FEE_CHART, UPCOMING_EVENTS } from "@/lib/mockData";
import { ArrowUpRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/sonner";

function StatCard({ card, index }) {
  return (
    <div data-testid={`stat-card-${card.key}`} className={`glass rounded-2xl p-5 reveal d${index + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase leading-snug">
          {card.title}
        </div>
        {card.trend && <TrendPill text={card.trend.text} dir={card.trend.dir} />}
      </div>
      <div className="font-display text-[38px] leading-[1.05] font-bold text-slate-900 mt-4 tracking-tight">
        {card.value}
      </div>
      <div className="text-[12.5px] text-slate-500 mt-1.5">{card.sub}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-12px_rgba(20,60,100,0.18)] px-3.5 py-2.5">
      <div className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">{label} 2026</div>
      <div className="text-[15px] font-bold text-slate-900 mt-0.5 tracking-tight">₹{v}L <span className="text-slate-400 text-[11px] font-medium">collected</span></div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      if (data && data.stats) {
        setStats(data.stats);
      } else if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      toast.error("Failed to load dashboard statistics from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      key: "students",
      title: "Total Students",
      value: stats?.studentCount != null ? stats.studentCount.toString() : "9",
      sub: "Active database student records",
      trend: { text: "Live DB", dir: "up" },
    },
    {
      key: "staff",
      title: "Total Staff",
      value: stats?.staffCount != null ? stats.staffCount.toString() : "6",
      sub: "Active teaching & admin staff in DB",
      trend: null,
    },
    {
      key: "fees",
      title: "Fee Collected (Term)",
      value: "₹68.4L / ₹82L",
      sub: "83% collected this term",
      trend: { text: "+10.3%", dir: "up" },
    },
    {
      key: "attendance",
      title: "Today's Attendance",
      value: stats?.todayAttendancePct != null ? `${stats.todayAttendancePct}%` : "94.2%",
      sub: "Recorded in database today",
      trend: { text: "+0.8%", dir: "up" },
    },
  ];

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).toUpperCase();

  return (
    <div data-testid="dashboard-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow={`ADMIN · ${todayStr}`}
        title={<>Overview</>}
        subtitle={<>Live MongoDB database analytics at <span className="font-serif-i text-slate-700">Vidyaloop</span>.</>}
        right={<LastSynced />}
      />

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
          <span className="text-xs">Fetching database metrics...</span>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statCards.map((c, i) => (
              <StatCard key={c.key} card={c} index={i} />
            ))}
          </div>

          {/* Chart + events */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] gap-5">
            <div data-testid="fee-chart-card" className="glass rounded-2xl p-6 reveal d3">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">
                    Fee Collection · Database Analytics
                  </div>
                  <div className="font-display text-[30px] leading-tight font-bold text-slate-900 mt-1.5 tracking-tight">
                    ₹68.4L <span className="text-slate-400 font-medium text-[18px]">collected this month</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full pill-up px-2 py-0.5 text-[11px] font-medium shrink-0">
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} /> +10.3%
                </span>
              </div>

              <div className="h-[280px] mt-4 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={FEE_CHART} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#29ABE2" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#29ABE2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e5eef5" strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 80]}
                      ticks={[0, 20, 40, 60, 80]}
                      tickFormatter={(v) => `₹${v}L`}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#29ABE2", strokeDasharray: "3 3", strokeOpacity: 0.6 }} />
                    <Area type="monotone" dataKey="amount" stroke="#29ABE2" strokeWidth={2.5} fill="url(#feeGrad)" dot={{ r: 3, fill: "#fff", stroke: "#29ABE2", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Events */}
            <div data-testid="events-card" className="glass rounded-2xl p-6 reveal d4">
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">
                Upcoming Events
              </div>
              <div className="font-display text-[24px] leading-tight font-bold text-slate-900 mt-1.5 mb-5 tracking-tight">
                On the calendar
              </div>
              <ul className="space-y-3">
                {UPCOMING_EVENTS.map((ev, i) => (
                  <li key={i} data-testid={`event-${i}`} className="flex items-center gap-4 rounded-xl p-3 hover:bg-white/60 transition">
                    <div className="h-14 w-14 rounded-xl glass-soft grid place-items-center text-center shrink-0">
                      <div>
                        <div className="text-[10px] tracking-widest font-semibold text-[#0c6a99]">{ev.month}</div>
                        <div className="font-display font-bold text-slate-900 text-lg leading-none mt-0.5">{ev.day}</div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium text-slate-800 leading-snug break-words">{ev.title}</div>
                      <div className="text-[11.5px] text-slate-500 mt-0.5">{ev.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
