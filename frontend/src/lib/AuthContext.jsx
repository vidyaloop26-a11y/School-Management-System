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
  TEACHER: "teacher",
  PARENT: "parent",
};

export const ROLE_ROUTES = {
  [ROLES.SUPER_ADMIN]: "/",
  [ROLES.SCHOOL_ADMIN]: "/",
  [ROLES.TEACHER]: "/",
  [ROLES.PARENT]: "/",
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ["schools", "students", "staff", "timetable", "attendance", "dashboard"],
  [ROLES.SCHOOL_ADMIN]: ["students", "staff", "timetable", "attendance", "dashboard"],
  [ROLES.TEACHER]: ["students", "timetable", "attendance", "dashboard"],
  [ROLES.PARENT]: ["timetable", "attendance", "dashboard"],
};