import React from "react";
import { useAuth, isAdminRole } from "./AuthContext";

// Convenience hook: exposes the user's role plus duty-aware flags.
// "staff" role users with the teacher duty are treated as teachers by views.
export function useRole() {
  const { user, logout, login } = useAuth();
  const role = user?.role || "schoolAdmin";
  const duties = Array.isArray(user?.duties) ? user.duties : [];
  return {
    user,
    role,
    duties,
    isTeacherView: role === "staff" && duties.includes("teacher"),
    isAdmin: isAdminRole(user),
    logout,
    login,
  };
}

export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  SCHOOL_ADMIN: "schoolAdmin",
  STAFF: "staff",
  TEACHER: "teacher", // legacy alias — now a duty, not a role
  PARENT: "parent",
};
