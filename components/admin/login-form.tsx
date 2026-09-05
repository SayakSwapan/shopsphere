"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, User, Loader2, ShieldCheck, Store, LogIn, ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSiteName } from "@/components/store/site-settings-provider";

type Step = "checking" | "login" | "setup";

function CardShell({ siteName, children }: { siteName: string; children: React.ReactNode }) {
  return (
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl md:grid-cols-[1.05fr_1fr]" style={{ background: "rgba(17,24,39,.92)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(28px)", boxShadow: "0 35px 90px rgba(0,0,0,.55)" }}>
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex" style={{ background: "linear-gradient(165deg, rgba(245,158,11,.12), rgba(245,158,11,.02) 55%, transparent)" }}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,.18), transparent 70%)" }} />
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 10px 30px rgba(245,158,11,.35)" }}>
            <Store size={26} className="text-[#0A0F1E]" strokeWidth={2.2} />
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-white">{siteName}</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Manage products, orders, returns, payments, and your entire store from one powerful dashboard.
          </p>
        </div>
        <div className="relative space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"><ShieldCheck size={15} /></span>
            Secure admin access
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"><KeyRound size={15} /></span>
            Role-based permissions
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"><LogIn size={15} /></span>
            Track every order &amp; refund
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative p-6 sm:p-10">{children}</div>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const siteName = useSiteName();

  const [step, setStep] = useState<Step>("checking");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/bootstrap");
        const data = await res.json();
        if (data.success && !data.hasAdmin) {
          setStep("setup");
        } else {
          setStep("login");
        }
      } catch {
        setStep("login");
      }
    }
    checkAdmin();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleSetup() {
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Setup failed.");
        setLoading(false);
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Setup failed. Please try again.");
      setLoading(false);
    }
  }

  const nameTrimmed = name.trim();
  const emailTrimmed = email.trim();
  const isValid = nameTrimmed.length > 0 && emailTrimmed.length > 0 && password.length >= 8;

  if (step === "checking") {
    return (
      <CardShell siteName={siteName}>
        <div className="flex min-h-[380px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
              <Loader2 size={26} className="animate-spin text-amber-500" />
            </div>
            <p className="text-sm text-slate-400">Checking admin setup...</p>
          </div>
        </div>
      </CardShell>
    );
  }

  if (step === "setup") {
    return (
      <CardShell siteName={siteName}>
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 10px 30px rgba(245,158,11,.35)" }}>
            <ShieldCheck size={26} className="text-[#0A0F1E]" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-white">Create Admin Account</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            No admin account found for {siteName}. Set up your admin credentials to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Full Name</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 transition focus-within:border-amber-500" style={{ height: 52 }}>
              <User size={18} className="text-amber-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                autoComplete="name"
                className="ml-3 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 transition focus-within:border-amber-500" style={{ height: 52 }}>
              <Mail size={18} className="text-amber-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                autoComplete="email"
                className="ml-3 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 transition focus-within:border-amber-500" style={{ height: 52 }}>
              <Lock size={18} className="text-amber-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                className="ml-3 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer text-slate-500 transition hover:text-slate-300">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSetup}
            disabled={loading || !isValid}
            className="flex w-full items-center justify-center gap-2 rounded-xl font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: isValid ? "linear-gradient(135deg, #F59E0B, #F97316)" : "rgba(255,255,255,0.06)",
              color: isValid ? "#111827" : "#3A4455",
              height: 52,
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>
              Create Admin &amp; Login <ArrowRight size={18} />
            </>}
          </button>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell siteName={siteName}>
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 10px 30px rgba(245,158,11,.35)" }}>
          <Store size={26} className="text-[#0A0F1E]" />
        </div>
        <div className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Admin Dashboard</div>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{siteName}</h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to continue</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
          <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 transition focus-within:border-amber-500" style={{ height: 52 }}>
            <Mail size={18} className="text-amber-400" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="email"
              className="ml-3 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 transition focus-within:border-amber-500" style={{ height: 52 }}>
            <Lock size={18} className="text-amber-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="ml-3 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer text-slate-500 transition hover:text-slate-300">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl font-bold transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#111827", height: 52 }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <>
            <LogIn size={18} /> Login
          </>}
        </button>
      </div>
    </CardShell>
  );
}