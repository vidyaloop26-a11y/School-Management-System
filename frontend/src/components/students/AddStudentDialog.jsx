import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStudent } from "@/lib/queries";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

const SECTIONS = ["A", "B", "C", "D", "E"];

const empty = {
  admNo: "",
  name: "",
  cls: "1",
  section: "A",
  roll: "",
  dob: "",
  bloodGroup: "",
  address: "",
  fatherName: "",
  fatherEmail: "",
  fatherPhone: "",
  motherName: "",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
};

export default function AddStudentDialog({ open, onOpenChange }) {
  const createMutation = useCreateStudent();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSel = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, roll: Number(form.roll) };
      const result = await createMutation.mutateAsync(payload);
      if (result.credentials) {
        toast.success("Student added with parent portal credentials!");
      } else {
        toast.success("Student added successfully");
      }
      setForm(empty);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] font-bold text-slate-900">Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the student details below. Parent portal credentials are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Student Details</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Admission No. (e.g. VL2024001)" value={form.admNo} onChange={set("admNo")} className="rounded-xl border-slate-200" required />
              <Input placeholder="Full Name" value={form.name} onChange={set("name")} className="rounded-xl border-slate-200" required />
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.cls} onValueChange={setSel("cls")}>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                      <SelectItem key={c} value={c}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.section} onValueChange={setSel("section")}>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => <SelectItem key={s} value={s}>Sec {s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Roll" value={form.roll} onChange={set("roll")} className="rounded-xl border-slate-200" required />
              </div>
              <Input type="date" placeholder="Date of Birth" value={form.dob} onChange={set("dob")} className="rounded-xl border-slate-200" />
              <Input placeholder="Blood Group" value={form.bloodGroup} onChange={set("bloodGroup")} className="rounded-xl border-slate-200" />
              <Input placeholder="Address" value={form.address} onChange={set("address")} className="rounded-xl border-slate-200" />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Guardian / Parent</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Father Name" value={form.fatherName} onChange={set("fatherName")} className="rounded-xl border-slate-200" />
              <Input placeholder="Mother Name" value={form.motherName} onChange={set("motherName")} className="rounded-xl border-slate-200" />
              <Input placeholder="Parent Name (portal account)" value={form.parentName} onChange={set("parentName")} className="rounded-xl border-slate-200" />
              <Input type="email" placeholder="Parent Email" value={form.parentEmail} onChange={set("parentEmail")} className="rounded-xl border-slate-200" />
              <Input placeholder="Parent Phone" value={form.parentPhone} onChange={set("parentPhone")} className="rounded-xl border-slate-200" />
              <Input type="email" placeholder="Father Email" value={form.fatherEmail} onChange={set("fatherEmail")} className="rounded-xl border-slate-200" />
            </div>
            <p className="text-[11.5px] text-slate-500 mt-2">
              Providing a parent name/email/phone auto-creates a parent portal account.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-white border border-slate-200 px-5 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-6 py-2.5 text-[13px] font-medium shadow-sm disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Student
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}