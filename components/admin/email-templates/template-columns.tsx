"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";

interface Template {
  id: string;
  templateKey: string;
  templateName: string;
  subject: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export function TemplateRow({ template }: { template: Template }) {
  const router = useRouter();

  async function handleToggle() {
    await fetch(`/api/admin/email-templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete template "${template.templateName}"?`)) return;
    const res = await fetch(`/api/admin/email-templates/${template.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <tr className="border-t border-slate-700 hover:bg-slate-800/40 transition">
      <td className="px-6 py-5">
        <p className="font-semibold text-white text-sm">{template.templateName}</p>
        <p className="text-xs text-amber-400 font-mono mt-1">{template.templateKey}</p>
        {template.description && (
          <p className="text-xs text-slate-500 mt-1">{template.description}</p>
        )}
      </td>
      <td className="px-6 py-5 text-sm text-slate-300 max-w-[200px] truncate">{template.subject}</td>
      <td className="px-6 py-5">
        <button
          onClick={handleToggle}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            template.isActive
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-slate-600/20 text-slate-400 hover:bg-slate-600/30"
          }`}
        >
          {template.isActive ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="px-6 py-5">
        <div className="flex gap-2">
          <NextLink
            href={`/admin/email-templates/${template.id}`}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            Edit
          </NextLink>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export const templateHeaders = ["Template", "Subject", "Status", "Actions"];
