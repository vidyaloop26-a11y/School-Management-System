import React, { createContext, useContext, useState, useEffect } from "react";

const RoleContext = createContext({
  user: null,
  role: "Admin",
  setRole: () => {},
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

const DEFAULT_USER = {
  name: "Rajesh Director",
  email: "admin@vidyaloop.in",
  role: "Admin",
  schoolName: "Vidyaloop Public School",
};

// Session expires after 24 hours (in milliseconds)
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export function RoleProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vidyaloop_user");
      const loginTime = localStorage.getItem("vidyaloop_login_time");

      if (savedUser && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed > SESSION_EXPIRATION_MS) {
          // 24-hour session expired: clear state
          localStorage.removeItem("vidyaloop_user");
          localStorage.removeItem("vidyaloop_token");
          localStorage.removeItem("vidyaloop_login_time");
          return null;
        }
        return JSON.parse(savedUser);
      }
      return savedUser ? JSON.parse(savedUser) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("vidyaloop_token") || null;
  });

  // Check 24-hour session expiration periodically
  useEffect(() => {
    const checkExpiration = () => {
      const loginTime = localStorage.getItem("vidyaloop_login_time");
      if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed > SESSION_EXPIRATION_MS) {
          logoutUser();
        }
      }
    };
    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const role = user?.role || "Admin";

  const setRole = (newRole) => {
    setUser((prev) => {
      const updated = { ...(prev || DEFAULT_USER), role: newRole };
      localStorage.setItem("vidyaloop_user", JSON.stringify(updated));
      return updated;
    });
  };

  const loginUser = (userData, userToken) => {
    // Preserve superAdmin role distinctly from schoolAdmin (Admin)
    const normalizedRole =
      userData.role === "superAdmin"
        ? "superAdmin"
        : userData.role === "schoolAdmin" || userData.role === "Admin"
        ? "Admin"
        : userData.role === "teacher"
        ? "Teacher"
        : userData.role === "parent"
        ? "Parent"
        : userData.role || "Admin";

    const formattedUser = {
      ...userData,
      role: normalizedRole,
    };

    const now = Date.now();
    setUser(formattedUser);
    setToken(userToken || "demo-token");

    localStorage.setItem("vidyaloop_user", JSON.stringify(formattedUser));
    localStorage.setItem("vidyaloop_token", userToken || "demo-token");
    localStorage.setItem("vidyaloop_login_time", now.toString());
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vidyaloop_user");
    localStorage.removeItem("vidyaloop_token");
    localStorage.removeItem("vidyaloop_login_time");
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        setRole,
        login: loginUser,
        logout: logoutUser,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);

// Per-role sidebar visibility (Admin sees everything except superAdmin-only tabs).
export const ROLE_VISIBILITY = {
  Teacher: new Set([
    "dashboard", "students", "timetable", "attendance",
    "diary", "homework", "communication", "examination", "settings",
  ]),
  Parent: new Set([
    "dashboard", "timetable", "attendance", "diary",
    "homework", "fees", "communication", "settings",
  ]),
};
