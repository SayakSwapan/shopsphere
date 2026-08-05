"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, Lock, Check, RotateCcw, RefreshCw } from "lucide-react";

export interface AdminMessageItem {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
}

interface Props {
  queryId: string;
  initialMessages: AdminMessageItem[];
  initialStatus: string;
  onStatusChange?: (status: string) => void;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function fetchQuery(queryId: string) {
  const res = await fetch(`/api/admin/product-queries/${queryId}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to load");
  return data.data;
}

export default function QueryConversation({
  queryId,
  initialMessages,
  initialStatus,
  onStatusChange,
}: Props) {
  const [messages, setMessages] = useState<AdminMessageItem[]>(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    const data = await fetchQuery(queryId);
    setMessages(
      data.messages.map((m: { id: string; sender: string; message: string; createdAt: string }) => ({
        id: m.id,
        sender: m.sender,
        message: m.message,
        createdAt: m.createdAt,
      }))
    );
    setStatus(data.status);
  }

  async function sendReply() {
    if (sending) return;
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/product-queries/${queryId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to send");

      setReplyText("");
      await refresh();
      onStatusChange?.("OPEN");
      toast.success("Reply sent to customer");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(next: string) {
    setUpdating(next);
    try {
      const res = await fetch(`/api/admin/product-queries/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed");

      await refresh();
      onStatusChange?.(next);
      toast.success(
        next === "RESOLVED"
          ? "Marked as resolved"
          : next === "CLOSED"
          ? "Conversation closed"
          : "Conversation reopened"
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Conversation refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-white">Conversation</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Thread */}
      <div className="max-h-[480px] space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No messages in this conversation yet.
          </p>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender === "ADMIN";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isAdmin
                      ? "rounded-tr-sm bg-amber-500/15 border border-amber-500/20 text-amber-50"
                      : "rounded-tl-sm bg-white/5 border border-white/10 text-slate-200"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-500">
                  {isAdmin ? "You (Store)" : "Customer"} · {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      <div className="border-t border-slate-700 px-6 py-4">
        {status !== "CLOSED" ? (
          <div className="flex items-end gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              placeholder="Write a reply to the customer..."
              className="flex-1 resize-none rounded-xl border border-slate-600 bg-[#0F172A] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-xs text-slate-400">
            <Lock size={13} />
            This conversation is closed. Reopen it to reply again.
          </div>
        )}

        {/* Status actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-3">
          {status !== "RESOLVED" && status !== "CLOSED" && (
            <button
              onClick={() => changeStatus("RESOLVED")}
              disabled={updating !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-400 transition hover:bg-blue-500/25 disabled:opacity-50"
            >
              {updating === "RESOLVED" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Mark Resolved
            </button>
          )}
          {status !== "CLOSED" ? (
            <button
              onClick={() => changeStatus("CLOSED")}
              disabled={updating !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {updating === "CLOSED" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              Close Conversation
            </button>
          ) : (
            <button
              onClick={() => changeStatus("OPEN")}
              disabled={updating !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-green-500/15 px-3 py-2 text-xs font-bold text-green-400 transition hover:bg-green-500/25 disabled:opacity-50"
            >
              {updating === "OPEN" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
