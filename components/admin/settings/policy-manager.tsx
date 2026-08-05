"use client";

import { useMemo, useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/admin/ui/rich-text-editor"), { ssr: false });

export interface Policy {
  id: string;
  title: string;
  slug: string;
  type: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

const POLICY_TYPES = [
  "Return",
  "Exchange",
  "Shipping",
  "Warranty",
  "General",
];

interface Props {
  initialPolicies: Policy[];
}

export default function PolicyManager({
  initialPolicies,
}: Props) {
  const [policies, setPolicies] = useState<Policy[]>(
    initialPolicies
  );
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(
    null
  );
  const [formState, setFormState] = useState({
    title: "",
    type: "Return",
    content: "",
    isActive: true,
  });

  const slugPreview = useMemo(() => {
    if (!formState.title) return "auto-generated from title";
    return slugify(formState.title, {
      lower: true,
      strict: true,
    });
  }, [formState.title]);

  const formTitle = useMemo(() => {
    return selectedPolicy ? "Edit Policy" : "Add Policy";
  }, [selectedPolicy]);

  function resetForm() {
    setSelectedPolicy(null);
    setFormState({
      title: "",
      type: "Return",
      content: "",
      isActive: true,
    });
  }

  function editPolicy(policy: Policy) {
    setSelectedPolicy(policy);
    setFormState({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      isActive: policy.isActive,
    });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    // Mandatory-field guards surfaced as warning toasts before hitting the API.
    if (!formState.title.trim()) {
      toast.error("Policy title is required.");
      return;
    }

    if (!formState.content.trim()) {
      toast.error("Policy content is required.");
      return;
    }

    setIsSaving(true);

    const slug = slugify(formState.title, {
      lower: true,
      strict: true,
    });

    const payload = {
      title: formState.title,
      slug,
      type: formState.type,
      content: formState.content,
      isActive: formState.isActive,
    };

    const url = selectedPolicy
      ? `/api/admin/policies/${selectedPolicy.id}`
      : "/api/admin/policies";
    const method = selectedPolicy ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.message || "Failed to save policy.");
      return;
    }

    if (selectedPolicy) {
      setPolicies((current) =>
        current.map((policy) =>
          policy.id === selectedPolicy.id
            ? result.policy
            : policy
        )
      );
      toast.success("Policy updated");
    } else {
      setPolicies((current) => [result.policy, ...current]);
      toast.success("Policy created");
    }

    resetForm();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this policy?"
    );
    if (!confirmed) return;

    const response = await fetch(
      `/api/admin/policies/${id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message || "Failed to delete policy.");
      return;
    }

    setPolicies((current) =>
      current.filter((policy) => policy.id !== id)
    );
    toast.success("Policy deleted");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
              Policy Manager
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              {formTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-slate-400 leading-relaxed">
              Add or update the terms, returns, shipping, warranty, and general business policies that customers will see on the public Terms & Conditions page.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Policy Title
                </label>
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Example: Return Policy"
                  className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Slug preview: <span className="text-slate-200">{slugPreview}</span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Policy Type
                </label>
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
                >
                  {POLICY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Policy Content
              </label>
              <RichTextEditor
                value={formState.content}
                onChange={(val) =>
                  setFormState((prev) => ({ ...prev, content: val }))
                }
                placeholder="Write your policy content here. Customers will see this on the Terms & Conditions page."
                minHeight={250}
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-amber-500"
              />
              <span className="text-slate-300">
                Make this policy active for customers
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                {selectedPolicy ? "Update Policy" : "Add Policy"}
              </button>
              {selectedPolicy && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-300 transition hover:bg-slate-900"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
                Tips for terms visibility
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                Public terms & customer trust
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Active policies are exposed on the public Terms & Conditions page. Make sure each policy is clear, short, and focused on customer expectations.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-[#0B1624] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Quick checklist
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>• Title the policy clearly.</li>
                <li>• Keep the description customer-friendly.</li>
                <li>• Enable only policies you want shown.</li>
                <li>• Use the public /terms page to verify the output.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">
            Business Policies
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policies..."
                className="h-9 w-56 rounded-lg border border-slate-700 bg-[#0F172A] pl-9 pr-3 text-sm text-white outline-none"
              />
            </div>
            <span className="text-sm text-slate-400">
              {policies.length} items
            </span>
          </div>
        </div>

        {(() => {
          const q = search.toLowerCase().trim();
          const filtered = q
            ? policies.filter((p) =>
                p.title.toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q) ||
                p.content.toLowerCase().includes(q)
              )
            : policies;
          return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    No policies match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((policy) => (
                <tr
                  key={policy.id}
                  className="border-b border-slate-800 hover:bg-slate-950/40"
                >
                  <td className="px-4 py-3 text-white">
                    {policy.title}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {policy.type}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${policy.isActive ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-300"}`}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(policy.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editPolicy(policy)}
                        className="rounded-xl bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(policy.id)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      );
    })()}
      </div>
    </div>
  );
}
