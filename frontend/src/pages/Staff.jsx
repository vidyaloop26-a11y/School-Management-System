import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { STAFF } from "@/lib/mockData";
import { Search, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButton from "@/components/common/ExportButton";

export default function Staff() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");

  const depts = Array.from(new Set(STAFF.map((s) => s.dept))).sort();

  const rows = useMemo(() => {
    return STAFF.filter((s) => {
      if (dept !== "all" && s.dept !== dept) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase()) && !s.id.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, dept]);

  return (
    <div data-testid="staff-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Staff"
        subtitle="82 teaching, 14 non-teaching — 96 people who make Vidyaloop run."
        right={<ExportButton testId="staff-export" />}
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              data-testid="staff-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or staff ID"
              className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-400"
            />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger data-testid="filter-dept" className="w-[180px] rounded-full bg-white/80"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Staff ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 w-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  data-testid={`staff-row-${s.id}`}
                  onClick={() => navigate(`/staff/${s.id}`)}
                  className="border-t border-slate-100 hover:bg-[#f3faff] cursor-pointer transition"
                >
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{s.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.role}</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.dept}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-slate-400"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No results found — try a different search term.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2.5">
          {rows.map((s) => (
            <div
              key={s.id}
              data-testid={`staff-card-${s.id}`}
              onClick={() => navigate(`/staff/${s.id}`)}
              className="glass-soft rounded-xl p-4 cursor-pointer active:scale-[0.99] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-slate-500">{s.id}</div>
                  <div className="font-medium text-slate-800 text-[14.5px] mt-0.5 truncate">{s.name}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-medium shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {s.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="truncate">{s.role}</span>
                <span className="text-slate-300">·</span>
                <span className="truncate">{s.dept}</span>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center text-slate-500 text-[13px] py-8 glass-soft rounded-xl">No results found — try a different search term.</div>
          )}
        </div>
      </div>
    </div>
  );
}
