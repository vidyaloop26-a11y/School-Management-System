import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth, ROLES } from "@/lib/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import ChangePasswordGate from "@/components/auth/ChangePasswordGate";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import Staff from "@/pages/Staff";
import StaffProfile from "@/pages/StaffProfile";
import Timetable from "@/pages/Timetable";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import Attendance from "@/pages/Attendance";
import DigitalDiary from "@/pages/DigitalDiary";
import Homework from "@/pages/Homework";
import Fees from "@/pages/Fees";
import Communication from "@/pages/Communication";
import Admissions from "@/pages/Admissions";
import Examination from "@/pages/Examination";
import Payroll from "@/pages/Payroll";
import IncomeExpense from "@/pages/IncomeExpense";
import Certificates from "@/pages/Certificates";
import Leave from "@/pages/Leave";
import IDCard from "@/pages/IDCard";
import Events from "@/pages/Events";
import Login from "@/pages/Login";
import Schools from "@/pages/Schools";
import Support from "@/pages/Support";
import Settings from "@/pages/Settings";
import Tasks from "@/pages/Tasks";
import Syllabus from "@/pages/Syllabus";
import Gallery from "@/pages/Gallery";
import Library from "@/pages/Library";
import Transport from "@/pages/Transport";
import FrontOffice from "@/pages/FrontOffice";
import Inventory from "@/pages/Inventory";
import Hostel from "@/pages/Hostel";
import CopyChecking from "@/pages/CopyChecking";
import { DataStoreProvider } from "@/lib/dataStore";
import { Toaster } from "@/components/ui/sonner";

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === ROLES.PARENT) return <ParentDashboard />;
  if (user.role === ROLES.STAFF) return <TeacherDashboard />;
  return <Dashboard />;
}

function AppRoutes() {
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
            <ChangePasswordGate>
              <Layout />
            </ChangePasswordGate>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardRouter />} />
        <Route
          path="/schools"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <Schools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route path="/staff/:id" element={<StaffProfile />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route
          path="/fees"
          element={
            <ProtectedRoute allowedDuties={["accountant"]}>
              <Fees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <IncomeExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admissions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <Admissions />
            </ProtectedRoute>
          }
        />
        <Route path="/diary" element={<DigitalDiary />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/examination" element={<Examination />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/id-card" element={<IDCard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/library" element={<Library />} />
        <Route
          path="/transport"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <Transport />
            </ProtectedRoute>
          }
        />
        <Route path="/front-office" element={<FrontOffice />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN]}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route path="/hostel" element={<Hostel />} />
        <Route path="/copy-checking" element={<CopyChecking />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <DataStoreProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataStoreProvider>
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