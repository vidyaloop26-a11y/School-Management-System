import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { STUDENTS } from "@/lib/mockData";
import { Search, Plus, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Students() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("all");
  const [sec, setSec] = useState("all");
  const [status, setStatus] = useState("all");

  const classes = Array.from(new Set(STUDENTS.map((s) => s.class))).sort();
  const sections = Array.from(new Set(STUDENTS.map((s) => s.section))).sort();

  const rows = useMemo(() => {
    return STUDENTS.filter((s) => {
      if (cls !== "all" && s.class !== cls) return false;
      if (sec !== "all" && s.section !== sec) return false;
      if (status !== "all" && s.status.toLowerCase() !== status) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!s.name.toLowerCase().includes(t) && !s.admNo.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [q, cls, sec, status]);

  return (
    <div data-testid="students-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS"
        title="Students"
        subtitle="1,284 students across 24 sections. Filter, search, drill in."
        right={
          <button data-testid="add-student-btn" className="inline-flex items-center gap-2 bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 rounded-full text-[13px] font-medium shadow-sm">
            <Plus className="h-4 w-4" /> Add Student
          </button>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              data-testid="students-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or admission no."
              className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-400"
            />
          </div>

          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger data-testid="filter-class" className="w-[140px] rounded-full bg-white/80"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sec} onValueChange={setSec}>
            <SelectTrigger data-testid="filter-section" className="w-[140px] rounded-full bg-white/80"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="filter-status" className="w-[140px] rounded-full bg-white/80"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/60">
          <table className="min-w-full text-[13px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-5 py-3 font-semibold">Adm. No.</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Class</th>
                <th className="px-5 py-3 font-semibold">Section</th>
                <th className="px-5 py-3 font-semibold">Roll No.</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold w-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.admNo}
                  data-testid={`student-row-${s.admNo}`}
                  onClick={() => navigate(`/students/${s.admNo}`)}
                  className="border-t border-slate-100 hover:bg-[#f3faff] cursor-pointer transition"
                >
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-500">{s.admNo}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">Class {s.class}</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.section}</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.roll}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-slate-400"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-[13px]">No students match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
