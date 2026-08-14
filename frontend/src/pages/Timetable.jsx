import React, { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DAYS, PERIODS, SUBJECT_COLORS } from "@/lib/mockData";
import { useDataStore } from "@/lib/dataStore";
import { Edit2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Timetable() {
  const { timetable, updateTimetableCell } = useDataStore();
  const [view, setView] = useState("class");
  const [safeClass, setSafeClass] = useState("10-A");

  const [editingCell, setEditingCell] = useState(null); // { day, period, currentSubject }
  const [selectedSubject, setSelectedSubject] = useState("");

  const classOptions = ["10-A", "9-B", "8-A", "7-A", "6-B"];
  const subjectsList = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Social Sci.", "Computer Sci.", "Physical Ed.", "Library", "Arts"];

  const classGrid = timetable[safeClass] || {};

  const handleOpenEdit = (day, period, subject) => {
    setEditingCell({ day, period, currentSubject: subject });
    setSelectedSubject(subject || "Mathematics");
  };

  const handleSaveCell = () => {
    if (editingCell) {
      updateTimetableCell(safeClass, editingCell.day, editingCell.period, selectedSubject);
      toast.success(`Updated ${safeClass} timetable: ${editingCell.day} ${editingCell.period} -> ${selectedSubject}`);
      setEditingCell(null);
    }
  };

  return (
    <div data-testid="timetable-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="ACADEMICS · SCHEDULE"
        title="Class Timetable"
        subtitle={`Weekly academic period schedule for Class ${safeClass}.`}
        right={
          <div className="flex items-center gap-3">
            <Select value={safeClass} onValueChange={setSafeClass}>
              <SelectTrigger data-testid="tt-class-select" className="w-[140px] rounded-full bg-white/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        <div className="overflow-x-auto thin-scroll">
          <table className="min-w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-4 py-3 text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase w-[130px]">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center px-4 py-3 text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((pr) => (
                <tr key={pr.key} className="border-t border-slate-100">
                  <td className="px-4 py-3.5 font-medium text-slate-700 bg-slate-50/30">
                    <div className="font-semibold text-slate-800">{pr.label}</div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">{pr.time}</div>
                  </td>
                  {DAYS.map((day) => {
                    const subject = classGrid[day]?.[pr.key] || "Free Period";
                    const colorClass = SUBJECT_COLORS[subject] || "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        <button
                          onClick={() => handleOpenEdit(day, pr.key, subject)}
                          className={`w-full rounded-xl p-3 border transition-all text-center group hover:scale-[1.02] ${colorClass}`}
                        >
                          <div className="font-semibold text-[12.5px] truncate">{subject}</div>
                          <div className="text-[10px] opacity-70 mt-1 flex items-center justify-center gap-1 group-hover:opacity-100">
                            <Edit2 className="h-3 w-3" /> Edit
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Cell Modal */}
      <Dialog open={!!editingCell} onOpenChange={() => setEditingCell(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px]">
              Edit Timetable Period
            </DialogTitle>
          </DialogHeader>
          {editingCell && (
            <div className="space-y-4 py-2">
              <div className="text-[13px] text-slate-500">
                Class <span className="font-bold text-slate-900">{safeClass}</span> · {editingCell.day} ({editingCell.period})
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Select Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsList.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingCell(null)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSaveCell} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
              <Save className="h-4 w-4 mr-1.5" /> Save Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}