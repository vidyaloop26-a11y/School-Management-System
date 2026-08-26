import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth as useAuthQuery, useLogin, useLogout } from "./queries";
import { setAuthToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: authUser, isLoading, refetch } = useAuthQuery();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      
      if (storedToken && storedUser) {
        setAuthToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
      setIsInitialized(true);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
    }
  }, [authUser]);

  const login = useCallback(
    async (identifier, password) => {
      await loginMutation.mutateAsync({ identifier, password });
      await refetch();
    },
    [loginMutation, refetch]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    queryClient.clear();
  }, [logoutMutation, queryClient]);

  const value = {
    user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser: refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  SCHOOL_ADMIN: "schoolAdmin",
  STAFF: "staff",
  PARENT: "parent",
};

// Legacy alias — accounts migrated to role:"staff" + duties:["teacher"].
ROLES.TEACHER = ROLES.STAFF;

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN];

export const DUTIES = [
  "principal",
  "vicePrincipal",
  "hod",
  "teacher",
  "examCoordinator",
  "accountant",
  "frontOffice",
  "librarian",
  "transportIncharge",
  "warden",
  "hrManager",
  "admissionsOfficer",
  "itAdmin",
];

export const isAdminRole = (user) => !!user && ADMIN_ROLES.includes(user.role);

export const hasDuty = (user, ...needed) => {
  if (!user) return false;
  if (isAdminRole(user)) return true;
  if (user.role !== ROLES.STAFF) return false;
  const held = Array.isArray(user.duties) ? user.duties : [];
  return needed.some((d) => held.includes(d));
};

export const ROLE_ROUTES = {
  [ROLES.SUPER_ADMIN]: "/",
  [ROLES.SCHOOL_ADMIN]: "/",
  [ROLES.STAFF]: "/",
  [ROLES.PARENT]: "/",
};