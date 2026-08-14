import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Building2, Plus, Edit2, Trash2, CheckCircle2, Search, KeyRound, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [activeSchoolId, setActiveSchoolIdState] = useState(() => {
    return localStorage.getItem("vidyaloop_active_school_id") || "all";
  });

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    board: "CBSE",
    city: "",
    session: "2024-2025",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await api.getSchools();
      const list = Array.isArray(res) ? res : (res?.schools || []);
      setSchools(list);
    } catch (err) {
      toast.error("Failed to load schools list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleScopeChange = (id, name) => {
    setActiveSchoolIdState(id);
    localStorage.setItem("vidyaloop_active_school_id", id);
    window.dispatchEvent(new Event("schoolScopeChanged"));
    toast.success(`Active scope switched to ${name}`);
  };

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      code: "",
      board: "CBSE",
      city: "",
      session: "2024-2025",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      board: school.board || "CBSE",
      city: school.address || "",
      session: school.session || "2024-2025",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("School name and code are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingSchool) {
        await api.updateSchool(editingSchool.id, {
          name: formData.name,
          code: formData.code,
          board: formData.board,
          address: formData.city,
          session: formData.session,
        });
        toast.success(`Updated ${formData.name} successfully.`);
        setEditingSchool(null);
        fetchSchools();
      } else {
        const res = await api.createSchool({
          name: formData.name,
          code: formData.code,
          board: formData.board,
          address: formData.city,
          session: formData.session,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        });

        toast.success(`Created school ${formData.name} (${formData.code})`);
        setIsAddOpen(false);
        fetchSchools();

        if (res.credentials) {
          setGeneratedCredentials(res.credentials);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save school");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (school) => {
    if (schools.length <= 1) {
      toast.error("Cannot delete the only remaining school in system.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${school.name}?`)) return;

    try {
      await api.deleteSchool(school.id);
      toast.success(`Deleted ${school.name}.`);
      fetchSchools();
    } catch (err) {
      toast.error("Failed to delete school");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard!");
  };

  return (
    <div data-testid="schools-page" className="max-w-[1400px] mx-auto pb-12">
      <PageHeader
        eyebrow="SUPER ADMIN · TENANT MANAGEMENT"
        title="Schools & Campuses"
        subtitle="Manage multi-tenant school instances, academic boards, and global system scopes."
        right={
          <button
            data-testid="add-school-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-[13px] font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add New School
          </button>
        }
      />

      {/* Filter and stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 min-w-[280px] max-w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            data-testid="school-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, code, or city..."
            className="pl-10 rounded-full bg-white/80 border-slate-200"
          />
        </div>
        <div className="text-[13px] text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{filtered.length}</span> of {schools.length} schools
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#29ABE2]" />
        </div>
      ) : (
        /* Schools Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((school) => {
            const isActiveScope = activeSchoolId === school.id;
            return (
              <div
                key={school.id}
                data-testid={`school-card-${school.code}`}
                className={`glass rounded-2xl p-6 transition-all duration-200 ${
                  isActiveScope ? "ring-2 ring-[#29ABE2] bg-cyan-50/20" : "hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#29ABE2] to-[#0c6a99] grid place-items-center text-white font-bold text-[16px]">
                      {school.code.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[16px] text-slate-900 leading-snug">{school.name}</h3>
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">{school.code}</span>
                    </div>
                  </div>

                  {isActiveScope ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active Scope
                    </span>
                  ) : (
                    <button
                      data-testid={`select-scope-${school.code}`}
                      onClick={() => handleScopeChange(school.id, school.name)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-[#29ABE2] bg-white border border-slate-200 hover:border-[#29ABE2] px-2.5 py-1 rounded-full transition"
                    >
                      Select Scope
                    </button>
                  )}
                </div>

                <div className="mt-5 space-y-2 text-[13px] border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Board / Curriculum:</span>
                    <span className="font-semibold text-slate-800">{school.board || "CBSE"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Address / City:</span>
                    <span className="font-semibold text-slate-800">{school.address || "India"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Academic Session:</span>
                    <span className="font-semibold text-slate-800">{school.session || "2024-2025"}</span>
                  </div>
                  {school._count && (
                    <div className="flex items-center justify-between text-slate-600 pt-1">
                      <span className="text-slate-500">Enrolled Total:</span>
                      <span className="font-semibold text-[#29ABE2]">
                        {school._count.students || 0} Students · {school._count.staff || 0} Staff
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    data-testid={`edit-school-${school.code}`}
                    onClick={() => handleOpenEdit(school)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    data-testid={`delete-school-${school.code}`}
                    onClick={() => handleDelete(school)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddOpen || !!editingSchool} onOpenChange={() => { setIsAddOpen(false); setEditingSchool(null); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">
              {editingSchool ? "Edit School Details" : "Add New School"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              {editingSchool
                ? "Update campus settings and session information."
                : "Creates a new multi-tenant school instance & generates admin access credentials."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">School Name</label>
              <Input
                data-testid="school-form-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Greenwood International"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">School Code</label>
                <Input
                  data-testid="school-form-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SCH004"
                  className="mt-1 rounded-xl uppercase font-mono"
                  disabled={!!editingSchool}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Board</label>
                <Select value={formData.board} onValueChange={(val) => setFormData({ ...formData, board: val })}>
                  <SelectTrigger data-testid="school-form-board" className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="IB">IB</SelectItem>
                    <SelectItem value="State Board">State Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">City / Address</label>
                <Input
                  data-testid="school-form-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Gurugram"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Session</label>
                <Input
                  data-testid="school-form-session"
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  placeholder="2024-2025"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            {!editingSchool && (
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-[12px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[#29ABE2]" /> School Admin Access (Optional Customization)
                </p>
                <div>
                  <label className="text-[12px] text-slate-600">Admin Email / Login ID (Leave blank to auto-generate)</label>
                  <Input
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder={`e.g. admin.${formData.code ? formData.code.toLowerCase() : "school"}@vidyaloop.in`}
                    className="mt-1 rounded-xl text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-600">Password (Leave blank to auto-generate)</label>
                  <Input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="Auto-generated if left empty"
                    className="mt-1 rounded-xl text-[13px]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingSchool(null); }} className="rounded-full">
              Cancel
            </Button>
            <Button
              data-testid="save-school-btn"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save School"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Admin Credentials Modal */}
      <Dialog open={!!generatedCredentials} onOpenChange={() => setGeneratedCredentials(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px] flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" /> School & Admin Access Created!
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-600 mt-1">
              Save these credentials to provide login access to the School Admin.
            </DialogDescription>
          </DialogHeader>

          {generatedCredentials && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-[13.5px] mt-2">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">School Name:</span>
                <span className="font-bold text-slate-900">{generatedCredentials.schoolName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">School Code:</span>
                <span className="font-mono font-bold text-[#29ABE2]">{generatedCredentials.schoolCode}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Admin Login ID:</span>
                <span className="font-mono font-bold text-slate-800">{generatedCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {showPassword ? generatedCredentials.password : "••••••••••••"}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              onClick={() => copyToClipboard(`School: ${generatedCredentials?.schoolName}\nCode: ${generatedCredentials?.schoolCode}\nLogin ID: ${generatedCredentials?.email}\nPassword: ${generatedCredentials?.password}`)}
              variant="outline"
              className="rounded-full flex items-center gap-2 border-slate-300"
            >
              <Copy className="h-4 w-4 text-[#29ABE2]" /> Copy Credentials
            </Button>
            <Button
              onClick={() => setGeneratedCredentials(null)}
              className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
