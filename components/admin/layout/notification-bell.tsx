"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, RotateCcw, RefreshCw, X, MessageCircle, Mail, PhoneCall, Share } from "lucide-react";

interface NotificationItem {
  id: string;
  notificationId: string;
  title: string;
  message: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string, entityType: string | null) {
  switch (entityType) {
    case "PRODUCT_QUERY":
      return <MessageCircle size={14} className="text-amber-400" />;
    case "CONTACT_MESSAGE":
      return <Mail size={14} className="text-blue-400" />;
    case "CALLBACK_REQUEST":
      return <PhoneCall size={14} className="text-emerald-400" />;
  }
  switch (type) {
    case "ORDER":
      return <ShoppingBag size={14} className="text-amber-400" />;
    case "RETURN":
      return <RotateCcw size={14} className="text-red-400" />;
    case "REPLACEMENT":
      return <RefreshCw size={14} className="text-blue-400" />;
    case "PAYMENT":
      return <ShoppingBag size={14} className="text-green-400" />;
    default:
      return <Bell size={14} className="text-slate-400" />;
  }
}

function getNotificationLink(item: NotificationItem): string | null {
  if (!item.entityType || !item.entityId) return null;
  switch (item.entityType) {
    case "ORDER":
      return `/admin/orders/${item.entityId}`;
    case "RETURN":
      return `/admin/returns/${item.entityId}`;
    case "REPLACEMENT":
      return `/admin/replacements/${item.entityId}`;
    case "PRODUCT_QUERY":
      return `/admin/product-queries/${item.entityId}`;
    case "CONTACT_MESSAGE":
      return `/admin/messages`;
    case "CALLBACK_REQUEST":
      return `/admin/callbacks`;
    default:
      return null;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

let notifAudio: HTMLAudioElement | null = null;
function playNotifSound() {
  try {
    if (!notifAudio) {
      notifAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoKIeGBAO2aQp6+AXTo3ZYaJh3NZQDxpkKqyhmA7OGaGh4dwWkE+a5Wst4VgOzhlhIaEcFpCPm2Zr7iCXTo2ZIOEgnBbRD9vm7K6hF06N2OCgYBwXEc/cZy0vIVdOjdjgX9+cF1JP3OetL2GXTk2Yn99e29eS0B2oLe/h105NWJ+e3puX01BeaK5wYhdODRhe3l4bV9OQnqkusOJXTczX3l2dWxgUEJ7pbnFil02MV52c3JrYVFDfaa8x4tdNC9ccnFwaGJVRYCpvcqOXTMtWW9ubWVYV0eCq77MkF0xK1Zra2hjWVhJha7BzpJdLylSa2diXlxaS4exw9GUXTAnUGZkX2FiX02JtcXTll4tJU1hYGBhYF9LjLjI1ZheKiJJXl5gYF9eSo26ytiaXyoiRFpbXl5eXUiPvczbnmAoIEBXWltdXVxGkcDP3aBhJh0=",
      );
      notifAudio.volume = 0.5;
    }
    notifAudio.currentTime = 0;
    notifAudio.play().catch(() => {});
  } catch {}
}

function requestBrowserNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico", tag: "admin-notif" });
    } catch {}
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) {
        const newCount = data.unreadCount as number;
        setItems(data.items);
        if (newCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
          playNotifSound();
          const newest = data.items.find((i: NotificationItem) => !i.isRead);
          if (newest) showBrowserNotification(newest.title, newest.message);
        }
        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch {}
  }, []);

  useEffect(() => {
    requestBrowserNotificationPermission();
    const id = requestAnimationFrame(() => fetchNotifications());
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, 15000);
    const onVis = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(id);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    } catch {}
  }

  async function markRead(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
      );
    } catch {}
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-3 rounded-xl transition-colors hover:bg-white/5"
        style={{ background: open ? "rgba(255,255,255,0.08)" : "#111827" }}
      >
        <Bell color="white" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-96 max-h-[28rem] overflow-hidden rounded-2xl border border-white/10 shadow-2xl z-50"
          style={{ background: "#111827" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[22rem]">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              items.map((item) => {
                const link = getNotificationLink(item);
                const content = (
                  <div
                    className={`flex gap-3 px-5 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.03] ${
                      !item.isRead ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                      {getNotificationIcon(item.type, item.entityType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs leading-tight ${!item.isRead ? "font-bold text-white" : "font-medium text-slate-300"}`}>
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Forward to WhatsApp"
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = `*${item.title}*\n\n${item.message}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                      className="mt-1 shrink-0 p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Share size={12} />
                    </button>
                  </div>
                );

                return link ? (
                  <Link
                    key={item.id}
                    href={link}
                    onClick={() => {
                      if (!item.isRead) markRead(item.id);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left cursor-pointer"
                    onClick={() => {
                      if (!item.isRead) markRead(item.id);
                    }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-white/10 px-5 py-2.5">
              <button
                onClick={fetchNotifications}
                className="w-full text-center text-[11px] font-bold text-amber-400 hover:text-amber-300"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
