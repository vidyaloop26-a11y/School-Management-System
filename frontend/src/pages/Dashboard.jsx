import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import TrendPill from "@/components/common/TrendPill";
import LastSynced from "@/components/common/LastSynced";
import { useDashboard } from "@/lib/queries";
import { useAuth } from "@/lib/AuthContext";
import { ArrowUpRight, Loader2 } from "lucide-react";

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
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const cards = [
    { key: "students", title: "Total Students", value: (stats.students ?? 0).toLocaleString(), sub: "across all sections", trend: null },
    { key: "staff", title: "Total Staff", value: (stats.staff ?? 0).toLocaleString(), sub: stats.teachers != null ? `${stats.teachers} teaching / ${(stats.staff ?? 0) - (stats.teachers ?? 0)} non-teaching` : "full team", trend: null },
    { key: "classes", title: "Class Sections", value: (stats.classes ?? 0).toLocaleString(), sub: "active class groups", trend: null },
    { key: "attendance", title: "Attendance Marked Today", value: (stats.attendanceMarkedToday ?? 0).toLocaleString(), sub: stats.attendancePending != null ? `${stats.attendancePending} pending` : "", trend: null },
  ];

  if (user?.role === "superAdmin") {
    cards[0] = { key: "schools", title: "Schools", value: (stats.schools ?? 0).toLocaleString(), sub: "managed by platform", trend: null };
    cards[2] = { key: "teachers", title: "Teacher Accounts", value: (stats.teacherAccounts ?? 0).toLocaleString(), sub: "portal logins", trend: null };
    cards[3] = { key: "parents", title: "Parent Accounts", value: (stats.parentAccounts ?? 0).toLocaleString(), sub: "portal logins", trend: null };
  }

  const FEE_CHART = [
    { month: "Feb", amount: 40 },
    { month: "Mar", amount: 48 },
    { month: "Apr", amount: 55 },
    { month: "May", amount: 42 },
    { month: "Jun", amount: 58 },
    { month: "Jul", amount: 68.4 },
  ];

  return (
    <div data-testid="dashboard-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow={`${user?.role === "superAdmin" ? "SUPER ADMIN" : user?.role === "schoolAdmin" ? "SCHOOL ADMIN" : (user?.role || "").toUpperCase()}`}
        title={<>Overview</>}
        subtitle={<>A snapshot of today at <span className="font-serif-i text-slate-700">Vidyaloop</span>.</>}
        right={<LastSynced />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((c, i) => <StatCard key={c.key} card={c} index={i} />)}
      </div>

      {/* Chart + events */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] gap-5">
        <div data-testid="fee-chart-card" className="glass rounded-2xl p-6 reveal d3">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-semibold text-slate-500 uppercase">
                Fee Collection · Last 6 Months
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
          <div className="text-center py-10 text-slate-500 text-[13px]">
            Events module coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}