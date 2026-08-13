import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth, ROLES } from "@/lib/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import Staff from "@/pages/Staff";
import StaffProfile from "@/pages/StaffProfile";
import Timetable from "@/pages/Timetable";
import Placeholder from "@/pages/Placeholder";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import Attendance from "@/pages/Attendance";
import DigitalDiary from "@/pages/DigitalDiary";
import Homework from "@/pages/Homework";
import Fees from "@/pages/Fees";
import Communication from "@/pages/Communication";
import Admissions from "@/pages/Admissions";
import Examination from "@/pages/Examination";
import IDCard from "@/pages/IDCard";
import Events from "@/pages/Events";
import Login from "@/pages/Login";
import { NAV } from "@/lib/mockData";
import { PLACEHOLDER_DESCRIPTIONS } from "@/lib/stage3Data";
import { Toaster } from "@/components/ui/sonner";

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === ROLES.TEACHER) return <TeacherDashboard />;
  if (user.role === ROLES.PARENT) return <ParentDashboard />;
  return <Dashboard />;
}

function AppRoutes() {
  const placeholderRoutes = [];
  const collect = (item) => {
    if (!item.functional) placeholderRoutes.push(item);
  };
  NAV.top.forEach(collect);
  NAV.groups.forEach((g) => g.items.forEach(collect));
  NAV.bottom.forEach(collect);

  return (
    <Routes>
      <Route
        element={
          <PublicRoute>
            <Outlet />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:id" element={<StaffProfile />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/diary" element={<DigitalDiary />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/examination" element={<Examination />} />
        <Route path="/id-card" element={<IDCard />} />
        <Route path="/events" element={<Events />} />
        {placeholderRoutes.map((p) => (
          <Route
            key={p.key}
            path={p.path}
            element={<Placeholder title={p.label} icon={p.icon} description={PLACEHOLDER_DESCRIPTIONS[p.key]} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <Toaster
        position="top-right"
        offset={16}
        toastOptions={{
          classNames: {
            toast: "!bg-white/85 !backdrop-blur-xl !border !border-white/80 !text-slate-800 !rounded-2xl !shadow-[0_10px_30px_-12px_rgba(20,60,100,0.18)]",
            description: "!text-slate-500",
          },
        }}
      />
    </div>
  );
}

export default App;