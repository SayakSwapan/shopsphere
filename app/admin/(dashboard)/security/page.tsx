import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Webhook,
  Database,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

import RefreshSecurityButton from "@/components/admin/security/refresh-security-button";

export const dynamic = "force-dynamic";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 5;

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function fetchSecuritySnapshot() {
  const now = new Date();

  const [recentAttempts, failed24h, success24h, recentFailures] = await Promise.all([
    prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.loginAttempt.count({
      where: { success: false, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.loginAttempt.count({
      where: { success: true, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.loginAttempt.findMany({
      where: {
        success: false,
        createdAt: { gte: new Date(now.getTime() - LOCKOUT_WINDOW_MS) },
      },
      select: { email: true },
    }),
  ]);

  // Emails currently locked out (>= threshold failures inside the window).
  const failCounts = new Map<string, number>();
  for (const f of recentFailures) {
    failCounts.set(f.email, (failCounts.get(f.email) ?? 0) + 1);
  }
  const lockedEmails = [...failCounts.entries()]
    .filter(([, count]) => count >= LOCKOUT_THRESHOLD)
    .map(([email]) => email);

  return { recentAttempts, failed24h, success24h, lockedEmails };
}

export default async function SecurityPage() {
  const { recentAttempts, failed24h, success24h, lockedEmails } =
    await fetchSecuritySnapshot();

  const jwtSecretOk = !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;
  const webhookSecretOk = !!process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpayKeysOk = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

  const configItems = [
    {
      icon: KeyRound,
      label: "JWT signing secret",
      detail: "Signs admin & customer tokens. Must be a long random string.",
      ok: jwtSecretOk,
      fix: jwtSecretOk ? null : "Set JWT_SECRET in Vercel env (32+ random characters), then redeploy.",
    },
    {
      icon: Webhook,
      label: "Razorpay webhook secret",
      detail: "Server-to-server payment confirmation. Orders still verify via client callback without it.",
      ok: webhookSecretOk,
      fix: webhookSecretOk ? null : "Add RAZORPAY_WEBHOOK_SECRET (same value as in Razorpay dashboard → Webhooks).",
    },
    {
      icon: Database,
      label: "Razorpay API keys",
      detail: "Required for payment creation and signature verification.",
      ok: razorpayKeysOk,
      fix: razorpayKeysOk ? null : "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    },
  ];

  const allConfigOk = configItems.every((c) => c.ok);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-emerald-400" />
            Security
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Login activity, lockouts and security configuration
          </p>
        </div>
        <RefreshSecurityButton />
      </div>

      {/* Posture banner */}
      <div
        className={`rounded-xl border p-4 mb-6 flex items-start gap-3 ${
          allConfigOk
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        }`}
      >
        {allConfigOk ? (
          <ShieldCheck size={20} className="text-emerald-400 mt-0.5" />
        ) : (
          <ShieldAlert size={20} className="text-amber-400 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-semibold ${allConfigOk ? "text-emerald-400" : "text-amber-400"}`}>
            {allConfigOk ? "All security configuration looks good" : "Action needed on configuration"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Admin accounts lock for 15 minutes after 5 failed logins. OTPs are rate-limited and
            expire in 10 minutes. Payments are verified server-side by signature.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Failed logins (24h)</p>
          <p className={`text-2xl font-bold mt-1 ${failed24h > 20 ? "text-red-400" : failed24h > 0 ? "text-amber-400" : "text-white"}`}>
            {failed24h}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Successful logins (24h)</p>
          <p className="text-2xl font-bold text-white mt-1">{success24h}</p>
        </div>
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Locked accounts</p>
          <p className={`text-2xl font-bold mt-1 ${lockedEmails.length > 0 ? "text-red-400" : "text-white"}`}>
            {lockedEmails.length}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Lockout rule</p>
          <p className="text-sm font-semibold text-slate-300 mt-2 flex items-center gap-1.5">
            <Lock size={14} className="text-amber-400" /> 5 fails → 15 min
          </p>
        </div>
      </div>

      {/* Configuration checklist */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E293B]">
          <h2 className="text-sm font-semibold text-white">Configuration</h2>
        </div>
        <div className="divide-y divide-[#1E293B]">
          {configItems.map((item) => (
            <div key={item.label} className="px-4 py-3 flex items-start gap-3">
              {item.ok ? (
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                {!item.ok && item.fix && (
                  <p className="text-xs text-amber-400 mt-1">{item.fix}</p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  item.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                }`}
              >
                {item.ok ? "OK" : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Locked accounts */}
      {lockedEmails.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <Lock size={14} /> Currently locked (auto-unlocks after 15 min of no attempts)
          </h2>
          <ul className="mt-2 space-y-1">
            {lockedEmails.map((email) => (
              <li key={email} className="text-xs text-slate-300 font-mono">{email}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent login attempts */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Recent login attempts</h2>
        </div>
        {recentAttempts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No login attempts recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="px-4 py-2.5 flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    attempt.success ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span className="text-sm text-white font-mono truncate flex-1 min-w-0">
                  {attempt.email}
                </span>
                <span className="text-xs text-slate-500 truncate hidden md:block max-w-[200px]">
                  {attempt.ipAddress ?? "unknown ip"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    attempt.success
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {attempt.success ? "SUCCESS" : "FAILED"}
                </span>
                <span className="text-xs text-slate-500 w-16 text-right flex-shrink-0">
                  {timeAgo(attempt.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
