"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Send,
  Check,
  RotateCcw,
  Lock,
  Loader2,
  ChevronDown,
} from "lucide-react";

export interface HelpQueryItem {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; slug: string; productimage: { url: string }[] } | null;
  messages: {
    id: string;
    sender: string;
    message: string;
    createdAt: string;
  }[];
}

interface Props {
  orderId: string;
  initialQueries: HelpQueryItem[];
  items: { productId: string; productName: string; productImage: string }[];
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusPill(status: string) {
  const styles: Record<string, { label: string; className: string }> = {
    OPEN: { label: "Open", className: "text-emerald-600" },
    RESOLVED: { label: "Resolved", className: "text-blue-600" },
    CLOSED: { label: "Closed", className: "text-slate-500" },
  };
  const cfg = styles[status] ?? styles.OPEN;
  return (
    <span className={`od-pill ${cfg.className}`}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      {cfg.label}
    </span>
  );
}

export default function OrderProductHelp({ orderId, initialQueries, items }: Props) {
  const [queries, setQueries] = useState<HelpQueryItem[]>(initialQueries);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(queries.length === 0);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // new query form state
  const [productId, setProductId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // reply input per open query
  const [replyText, setReplyText] = useState("");

  async function createQuery(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (subject.trim().length < 3) {
      toast.error("Please enter a short subject");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Please describe your question");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/account/product-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          productId: productId || null,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to send");
      }

      toast.success("Your question has been sent");
      setSubject("");
      setMessage("");
      setProductId("");
      setShowForm(false);

      const refreshed = await fetch(`/api/account/product-queries?orderId=${orderId}`);
      const refreshedData = await refreshed.json();
      if (refreshedData.success) {
        setQueries(refreshedData.data);
        setOpenId(refreshedData.data[0]?.id ?? null);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(queryId: string) {
    if (sending) return;
    if (!replyText.trim()) return;

    setSending(queryId);
    try {
      const response = await fetch(
        `/api/account/product-queries/${queryId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyText.trim() }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to send");
      }

      setReplyText("");
      const refreshed = await fetch(`/api/account/product-queries?orderId=${orderId}`);
      const refreshedData = await refreshed.json();
      if (refreshedData.success) {
        setQueries(refreshedData.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setSending(null);
    }
  }

  async function changeStatus(queryId: string, status: string) {
    try {
      const response = await fetch(`/api/account/product-queries/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Update failed");
      }

      toast.success(
        status === "CLOSED"
          ? "Conversation closed"
          : status === "RESOLVED"
          ? "Marked as resolved"
          : "Reopened"
      );

      const refreshed = await fetch(`/api/account/product-queries?orderId=${orderId}`);
      const refreshedData = await refreshed.json();
      if (refreshedData.success) {
        setQueries(refreshedData.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="od-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={18} className="text-primary" />
          <div>
            <h2 className="od-title-bar text-base sm:text-lg font-bold text-text-heading">
              Product Help
            </h2>
            <p className="mt-1 text-xs text-text-muted-2">
              Ask questions about your purchased products
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="od-btn-ghost px-3 py-2 text-xs"
          >
            <Plus size={14} />
            New Question
          </button>
        )}
      </div>

      {/* New query form */}
      {showForm && (
        <form
          onSubmit={createQuery}
          className="border-b border-border-subtle bg-bg-card-nested px-4 sm:px-6 py-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-text-heading">Ask a New Question</p>
            {queries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-text-muted-2 hover:text-primary"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-11 rounded-input border border-border-card bg-bg-card px-3 text-sm text-text-body outline-none focus:border-primary"
            >
              <option value="">About which product?</option>
              {items.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.productName}
                </option>
              ))}
            </select>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (e.g. Size query)"
              className="h-11 rounded-input border border-border-card bg-bg-card px-3 text-sm text-text-body outline-none focus:border-primary"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question in detail..."
            rows={3}
            className="mt-3 w-full rounded-input border border-border-card bg-bg-card px-3 py-2.5 text-sm text-text-body outline-none focus:border-primary resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="od-btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Question
            </button>
          </div>
        </form>
      )}

      {/* Queries list */}
      <div className="divide-y divide-border-subtle">
        {queries.length === 0 && !showForm && (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bg-card-nested">
              <MessageCircle size={24} className="text-text-muted-3" />
            </div>
            <p className="mt-4 text-sm font-bold text-text-heading">No questions yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-text-muted-2">
              Facing an issue or have a query about a product in this order? Start a
              conversation and our team will help you out.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="od-btn-primary mt-5 px-5 py-2.5 text-sm"
            >
              <Plus size={16} />
              Ask a Question
            </button>
          </div>
        )}

        {queries.map((query) => {
          const isOpen = openId === query.id;
          return (
            <div key={query.id} className="px-4 sm:px-6 py-4">
              <button
                onClick={() => setOpenId(isOpen ? null : query.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-text-heading">
                      {query.subject}
                    </h3>
                    {statusPill(query.status)}
                  </div>
                  <p className="mt-1 text-xs text-text-muted-2">
                    {query.product?.name ?? "General question"} · {query.messages.length}{" "}
                    message{query.messages.length !== 1 ? "s" : ""} ·{" "}
                    {formatTime(query.createdAt)}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`mt-1 flex-shrink-0 text-text-muted-3 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-4">
                  {/* Conversation thread */}
                  <div className="od-chat max-h-80 space-y-3 overflow-y-auto p-4">
                    {query.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "ADMIN"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`od-msg ${
                            msg.sender === "ADMIN"
                              ? "od-msg-admin"
                              : "od-msg-customer"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="mt-1 px-1 text-[10px] text-text-muted-3">
                          {msg.sender === "ADMIN" ? "Store" : "You"} ·{" "}
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reply input */}
                  {query.status !== "CLOSED" ? (
                    <div className="mt-3 flex items-end gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Write a reply..."
                        className="flex-1 resize-none rounded-input border border-border-card bg-bg-card px-3 py-2.5 text-sm text-text-body outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => sendReply(query.id)}
                        disabled={sending === query.id || !replyText.trim()}
                        className="od-btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
                      >
                        {sending === query.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Send
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-input bg-bg-card-nested px-4 py-3 text-xs text-text-muted-2">
                      <Lock size={13} />
                      This conversation is closed.
                    </div>
                  )}

                  {/* Status actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {query.status !== "RESOLVED" && query.status !== "CLOSED" && (
                      <button
                        onClick={() => changeStatus(query.id, "RESOLVED")}
                        className="od-btn-ghost px-3 py-2 text-xs"
                      >
                        <Check size={14} />
                        Mark Resolved
                      </button>
                    )}
                    {query.status !== "CLOSED" ? (
                      <button
                        onClick={() => changeStatus(query.id, "CLOSED")}
                        className="od-btn-ghost px-3 py-2 text-xs"
                      >
                        <Lock size={14} />
                        Close
                      </button>
                    ) : (
                      <button
                        onClick={() => changeStatus(query.id, "OPEN")}
                        className="od-btn-ghost px-3 py-2 text-xs"
                      >
                        <RotateCcw size={14} />
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
