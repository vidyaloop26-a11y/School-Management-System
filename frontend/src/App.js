import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { RoleProvider, useRole } from "@/lib/RoleContext";
import { NAV } from "@/lib/mockData";
import { PLACEHOLDER_DESCRIPTIONS } from "@/lib/stage3Data";
import { Toaster } from "@/components/ui/sonner";

function DashboardRouter() {
  const { role } = useRole();
  if (role === "Teacher") return <TeacherDashboard />;
  if (role === "Parent")  return <ParentDashboard />;
  return <Dashboard />;
}

function App() {
  // Build placeholder routes for all non-functional entries
  const placeholderRoutes = [];
  const collect = (item) => {
    if (!item.functional) placeholderRoutes.push(item);
  };
  NAV.top.forEach(collect);
  NAV.groups.forEach((g) => g.items.forEach(collect));
  NAV.bottom.forEach(collect);

  return (
    <div className="App">
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:admNo" element={<StudentProfile />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:staffId" element={<StaffProfile />} />
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
                <Route key={p.key} path={p.path} element={<Placeholder title={p.label} icon={p.icon} description={PLACEHOLDER_DESCRIPTIONS[p.key]} />} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
      </RoleProvider>
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
