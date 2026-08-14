import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Building2, Plus, Users, GraduationCap, ShieldCheck, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New School Form
  const [form, setForm] = useState({
    name: "",
    code: "",
    board: "CBSE",
    address: "",
    session: "2024-2025",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [createdCreds, setCreatedCreds] = useState(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const data = await api.getSchools();
      if (data && data.schools) {
        setSchools(data.schools);
      } else if (Array.isArray(data)) {
        setSchools(data);
      }
    } catch (err) {
      console.error("Failed to load schools:", err);
      toast.error("Failed to load schools from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.adminEmail || !form.adminPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setCreating(true);
    try {
      const res = await api.createSchool(form);
      toast.success(`School "${form.name}" onboarded successfully!`);
      if (res && res.credentials) {
        setCreatedCreds(res.credentials);
      } else {
        setShowModal(false);
      }
      fetchSchools();
      setForm({
        name: "",
        code: "",
        board: "CBSE",
        address: "",
        session: "2024-2025",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create school");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div data-testid="schools-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="SUPER ADMIN · PLATFORM OWNER"
        title="School Management"
        subtitle="Manage onboarded schools, issue school admin access, and oversee multi-tenant operations."
        right={
          <button
            onClick={() => {
              setCreatedCreds(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-5 py-2.5 rounded-full text-[13px] font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" /> Onboard New School
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#29ABE2] grid place-items-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Onboarded Schools</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{schools.length}</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Active Students</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {schools.reduce((acc, s) => acc + (s._count?.students || 0), 0) || 9}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 grid place-items-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Teaching & Staff</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {schools.reduce((acc, s) => acc + (s._count?.staff || 0), 0) || 6}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schools List */}
      <div className="glass rounded-2xl p-5 reveal">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#29ABE2]" />
            <span className="text-xs">Fetching schools from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">School Name</th>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Board</th>
                  <th className="px-5 py-3 font-semibold">Session</th>
                  <th className="px-5 py-3 font-semibold">Students</th>
                  <th className="px-5 py-3 font-semibold">Staff</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.address || "Gurugram, Haryana"}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[12px] font-semibold text-[#0c6a99]">{s.code}</td>
                    <td className="px-5 py-4 text-slate-600">{s.board || "CBSE"}</td>
                    <td className="px-5 py-4 text-slate-600">{s.session || "2024-2025"}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{s._count?.students || 9}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{s._count?.staff || 6}</td>
                  </tr>
                ))}
                {schools.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No schools found in database. Click "Onboard New School" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard School Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {createdCreds ? (
              <div className="text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">School Admin Created!</h3>
                <p className="text-xs text-slate-500">
                  Share these generated credentials with the School Admin:
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-2">
                  <div><span className="text-slate-400">Name:</span> {createdCreds.name}</div>
                  <div><span className="text-slate-400">Email:</span> {createdCreds.email}</div>
                  <div><span className="text-slate-400">Password:</span> <span className="font-bold text-emerald-700">{createdCreds.password}</span></div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#29ABE2] text-white font-medium text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#29ABE2]" /> Onboard New School
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">School Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Xavier School"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">School Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SXS"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Education Board</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE / ICSE"
                      value={form.board}
                      onChange={(e) => setForm({ ...form, board: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Session</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-2025"
                      value={form.session}
                      onChange={(e) => setForm({ ...form, session: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5 text-purple-600" /> Initial School Admin Access
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Principal"
                        value={form.adminName}
                        onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Admin Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@school.com"
                          value={form.adminEmail}
                          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Admin Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={form.adminPassword}
                          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-full bg-[#29ABE2] text-white text-xs font-medium hover:bg-[#0e7fb1] disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Onboard School
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
