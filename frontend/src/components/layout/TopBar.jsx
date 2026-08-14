import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu, LogOut, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import { useRole } from "@/lib/RoleContext";
import DemoBadge from "@/components/common/DemoBadge";
import { toast } from "@/components/ui/sonner";

export default function TopBar({ onOpenPalette, onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, role, logout } = useRole();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "VD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/55 backdrop-blur-xl">
      <div className="grid-lines">
        <div className="flex items-center gap-3 md:gap-4 h-16 px-4 md:px-6 xl:px-10">
          <button
            data-testid="mobile-menu-btn"
            onClick={onOpenSidebar}
            aria-label="Open menu"
            className="md:hidden h-10 w-10 grid place-items-center rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition shrink-0"
          >
            <Menu className="h-5 w-5 text-slate-600" strokeWidth={1.8} />
          </button>
          <button
            data-testid="mobile-search-btn"
            onClick={onOpenPalette}
            aria-label="Search"
            className="md:hidden h-10 w-10 grid place-items-center rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition shrink-0"
          >
            <Search className="h-4 w-4 text-slate-500" />
          </button>
          <button
            data-testid="topbar-search"
            onClick={onOpenPalette}
            className="hidden md:flex flex-1 max-w-2xl items-center gap-3 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition px-4 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(15,40,60,0.04)]"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-[13px] text-slate-400 flex-1 truncate">Search students, staff, records…</span>
            <span className="text-[10.5px] font-medium text-slate-500 border border-slate-200 rounded-md px-1.5 py-0.5 bg-white">⌘K</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <DemoBadge className="hidden lg:inline-flex" />



            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  data-testid="notification-bell"
                  className="relative h-10 w-10 grid place-items-center rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition"
                >
                  <Bell className="h-4.5 w-4.5 text-slate-600" strokeWidth={1.8} />
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold grid place-items-center">3</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={12} className="w-[360px] p-0 rounded-2xl overflow-hidden border-slate-200/70 shadow-xl">
                <NotificationDropdown />
              </PopoverContent>
            </Popover>

            {/* User Profile & Logout Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-avatar-btn"
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-[12px] font-semibold shadow-sm border border-white cursor-pointer hover:scale-105 transition"
                >
                  {getInitials(user?.name)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-200">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="font-semibold text-slate-800 text-sm truncate">{user?.name || "User"}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || "user@vidyaloop.in"}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                    {role}
                  </span>
                </div>

                <DropdownMenuItem onClick={() => navigate("/login")} className="rounded-xl text-xs py-2 text-slate-700 cursor-pointer">
                  <User className="h-4 w-4 mr-2 text-slate-500" /> Switch Account
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl text-xs py-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
