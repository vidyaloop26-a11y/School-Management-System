import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { approvalStyles, pickupStyles } from "@/lib/frontOfficeConstants";
import { Loader2, ShieldCheck, ShieldX, ScanLine, DoorOpen, Clock } from "lucide-react";

const reasonCopy = {
  NOT_FOUND: "Pass not found. Ask the holder to check in again.",
  CANCELLED: "This pass has been cancelled.",
  REJECTED: "This pass was not approved.",
  EXPIRED: "This pass has expired.",
  USED: "Pass has already been used.",
  PENDING: "Pass is still pending approval.",
};

function StatusCard({ data }) {
  const pass = data?.gatePass;
  return (
    <div className="text-center">
      <div
        className={`mx-auto inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${data.valid ? "bg-emerald-100" : "bg-rose-100"}`}
      >
        {data.valid ? <ShieldCheck className="h-10 w-10 text-emerald-600" /> : <ShieldX className="h-10 w-10 text-rose-600" />}
      </div>
      <h1 className={`font-display text-[28px] font-bold ${data.valid ? "text-emerald-600" : "text-rose-600"}`}>
        {data.valid ? "Access Granted" : "Access Denied"}
      </h1>
      <p className="text-[13.5px] text-slate-500 mt-1">{data.reason || (data.valid ? "Pass is valid" : "")}</p>

      {pass && (
        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <DoorOpen className="h-5 w-5 text-[#29ABE2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{pass.holderName}</p>
              <p className="text-[11.5px] text-slate-500">Holder · {pass.passType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[12px]">
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Purpose</p>
              <p className="font-semibold text-slate-700 mt-1 break-words">{pass.purpose || "—"}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Student</p>
              <p className="font-semibold text-slate-700 mt-1 truncate">{pass.studentName || "—"}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approval</p>
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${approvalStyles[pass.approvalStatus] || approvalStyles.PENDING}`}>
                {pass.approvalStatus || "PENDING"}
              </span>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Valid Until</p>
              <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                {pass.validUntil ? new Date(pass.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </div>

          {pass.pickupStatus && (
            <div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${pickupStyles[pass.pickupStatus] || pickupStyles.PENDING}`}>
                Pickup: {pass.pickupStatus}
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center pt-1">
            {data.valid ? "Holder may exit the campus." : "Please direct the holder to the front office."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GatePassVerify() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenParam);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!tokenParam);
  const [error, setError] = useState("");

  const verify = useCallback(
    async (t = token) => {
      const value = (t || "").trim();
      if (!value) {
        setError("Enter or scan a gate pass code");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await api.verifyGatePassPublic(value);
        setData(res);
      } catch (err) {
        setData(null);
        setError(err.response?.data?.message || "Could not verify pass");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    setToken(tokenParam);
    if (tokenParam) {
      verify(tokenParam);
    } else {
      setData(null);
    }
  }, [tokenParam, verify]);

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_55%,#bae6fd_100%)] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl shadow-xl shadow-sky-200/50 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#29ABE2] shadow-lg shadow-[#29ABE2]/25 mb-3">
              <ScanLine className="h-7 w-7 text-white" strokeWidth={1.6} />
            </div>
            <h1 className="font-display text-[24px] font-bold text-slate-900">Gate Pass Verification</h1>
            <p className="text-[12.5px] text-slate-500 mt-1">Scan the QR or enter the pass code</p>
          </div>

          {!data && !loading && (
            <div className="space-y-3">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none text-center font-mono tracking-widest text-[14px]"
                placeholder="e.g. VLG-XXXXXXX"
              />
              <button
                onClick={() => verify()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13.5px] font-semibold transition shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" /> Verify Pass
              </button>
              {error && <p className="text-center text-[12.5px] text-rose-600">{error}</p>}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
              <p className="text-[12.5px] text-slate-500">Verifying pass…</p>
            </div>
          )}

          {data && (
            <div>
              <StatusCard data={data} />
              <button
                onClick={() => { setData(null); setToken(""); }}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition"
              >
                Verify Another Pass
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}