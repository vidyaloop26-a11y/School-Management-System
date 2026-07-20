import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import CommandPalette from "@/components/layout/CommandPalette";

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 xl:px-12">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
