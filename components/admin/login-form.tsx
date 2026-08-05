"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, User, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = "checking" | "login" | "setup";

export default function LoginForm() {
  const router = useRouter();

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
      <div className="relative w-full max-w-md rounded-3xl p-8" style={{ background: "rgba(17,24,39,.90)", border: "1px solid rgba(255,255,255,.08)" }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="relative w-full max-w-md rounded-3xl p-6 sm:p-8" style={{ background: "rgba(17,24,39,.90)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(30px)", boxShadow: "0 25px 60px rgba(0,0,0,.45)" }}>
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mb-4">
            <ShieldCheck size={28} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Create Admin Account</h1>
          <p className="mt-2 text-sm text-slate-400">
            No admin account found. Set up your admin credentials to get started.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 uppercase">Full Name</label>
            <div className="mt-2 flex items-center rounded-xl px-4" style={{ background: "#111827", height: 52 }}>
              <User size={18} color="#F59E0B" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                autoComplete="name"
                className="ml-3 flex-1 bg-transparent outline-none text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Email</label>
            <div className="mt-2 flex items-center rounded-xl px-4" style={{ background: "#111827", height: 52 }}>
              <Mail size={18} color="#F59E0B" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                autoComplete="email"
                className="ml-3 flex-1 bg-transparent outline-none text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Password</label>
            <div className="mt-2 flex items-center rounded-xl px-4" style={{ background: "#111827", height: 52 }}>
              <Lock size={18} color="#F59E0B" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                className="ml-3 flex-1 bg-transparent outline-none text-white"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color="#888" /> : <Eye color="#888" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSetup}
            disabled={loading || !isValid}
            className="w-full rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isValid ? "#F59E0B" : "rgba(255,255,255,0.06)",
              color: isValid ? "#111827" : "#3A4455",
              height: 52,
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Admin & Login"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="relative w-full max-w-md rounded-3xl p-6 sm:p-8" style={{ background: "rgba(17,24,39,.90)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(30px)", boxShadow: "0 25px 60px rgba(0,0,0,.45)" }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "#fff" }}>
            Shop<span style={{ color: "#F59E0B" }}>Sphere</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>Admin Dashboard Login</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 uppercase">Email</label>
            <div className="mt-2 flex items-center rounded-xl px-4" style={{ background: "#111827", height: 52 }}>
              <Mail size={18} color="#F59E0B" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="ml-3 flex-1 bg-transparent outline-none text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase">Password</label>
            <div className="mt-2 flex items-center rounded-xl px-4" style={{ background: "#111827", height: 52 }}>
              <Lock size={18} color="#F59E0B" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ml-3 flex-1 bg-transparent outline-none text-white"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color="#888" /> : <Eye color="#888" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl font-bold transition-all flex items-center justify-center"
            style={{ background: "#F59E0B", color: "#111827", height: 52 }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "LOGIN"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
