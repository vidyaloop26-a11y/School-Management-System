import React from "react";
import { UserPlus, Wallet, PlaneTakeoff, BellRing, CalendarDays } from "lucide-react";
import { NOTIFICATIONS } from "@/lib/mockData";
import EmptyState from "@/components/common/EmptyState";

const KIND_ICON = {
  admission: UserPlus,
  fee: Wallet,
  leave: PlaneTakeoff,
  reminder: BellRing,
  event: CalendarDays,
};

export default function NotificationDropdown() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <div data-testid="notification-panel" className="bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-800">Notifications</div>
          <div className="text-[11px] text-slate-500">{unread} unread</div>
        </div>
        <span className="text-[10px] tracking-widest font-semibold text-[#0c6a99] bg-[#e6f4fb] px-2 py-0.5 rounded-full">LIVE</span>
      </div>
      <ul className="max-h-[360px] overflow-y-auto thin-scroll">
        {NOTIFICATIONS.length === 0 && (
          <li>
            <EmptyState
              icon={BellRing}
              title="You&rsquo;re all caught up"
              hint="No unread notifications right now."
            />
          </li>
        )}
        {NOTIFICATIONS.map((n) => {
          const Icon = KIND_ICON[n.kind] || BellRing;
          return (
            <li
              key={n.id}
              data-testid={`notification-item-${n.id}`}
              className="px-4 py-3 flex items-start gap-3 border-b border-slate-50 hover:bg-slate-50/60 transition"
            >
              <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${n.unread ? "bg-[#e6f4fb] text-[#0c6a99]" : "bg-slate-100 text-slate-500"}`}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-slate-800 leading-snug">{n.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{n.time}</div>
              </div>
              {n.unread && <span className="h-2 w-2 rounded-full bg-[#29ABE2] mt-2 shrink-0" />}
            </li>
          );
        })}
      </ul>
      <div className="px-4 py-2.5 text-center border-t border-slate-100">
        <button className="text-[12px] font-medium text-[#0c6a99] hover:underline">View all notifications</button>
      </div>
    </div>
  );
}
