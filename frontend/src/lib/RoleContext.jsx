import React from "react";
import { useAuth } from "./AuthContext";

export function useRole() {
  const { user, logout, login } = useAuth();
  return {
    user,
    role: user?.role || "schoolAdmin",
    logout,
    login,
  };
}

export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  SCHOOL_ADMIN: "schoolAdmin",
  TEACHER: "teacher",
  PARENT: "parent",
};
