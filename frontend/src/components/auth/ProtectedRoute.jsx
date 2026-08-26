import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, isAdminRole } from "@/lib/AuthContext";
import { Loader2, Building2 } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles, allowedDuties }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#29ABE2]">
            <Building2 className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
          <p className="text-slate-500 text-[14px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (allowedDuties && allowedDuties.length) {
    // Admins pass everything; staff need at least one of the listed duties.
    const ok =
      isAdminRole(user) ||
      (user.role === "staff" &&
        Array.isArray(user.duties) &&
        user.duties.some((d) => allowedDuties.includes(d)));
    if (!ok) return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)]">
        <Loader2 className="h-8 w-8 text-[#29ABE2] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}