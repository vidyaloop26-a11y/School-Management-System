import React, { useState } from "react";
import api, { setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Lock, Eye, EyeOff, Building2 } from "lucide-react";

// Rendered when the signed-in account carries mustChangePassword — freshly
// provisioned or reset credentials. Nothing else in the app is reachable
// until a new password is set (mirrors the server-side gate).
export default function ChangePasswordGate({ children }) {
  const { user, refetchUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user?.mustChangePassword) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      const { accessToken, refreshToken: newRefreshToken } = res.data;
      if (accessToken) {
        setAuthToken(accessToken);
        localStorage.setItem("refreshToken", newRefreshToken || "");
      }
      await refetchUser();
    } catch (err) {
      const msg =
        err.response?.data?.details?.fieldErrors?.currentPassword?.[0] ||
        err.response?.data?.message ||
        "Could not update password. Try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#29ABE2]">
            <Building2 className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Set your new password</h1>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Your account uses a temporary password. Choose a new one to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-soft rounded-2xl p-6 bg-white/80 border border-white/70 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Current / temporary password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={show ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-white/70 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Confirm new password</label>
            <input
              type={show ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20"
              placeholder="Repeat new password"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#29ABE2] hover:bg-[#1d97cc] text-white font-medium py-2.5 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update password & continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
