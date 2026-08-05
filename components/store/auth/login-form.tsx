"use client";

import { useState } from "react";

import { toast } from "sonner";

export default function LoginForm() {
  const [loading, setLoading] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email,
                password,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          toast.error(
            data.error ||
              "Login failed"
          );

          return;
        }

        toast.success(
          "Login successful"
        );

        window.location.href =
          data.redirectTo;
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
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(
            e.target.value
          )
        }
        className="input"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
        className="input"
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-btn w-full py-4 font-bold"
        style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
      >
        {loading
          ? "Signing In..."
          : "Login"}
      </button>
    </form>
  );
}