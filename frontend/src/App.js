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
import { NAV } from "@/lib/mockData";

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
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:admNo" element={<StudentProfile />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/:staffId" element={<StaffProfile />} />
            <Route path="/timetable" element={<Timetable />} />
            {placeholderRoutes.map((p) => (
              <Route key={p.key} path={p.path} element={<Placeholder title={p.label} icon={p.icon} />} />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
