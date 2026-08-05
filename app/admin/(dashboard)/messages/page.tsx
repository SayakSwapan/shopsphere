import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import {
  Mail,
  MailOpen,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import MessageReplyButton from "@/components/admin/messages/message-reply-button";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({
      where: { isRead: false },
    }),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">
            Contact Messages
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and respond to customer inquiries and support messages.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "All messages read"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
            <Mail size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-white">
              {messages.length}
            </span>
            <span className="text-xs text-slate-400">
              Total
            </span>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
              <MailOpen
                size={16}
                className="text-amber-400"
              />
              <span className="text-sm font-semibold text-amber-400">
                {unreadCount}
              </span>
              <span className="text-xs text-amber-400/70">
                Unread
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111827] px-8 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <MessageSquare
                size={30}
                className="text-slate-500"
              />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              No Messages Yet
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Contact messages from customers will appear
              here.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border bg-[#111827] overflow-hidden transition-colors ${
                !msg.isRead
                  ? "border-amber-500/20"
                  : "border-white/10"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {!msg.isRead ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      New
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      Read
                    </span>
                  )}
                  {msg.adminReply && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-400">
                      Replied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={12} />
                  {formatDateTime(msg.createdAt)}
                </div>
              </div>

              {/* Message Body */}
              <div className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <User
                      size={18}
                      className="text-slate-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-white">
                        {msg.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {msg.email}
                      </p>
                      {msg.phone && (
                        <p className="text-xs text-slate-500">
                          {msg.phone}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-amber-400 mb-2">
                      {msg.subject}
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Reply (if exists) */}
              {msg.adminReply && (
                <div className="mx-6 mb-5 rounded-xl bg-amber-500/5 border border-amber-500/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20">
                      <Mail
                        size={13}
                        className="text-amber-400"
                      />
                    </div>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Admin Reply
                    </p>
                    {msg.repliedAt && (
                      <p className="text-xs text-slate-500 ml-auto">
                        {formatDateTime(msg.repliedAt)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {msg.adminReply}
                  </p>
                </div>
              )}

              {/* Reply Action */}
              <div className="px-6 py-4 border-t border-white/5">
                <MessageReplyButton
                  messageId={msg.id}
                  hasReply={!!msg.adminReply}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
