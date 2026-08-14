import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/lib/RoleContext";
import {
  Lock, Mail, Eye, EyeOff, ShieldCheck, Building2,
  Users, UserCheck, AlertCircle, ArrowRight, Sparkles, Clock, GraduationCap
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Preset Multi-Tenant Demo Accounts for Quick Credentials Fill
const PRESET_DEMO_ACCOUNTS = [
  {
    roleName: "Admin (VLPS)",
    identifier: "admin@vidyaloop.in",
    password: "Admin@1234",
    name: "Rajesh Director (Vidyaloop Public)",
    icon: Building2,
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    roleName: "Admin (SXIS)",
    identifier: "admin@stxaviers.edu.in",
    password: "Admin@1234",
    name: "Sister Clara (St. Xavier)",
    icon: Building2,
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  {
    roleName: "Admin (DPA)",
    identifier: "admin@dpa.edu.in",
    password: "Admin@1234",
    name: "Dr. Amit Singhania (Delhi Public)",
    icon: Building2,
    badgeBg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  },
  {
    roleName: "Super Admin",
    identifier: "superadmin@vidyaloop.in",
    password: "Super@1234",
    name: "Vidyaloop Owner",
    icon: ShieldCheck,
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    roleName: "Teacher (VLPS)",
    identifier: "vls-101",
    password: "VLS-101@1234",
    name: "Neha Kulkarni",
    icon: Users,
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    roleName: "Student (Try)",
    identifier: "VL2024001",
    password: "Student@1234",
    name: "Aarav Sharma (Restricted)",
    icon: GraduationCap,
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    isStudent: true,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [identifier, setIdentifier] = useState("admin@vidyaloop.in");
  const [password, setPassword] = useState("Admin@1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quick fill preset credentials
  const handleQuickFill = (account) => {
    setIdentifier(account.identifier);
    setPassword(account.password);
    setErrorMsg("");
  };

  // Form Submission & Automatic Role Resolution
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const inputClean = identifier.trim().toLowerCase();

    // Guard: Student Login Prevention
    if (
      inputClean.startsWith("vl2024") ||
      inputClean.startsWith("sx2024") ||
      inputClean.startsWith("dpa2024") ||
      inputClean.includes("student") ||
      inputClean === "aarav.sharma@student.local"
    ) {
      setErrorMsg(
        "Student login is not permitted. Students do not have direct portal access. Please log in using registered Parent credentials to access student records."
      );
      return;
    }

    if (!inputClean || !password) {
      setErrorMsg("Please enter both your email/username and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt Backend API Login
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inputClean, password }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();

        // Check if returned user role is student
        if (data.user.role === "student") {
          setErrorMsg(
            "Student login is not permitted. Please log in using Parent credentials."
          );
          setLoading(false);
          return;
        }

        login(data.user, data.accessToken);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate("/");
        return;
      }

      // 2. Demo Fallback
      let resolvedUser = null;

      if (inputClean.includes("superadmin")) {
        resolvedUser = {
          name: "Vidyaloop Super Admin",
          email: inputClean,
          role: "Admin",
          schoolName: "Vidyaloop System Administration",
        };
      } else if (inputClean.includes("stxaviers")) {
        resolvedUser = {
          name: "Sister Clara",
          email: inputClean,
          role: "Admin",
          schoolName: "St. Xavier International School",
        };
      } else if (inputClean.includes("dpa")) {
        resolvedUser = {
          name: "Dr. Amit Singhania",
          email: inputClean,
          role: "Admin",
          schoolName: "Delhi Public Academy",
        };
      } else {
        resolvedUser = {
          name: "Rajesh Director",
          email: inputClean,
          role: "Admin",
          schoolName: "Vidyaloop Public School",
        };
      }

      login(resolvedUser, "demo-jwt-token");
      toast.success(`Signed in successfully as ${resolvedUser.name}`);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrorMsg("Authentication failed. Please verify credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#29ABE2]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#29ABE2] to-blue-600 grid place-items-center shadow-xl shadow-[#29ABE2]/20 text-white font-display font-bold text-2xl border border-white/20 mb-3">
            V
          </div>
          <div className="font-display font-bold text-2xl text-white tracking-tight">
            Vidya<span className="text-[#29ABE2]">loop</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold mt-0.5">
            Multi-Tenant School Management Platform
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Enter your school admin or staff credentials to access your isolated school portal.
          </p>
        </div>

        {/* Error Alert / Student Restriction Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-start gap-3 reveal">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-200 text-[13px] mb-0.5">
                Access Restricted
              </div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@vidyaloop.in or username"
                className="w-full bg-slate-800/70 border border-slate-700/80 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => toast.info("Contact your school admin for password reset assistance.")}
                className="text-[11.5px] text-[#29ABE2] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/70 border border-slate-700/80 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11.5px] text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#29ABE2]" /> 24-hour session security enabled
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#29ABE2] to-blue-600 hover:from-[#1b93cb] hover:to-blue-700 transition text-white font-medium text-sm shadow-lg shadow-[#29ABE2]/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                Sign In to School Portal <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Fill Chips */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#29ABE2]" /> Multi-Tenant Demo Logins:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.roleName}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`p-2 rounded-xl border ${acc.badgeBg} text-left transition hover:scale-[1.02] flex items-center gap-2`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-[11px] truncate">{acc.roleName}</div>
                    <div className="text-[9.5px] opacity-75 truncate">{acc.identifier}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
