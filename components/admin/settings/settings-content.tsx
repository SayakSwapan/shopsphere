"use client";

import { useEffect, useState } from "react";
import PolicyManager, { Policy } from "./policy-manager";

export default function SettingsContent() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const response = await fetch("/api/admin/policies");
        const result = await response.json();

        if (!result.success) {
          setError(result.message || "Failed to load policies.");
          setLoading(false);
          return;
        }

        setPolicies(result.policies || []);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch policies. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadPolicies();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-8 text-center text-slate-400">
        Loading policy settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-600 bg-[#2c1515] p-8 text-center text-red-300">
        <p className="mb-3 font-semibold">Unable to load settings</p>
        <p>{error}</p>
      </div>
    );
  }

  return <PolicyManager initialPolicies={policies} />;
}
