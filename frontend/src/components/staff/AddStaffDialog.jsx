import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStaff } from "@/lib/queries";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

const JOB_TITLES = ["Teacher", "Vice Principal", "Front Office", "Accountant", "Counsellor", "Librarian", "IT Support", "Lab Assistant"];
const DEPTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer", "Administration", "Finance", "Library"];

const empty = {
  staffId: "",
  name: "",
  jobTitle: "Teacher",
  dept: "",
  subject: "",
  qualification: "",
  phone: "",
  email: "",
  joined: "",
};

export default function AddStaffDialog({ open, onOpenChange }) {
  const createMutation = useCreateStaff();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSel = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createMutation.mutateAsync(form);
      if (result.credentials) {
        toast.success(`Staff added. Teacher portal login: ${result.credentials.username}`);
      } else {
        toast.success("Staff member added successfully");
      }
      setForm(empty);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] font-bold text-slate-900">Add Staff Member</DialogTitle>
          <DialogDescription>
            Teacher accounts with portal login credentials are created automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Staff ID (e.g. VLS-107)" value={form.staffId} onChange={set("staffId")} className="rounded-xl border-slate-200" required />
            <Input placeholder="Full Name" value={form.name} onChange={set("name")} className="rounded-xl border-slate-200" required />
            <Select value={form.jobTitle} onValueChange={setSel("jobTitle")}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Job Title" /></SelectTrigger>
              <SelectContent>
                {JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.dept} onValueChange={setSel("dept")}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                {DEPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Subject" value={form.subject} onChange={set("subject")} className="rounded-xl border-slate-200" />
            <Input placeholder="Qualification" value={form.qualification} onChange={set("qualification")} className="rounded-xl border-slate-200" />
            <Input type="email" placeholder="Email" value={form.email} onChange={set("email")} className="rounded-xl border-slate-200" />
            <Input placeholder="Phone" value={form.phone} onChange={set("phone")} className="rounded-xl border-slate-200" />
            <Input type="date" placeholder="Joined" value={form.joined} onChange={set("joined")} className="rounded-xl border-slate-200" />
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
              Add Staff
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}