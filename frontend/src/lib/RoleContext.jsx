import React, { createContext, useContext, useState } from "react";

const RoleContext = createContext({ role: "Admin", setRole: () => {} });

export function RoleProvider({ children }) {
  const [role, setRole] = useState("Admin");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);

// Per-role sidebar visibility (Admin sees everything; Teacher/Parent are focused sets).
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
