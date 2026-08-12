import React from "react";
import { Bell, Search, ChevronDown, Menu, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import { useAuth } from "@/lib/AuthContext";
import DemoBadge from "@/components/common/DemoBadge";

export default function TopBar({ onOpenPalette, onOpenSidebar }) {
  const { user, logout } = useAuth();

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-menu"
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition px-3 py-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-[12px] font-semibold">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11.5px] text-slate-500 capitalize">{user?.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="logout-btn" className="text-rose-600 focus:text-rose-600">
                  <LogOut className="h-4 w-4 mr-2" strokeWidth={2} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}