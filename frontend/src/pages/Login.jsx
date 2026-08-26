import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Building2, ShieldCheck, Landmark, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(identifier, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-[#f8fafc] text-slate-800 overflow-hidden relative font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-sky-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#29ABE2]/10 blur-[130px] pointer-events-none" />

      {/* Left Column: Branding (Visible on lg screens) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 text-white relative overflow-hidden">
        {/* Glow effect on background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(41,171,226,0.18),transparent_60%)] pointer-events-none" />
        
        {/* Decorative Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-sky-400/10 border border-sky-400/20 backdrop-blur-md">
            <Building2 className="h-5 w-5 text-sky-400" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Vidyaloop
          </span>
        </div>

        <div className="my-auto max-w-lg relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3 w-3" /> Empowering Education
          </div>
          <h2 className="font-display text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
            Sophisticated Software for Modern Schooling.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            Simplify administrative workflows, manage attendance real-time, generate report cards dynamically, and connect parents & teachers seamlessly.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Role-Based Security</h4>
                <p className="text-xs text-slate-400">Granular authorization control</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Landmark className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Complete Finance</h4>
                <p className="text-xs text-slate-400">Streamlined ledger management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} Vidyaloop Platform. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="text-center lg:text-left">
            {/* Logo for mobile only */}
            <div className="inline-flex lg:hidden items-center justify-center h-14 w-14 rounded-2xl bg-[#29ABE2] mb-5 shadow-lg shadow-[#29ABE2]/20">
              <Building2 className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Enter your credentials to access the Vidyaloop dashboard.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 shadow-[0_30px_60px_-15px_rgba(20,50,90,0.1)] border border-white/60 bg-white/70 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 p-3.5 text-xs font-medium flex items-start gap-2"
                  role="alert"
                >
                  <svg className="h-4.5 w-4.5 flex-shrink-0 text-rose-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email or Username
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent transition shadow-inner"
                  placeholder="superadmin@vidyaloop.in"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent transition shadow-inner pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#29ABE2] hover:bg-[#0e7fb1] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition text-white px-6 py-3.5 text-sm font-semibold shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} Vidyaloop School Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}