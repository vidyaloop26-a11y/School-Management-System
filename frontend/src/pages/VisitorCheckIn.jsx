import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import { PURPOSES, passQrUrl, approvalStyles, pickupStyles } from "@/lib/frontOfficeConstants";
import { Loader2, ClipboardCheck, RefreshCw, Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const pickupsRequiringVerification = ["STUDENT_PICKUP"];

function SchoolIntro({ config }) {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#29ABE2] shadow-lg shadow-[#29ABE2]/25 mb-3">
        <ClipboardCheck className="h-7 w-7 text-white" strokeWidth={1.6} />
      </div>
      <h1 className="font-display text-[26px] font-bold text-slate-900 leading-tight">Visitor Gate Pass</h1>
      <p className="text-[13px] text-slate-500 mt-1">{config?.schoolName || "VidyaLoop School"} · Visitor Self Check-in</p>
    </div>
  );
}

function SuccessTicket({ result, school }) {
  const [status, setStatus] = useState(result.visitor);
  const [refreshing, setRefreshing] = useState(false);
  const qrUrl = passQrUrl(result.gatePass?.qrToken);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.getPublicVisitorStatus(result.visitor.id);
      setStatus(res.visitor);
      toast.success("Status updated");
    } catch {
      toast.error("Could not refresh status. Try again.");
    } finally {
      setRefreshing(false);
    }
  }, [result.visitor.id]);

  useEffect(() => {
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-100 mb-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">You're checked in, {status.name}</h2>
        <p className="text-[13px] text-slate-500 mt-1">{school?.name || school?.code || "Welcome"}</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-center">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Gate Pass</p>
        <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200">
          <QRCodeSVG
            value={qrUrl}
            size={180}
            level="M"
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>
        <div className="mt-3 font-mono text-[12px] text-slate-500 tracking-widest">{result.gatePass?.qrToken}</div>
        <p className="text-[11.5px] text-slate-400 mt-2">Show this QR at the gate to check out.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Gate Access</p>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${approvalStyles[status.approvalStatus] || approvalStyles.PENDING}`}>
            {status.approvalStatus || "PENDING"}
          </span>
        </div>
        {pickupsRequiringVerification.includes(status.purpose) && (
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Pickup Verification</p>
            <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${status.pickupStatus ? pickupStyles[status.pickupStatus] || pickupStyles.PENDING : pickupStyles.PENDING}`}>
              {status.pickupStatus || "PENDING"}
            </span>
          </div>
        )}
      </div>

      {status.pickupStatus === "MANUAL" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[12.5px] text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Your name isn't on the authorised pickup list. Front office will verify with the student's parent manually.</span>
        </div>
      )}
      {status.approvalStatus === "REJECTED" && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-[12.5px] text-rose-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Your visit was not approved. Please contact the front office for assistance.</span>
        </div>
      )}

      <button
        onClick={refresh}
        disabled={refreshing}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition disabled:opacity-60"
      >
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Refresh Status
      </button>
    </div>
  );
}

export default function VisitorCheckIn() {
  const [searchParams] = useSearchParams();
  const schoolParam = searchParams.get("school") || "";
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    purpose: "",
    hostStaffId: "",
    organisation: "",
    studentId: "",
    admissionClass: "",
    notes: "",
    photoUrl: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!schoolParam) {
      setLoadingConfig(false);
      return;
    }
    setLoadingConfig(true);
    api
      .getPublicFrontOfficeConfig(schoolParam)
      .then((res) => {
        setConfig(res);
        if (!res?.studentsEnabled) {
          setStudents([]);
        }
      })
      .catch(() => setConfig({ error: "invalid" }))
      .finally(() => setLoadingConfig(false));
  }, [schoolParam]);

  const loadStudents = async (q) => {
    if (!q) {
      setStudents([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.searchPublicStudents(schoolParam, q);
      setStudents(res.students || []);
    } catch {
      setStudents([]);
    } finally {
      setSearching(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.purpose) {
      toast.error("Name, phone and purpose are required");
      return;
    }
    if (form.purpose === "STUDENT_PICKUP" && !form.studentId) {
      toast.error("Search and select the student being picked up");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.publicVisitorCheckIn({
        schoolId: schoolParam,
        name: form.name,
        phone: form.phone,
        purpose: form.purpose,
        hostStaffId: form.hostStaffId || undefined,
        organisation: form.organisation || undefined,
        studentId: form.studentId || undefined,
        admissionClass: form.admissionClass || undefined,
        notes: form.notes || undefined,
        photoUrl: form.photoUrl || undefined,
      });
      setResult(res);
      toast.success("Check-in complete — show your QR gate pass");
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
      </div>
    );
  }

  if (!schoolParam || config?.error === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">School not found</h1>
          <p className="text-[13px] text-slate-500 mt-2">
            This check-in link isn't configured. Ask the school front office for the correct link.
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_55%,#bae6fd_100%)] flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl shadow-xl shadow-sky-200/50 p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-2rem)] thin-scroll">
            <SuccessTicket result={result} school={config?.school || {}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_55%,#bae6fd_100%)] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl shadow-xl shadow-sky-200/50 p-6 sm:p-8">
          <SchoolIntro config={{ schoolName: config?.school?.name || config?.schoolId }} />

          <form onSubmit={handleSubmit} className="space-y-3.5 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                placeholder="Mobile number"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit</label>
              <select
                value={form.purpose}
                onChange={set("purpose")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                required
              >
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {!["STUDENT_PICKUP", "ADMISSION_ENQUIRY"].includes(form.purpose) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Person to Meet</label>
                <select
                  value={form.hostStaffId}
                  onChange={set("hostStaffId")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                >
                  <option value="">Select staff member</option>
                  {(config?.staff || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.purpose === "STUDENT_PICKUP" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Being Picked Up</label>
                <input
                  type="text"
                  onChange={(e) => loadStudents(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                  placeholder="Type at least 3 characters to search"
                />
                {config?.studentsEnabled === false && (
                  <p className="text-[11.5px] text-amber-600 mt-1.5">Instant student lookup is disabled at this school.</p>
                )}
                {searching ? (
                  <div className="flex items-center gap-2 text-slate-400 text-[12px] mt-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching students…
                  </div>
                ) : students.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-44 overflow-y-auto thin-scroll">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, studentId: s.id }))}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition ${form.studentId === s.id ? "bg-[#e0f2fe]" : ""}`}
                      >
                        <div className="font-semibold text-slate-800 text-[13px]">{s.name}</div>
                        <div className="text-[11.5px] text-slate-500">
                          {s.class}-{s.section} · {s.admissionNo}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {form.purpose === "ADMISSION_ENQUIRY" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Applying For (optional)</label>
                <input
                  type="text"
                  value={form.admissionClass}
                  onChange={set("admissionClass")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                  placeholder="e.g. 5"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organisation (optional)</label>
              <input
                type="text"
                value={form.organisation}
                onChange={set("organisation")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none"
                placeholder="Company / organisation"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Photo (optional)</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[12.5px] font-semibold transition"
                >
                  <Camera className="h-4 w-4" /> {form.photoUrl ? "Change photo" : "Take / upload photo"}
                </button>
                {form.photoUrl && (
                  <img src={form.photoUrl} alt="Visitor" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13.5px] font-semibold transition shadow-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Check In & Get Gate Pass"}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              By checking in you agree to be identifiable on school premises for safety purposes.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}