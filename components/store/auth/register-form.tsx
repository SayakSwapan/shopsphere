"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function RegisterForm() {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      phone: "",
      password: "",
    });

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/auth/register",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                form
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          toast.error(
            data.error
          );

          return;
        }

        toast.success(
          "Account created successfully"
        );

        router.push(
          "/login"
        );
      } catch {
        toast.error(
          "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      <input
        placeholder="Full Name"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name:
              e.target.value,
          })
        }
        className="input"
      />

      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) =>
          setForm({
            ...form,
            email:
              e.target.value,
          })
        }
        className="input"
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) =>
          setForm({
            ...form,
            phone:
              e.target.value,
          })
        }
        className="input"
      />

      <input
        placeholder="Password"
        type="password"
        value={
          form.password
        }
        onChange={(e) =>
          setForm({
            ...form,
            password:
              e.target.value,
          })
        }
        className="input"
      />

      <button
        disabled={loading}
        className="primary-btn w-full py-4 font-bold"
        style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
      >
        {loading
          ? "Creating..."
          : "Create Account"}
      </button>
    </form>
  );
}