import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CheckCheck, ArrowUpRight } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import api from "@/lib/api";

const timeAgo = (d) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export function useNotifications(limit = 25, enabled = true) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await api.getNotifications({ limit });
      const list = res?.notifications || [];
      setItems(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch {
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markRead = useCallback(
    async (id) => {
      try {
        await api.markNotificationRead(id);
      } catch {
        /* ignore */
      }
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
    } catch {
      /* ignore */
    }
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  return { items, unread, loading, markRead, markAllRead, refresh: fetchNotifications };
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { items, unread, markRead, markAllRead } = useNotifications(25, true);

  const handleOpen = (n) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div data-testid="notification-panel" className="bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-800">Notifications</div>
          <div className="text-[11px] text-slate-500">
            {unread} unread
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-[11.5px] font-semibold text-[#0c6a99] hover:text-[#29ABE2] inline-flex items-center gap-1 transition"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>
      <ul className="max-h-[360px] overflow-y-auto thin-scroll">
        {items.length === 0 ? (
          <li>
            <EmptyState
              icon={BellRing}
              title="No notifications"
              hint="Visitor check-ins, approvals and pickups will appear here."
            />
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleOpen(n)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition flex items-start gap-3 ${n.read ? "" : "bg-[#f0f9ff]"}`}
              >
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-slate-200" : "bg-[#29ABE2]"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold text-slate-800 leading-snug">{n.title}</span>
                  {n.body && <span className="block text-[11.5px] text-slate-500 mt-0.5 leading-snug">{n.body}</span>}
                  <span className="block text-[10.5px] text-slate-400 mt-1">
                    {timeAgo(n.createdAt)}
                    {n.actorName ? ` · ${n.actorName}` : ""}
                  </span>
                </span>
                {n.link && <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />}
              </button>
            </li>
          ))
        )}
      </ul>
      {items.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 text-center">
          <button
            onClick={() => navigate("/front-office")}
            className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-700 transition inline-flex items-center gap-1"
          >
            <Bell className="h-3.5 w-3.5" />
            Open Front Office
          </button>
        </div>
      )}
    </div>
  );
}