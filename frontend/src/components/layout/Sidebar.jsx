import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NAV } from "@/lib/mockData";
import { useRole, ROLE_VISIBILITY } from "@/lib/RoleContext";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <div className="relative">
        <div className="h-9 w-9 rounded-xl bg-white border border-[#dbeaf3] shadow-sm grid place-items-center">
          <span className="font-display font-bold text-[#29ABE2] text-lg leading-none">V</span>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#29ABE2] ring-2 ring-white" />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-[17px] text-slate-900 tracking-tight">
          Vidya<span className="text-[#29ABE2]">loop</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">School OS</div>
      </div>
    </div>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      data-testid={`nav-${item.key}`}
      className={({ isActive }) =>
        `nav-item flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-slate-600 ${isActive ? "active font-medium" : ""}`
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function Group({ label, items, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={`sidebar-group-${label.toLowerCase()}`}
        className="w-full flex items-center justify-between px-3 pt-3 pb-1.5 text-[10px] tracking-[0.16em] font-semibold text-slate-400 hover:text-slate-600"
      >
        <span>{label}</span>
        <ChevronRight className={`h-3.5 w-3.5 chev ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 px-2">
          {items.map((it) => <NavItem key={it.key} item={it} />)}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  useLocation();
  const { role } = useRole();
  const allow = (key) => role === "Admin" || ROLE_VISIBILITY[role]?.has(key);
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/60 bg-white/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-slate-100/80">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll py-3">
        <div className="px-2 mb-1">
          {NAV.top.filter((i) => allow(i.key)).map((it) => <NavItem key={it.key} item={it} />)}
        </div>

        {NAV.groups.map((g) => {
          const items = g.items.filter((i) => allow(i.key));
          if (items.length === 0) return null;
          return <Group key={g.label} label={g.label} items={items} />;
        })}

        {NAV.bottom.some((i) => allow(i.key)) && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="px-3 pt-3 pb-1.5 text-[10px] tracking-[0.16em] font-semibold text-slate-400">
              SYSTEM
            </div>
            <div className="flex flex-col gap-0.5 px-2">
              {NAV.bottom.filter((i) => allow(i.key)).map((it) => <NavItem key={it.key} item={it} />)}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100/80">
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#0e7fb1] grid place-items-center text-white text-xs font-semibold">RD</div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-slate-800 truncate">Radhika Deshmukh</div>
            <div className="text-[11px] text-slate-500 truncate">Principal · Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
