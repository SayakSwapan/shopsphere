"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Reply,
  Send,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Props {
  messageId: string;
  hasReply: boolean;
}

export default function MessageReplyButton({
  messageId,
  hasReply,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(hasReply);

  async function handleSend() {
    if (reply.trim().length < 5) {
      toast.error("Reply must be at least 5 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reply: reply.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to send reply");
        return;
      }

      toast.success("Reply sent via email");
      setSent(true);
      setReply("");
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
      >
        <Reply size={15} />
        {sent ? "Send Another Reply" : "Reply"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
        <Send size={13} />
        Reply to customer (sent via email)
      </div>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        placeholder="Type your reply to the customer..."
        className="w-full rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 transition-colors resize-none"
        autoFocus
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={loading || reply.trim().length < 5}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {loading ? "Sending..." : "Send Reply"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setReply("");
          }}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
        {sent && (
          <span className="flex items-center gap-1.5 text-xs text-green-400 ml-auto">
            <CheckCircle size={13} />
            Previously replied
          </span>
        )}
      </div>
    </div>
  );
}
