import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import { useRole } from "@/lib/RoleContext";

export default function TopBar({ onOpenPalette }) {
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/55 backdrop-blur-xl">
      <div className="grid-lines">
        <div className="flex items-center gap-4 h-16 px-6 xl:px-10">
          <button
            data-testid="topbar-search"
            onClick={onOpenPalette}
            className="flex-1 max-w-2xl flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition px-4 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(15,40,60,0.04)]"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-[13px] text-slate-400 flex-1 truncate">Search students, staff, records…</span>
            <span className="text-[10.5px] font-medium text-slate-500 border border-slate-200 rounded-md px-1.5 py-0.5 bg-white">⌘K</span>
          </button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="role-switcher"
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition px-3 py-2 text-[12.5px] text-slate-600"
                >
                  <span className="text-slate-400">Viewing as:</span>
                  <span className="font-medium text-slate-800">{role}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {["Admin","Teacher","Parent"].map((r) => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)} data-testid={`role-option-${r.toLowerCase()}`}>
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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

            <div data-testid="user-avatar" className="h-10 w-10 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-[12px] font-semibold shadow-sm border border-white">
              RD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
