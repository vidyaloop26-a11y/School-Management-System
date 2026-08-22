import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollText, Plus, Search, Printer, CheckCircle2, Award, FileText, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/AuthContext";

const SCHOOL_CERTIFICATES_MAP = {
  VLPS: [
    { id: "c-v1", schoolCode: "VLPS", studentId: "VL2024001", studentName: "Aarav Sharma", cls: "8", section: "A", type: "Transfer Certificate", certificateNo: "TC-VLPS-0891", issueDate: "2026-08-15", status: "ISSUED", conduct: "Exemplary", reason: "Father Transfer to Mumbai Branch", issuedBy: "Vikram Singh" },
    { id: "c-v2", schoolCode: "VLPS", studentId: "VL2024002", studentName: "Ishita Verma", cls: "8", section: "A", type: "Character Certificate", certificateNo: "CC-VLPS-0155", issueDate: "2026-08-05", status: "ISSUED", conduct: "Outstanding", reason: "Inter-School Math Olympiad Winner", issuedBy: "Neha Kulkarni" },
  ],
  SXIS: [
    { id: "c-s1", schoolCode: "SXIS", studentId: "SX2024001", studentName: "Vivaan Joshi", cls: "8", section: "A", type: "Bonafide Certificate", certificateNo: "BC-SXIS-0412", issueDate: "2026-08-10", status: "ISSUED", conduct: "Good", reason: "Passport Application Verification", issuedBy: "Sister Clara" },
    { id: "c-s2", schoolCode: "SXIS", studentId: "SX2024002", studentName: "Ananya Sen", cls: "8", section: "A", type: "Merit Certificate", certificateNo: "MC-SXIS-0988", issueDate: "2026-08-02", status: "ISSUED", conduct: "Exemplary", reason: "1st Rank in Annual Science Fair", issuedBy: "Priya Sharma" },
  ],
  DPA: [
    { id: "c-d1", schoolCode: "DPA", studentId: "DPA2024001", studentName: "Aditya Kumar", cls: "7", section: "A", type: "Bonafide Certificate", certificateNo: "BC-DPA-0490", issueDate: "2026-08-19", status: "REQUESTED", conduct: "Good", reason: "State Athletics Championship Entry", issuedBy: "Dr. Amit Singhania" },
  ],
};

const ALL_CERTIFICATES = [
  ...SCHOOL_CERTIFICATES_MAP.VLPS,
  ...SCHOOL_CERTIFICATES_MAP.SXIS,
  ...SCHOOL_CERTIFICATES_MAP.DPA,
];

function getFallbackCertificatesForScope(activeSchoolId) {
  if (!activeSchoolId || activeSchoolId === "all") return ALL_CERTIFICATES;
  if (SCHOOL_CERTIFICATES_MAP[activeSchoolId]) return SCHOOL_CERTIFICATES_MAP[activeSchoolId];
  return [];
}

export default function Certificates() {
  const { user } = useAuth();
  const role = user?.role || "superAdmin";
  const isParentOrStudent = role === "parent";

  const [activeSchoolId, setActiveSchoolId] = useState(() => {
    return localStorage.getItem("vidyaloop_active_school_id") || "all";
  });

  useEffect(() => {
    const handleScopeChange = () => {
      setActiveSchoolId(localStorage.getItem("vidyaloop_active_school_id") || "all");
    };
    window.addEventListener("schoolScopeChanged", handleScopeChange);
    return () => window.removeEventListener("schoolScopeChanged", handleScopeChange);
  }, []);

  const [certificates, setCertificates] = useState(() => getFallbackCertificatesForScope(activeSchoolId));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCert, setSelectedCert] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const [form, setForm] = useState({
    studentName: "",
    studentId: "",
    cls: "10",
    section: "A",
    type: "Transfer Certificate",
    conduct: "Good",
    reason: "",
  });

  const filteredCerts = useMemo(() => {
    const dataset = SCHOOL_CERTIFICATES_MAP[activeSchoolId] || ALL_CERTIFICATES;
    return dataset.filter((c) => {
      const matchesSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) || c.certificateNo.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter, activeSchoolId]);

  const handleIssueCertificate = (e) => {
    e.preventDefault();
    if (!form.studentName || !form.reason) {
      toast.error("Please fill student name and reason");
      return;
    }
    const newCert = {
      id: Date.now().toString(),
      studentId: form.studentId || `VL${Math.floor(100000 + Math.random() * 900000)}`,
      studentName: form.studentName,
      cls: form.cls,
      section: form.section,
      type: form.type,
      certificateNo: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      issueDate: new Date().toISOString().split("T")[0],
      status: isParentOrStudent ? "REQUESTED" : "ISSUED",
      conduct: form.conduct,
      reason: form.reason,
      issuedBy: user?.name || "Principal",
    };
    setCertificates([newCert, ...certificates]);
    toast.success(isParentOrStudent ? "Certificate request submitted!" : "Certificate issued successfully!");
    setForm({ studentName: "", studentId: "", cls: "10", section: "A", type: "Transfer Certificate", conduct: "Good", reason: "" });
    setIssueModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Certificate Management & Issuance"
        subtitle="Generate and issue official Transfer Certificates (TC), Character Certificates, Bonafide Student Certificates, and Merit Awards."
        action={
          <button
            onClick={() => setIssueModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
          >
            {isParentOrStudent ? <Send className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isParentOrStudent ? "Request Certificate" : "Issue New Certificate"}
          </button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Transfer Certificates (TC)", count: certificates.filter((c) => c.type === "Transfer Certificate").length, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "Bonafide Certificates", count: certificates.filter((c) => c.type === "Bonafide Certificate").length, icon: ScrollText, color: "text-emerald-600 bg-emerald-50" },
          { label: "Character Certificates", count: certificates.filter((c) => c.type === "Character Certificate").length, icon: CheckCircle2, color: "text-purple-600 bg-purple-50" },
          { label: "Merit & Sports Awards", count: certificates.filter((c) => c.type === "Merit Certificate").length, icon: Award, color: "text-amber-600 bg-amber-50" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl grid place-items-center ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-slate-900">{item.count}</div>
                <div className="text-[11.5px] text-slate-500 font-medium">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name or certificate number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white/80"
            >
              <option value="all">All Certificate Types</option>
              <option value="Transfer Certificate">Transfer Certificate (TC)</option>
              <option value="Bonafide Certificate">Bonafide Certificate</option>
              <option value="Character Certificate">Character Certificate</option>
              <option value="Merit Certificate">Merit Certificate</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                <th className="pb-3 px-3">Cert #</th>
                <th className="pb-3 px-3">Student Name</th>
                <th className="pb-3 px-3">Certificate Type</th>
                <th className="pb-3 px-3">Conduct / Purpose</th>
                <th className="pb-3 px-3">Issue Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.map((c) => (
                <tr key={c.id} className="hover:bg-white/60 transition">
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-600">{c.certificateNo}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800">{c.studentName}</div>
                    <div className="text-[11px] text-slate-500">{c.studentId} • Class {c.cls}-{c.section}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">{c.type}</td>
                  <td className="py-3.5 px-3 text-slate-600">
                    <div>{c.reason}</div>
                    <div className="text-[11px] text-slate-400">Conduct: {c.conduct}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{c.issueDate}</td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.status === "ISSUED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedCert(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition shadow-xs"
                    >
                      <ScrollText className="h-3.5 w-3.5 text-[#29ABE2]" />
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue / Request Certificate */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">{isParentOrStudent ? "Request Student Certificate" : "Issue Official Certificate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueCertificate} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admission No</label>
                <input
                  type="text"
                  placeholder="VL2024001"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class & Section</label>
                <input
                  type="text"
                  placeholder="10-A"
                  value={`${form.cls}-${form.section}`}
                  onChange={(e) => {
                    const [c, s] = e.target.value.split("-");
                    setForm({ ...form, cls: c || "10", section: s || "A" });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Certificate Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Transfer Certificate">Transfer Certificate (TC)</option>
                <option value="Bonafide Certificate">Bonafide Student Certificate</option>
                <option value="Character Certificate">Character Certificate</option>
                <option value="Merit Certificate">Merit & Achievement Award</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Higher Education Admission / Passport / Competition"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setIssueModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {isParentOrStudent ? "Submit Request" : "Issue Certificate"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Preview Modal */}
      {selectedCert && (
        <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
          <DialogContent className="max-w-2xl bg-white p-8 rounded-2xl shadow-2xl border-4 border-double border-slate-300">
            <div className="text-center space-y-4">
              <div className="font-display text-2xl font-bold text-slate-900 tracking-tight">VIDYALOOP INTERNATIONAL SCHOOL</div>
              <div className="text-[12px] text-slate-500 uppercase tracking-widest font-semibold">Affiliated to CBSE • School Code: VL-1002</div>
              <div className="w-24 h-0.5 bg-[#29ABE2] mx-auto my-2" />

              <div className="py-4">
                <span className="font-display text-xl font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-1">
                  {selectedCert.type}
                </span>
              </div>

              <div className="text-left leading-relaxed text-slate-700 space-y-4 py-4 text-[14px]">
                <p>
                  This is to certify that <strong>{selectedCert.studentName}</strong> (Admission No: <strong>{selectedCert.studentId}</strong>), son/daughter of <strong>Mr. & Mrs. Sharma</strong>, is a bonafide student of this institution studying in Class <strong>{selectedCert.cls}-{selectedCert.section}</strong> during the academic session 2026-2027.
                </p>
                <p>
                  He/She bears a <strong>{selectedCert.conduct}</strong> moral character and active academic record. This certificate is issued upon request for the purpose of: <em>{selectedCert.reason}</em>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-12 text-[12px] text-slate-600">
                <div className="text-left">
                  <div className="font-semibold text-slate-800">Date of Issue: {selectedCert.issueDate}</div>
                  <div className="font-mono text-slate-500 mt-1">Cert No: {selectedCert.certificateNo}</div>
                </div>
                <div className="text-right">
                  <div className="border-t border-slate-400 pt-1 inline-block px-6 font-bold text-slate-900">
                    Principal's Signature & Seal
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end">
              <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl text-[13px] hover:bg-slate-900">
                <Printer className="h-4 w-4" /> Print Certificate
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
