import React from "react";
import { BellRing } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function NotificationDropdown() {
  return (
    <div data-testid="notification-panel" className="bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-800">Notifications</div>
          <div className="text-[11px] text-slate-500">0 unread</div>
        </div>
      </div>
      <ul className="max-h-[360px] overflow-y-auto thin-scroll">
        <li>
          <EmptyState
            icon={BellRing}
            title="No notifications"
            hint="Notifications will appear here when there are updates."
          />
        </li>
      </ul>
    </div>
  );
}
