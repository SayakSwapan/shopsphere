"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";

interface Props { faq: { id: string; question: string; answer: string; sortOrder: number; isActive: boolean; createdAt: string } }

export function FaqRow({ faq }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this FAQ?")) return;
    const res = await fetch(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <tr className="border-t border-slate-700 hover:bg-slate-800/40 transition">
      <td className="px-6 py-5">
        <p className="font-semibold text-white text-sm">{faq.question}</p>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{faq.answer}</p>
      </td>
      <td className="px-6 py-5 text-center text-white text-sm">{faq.sortOrder}</td>
      <td className="px-6 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${faq.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-600/20 text-slate-400"}`}>
          {faq.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex gap-2">
          <NextLink href={`/admin/faqs/${faq.id}/edit`} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">Edit</NextLink>
          <button onClick={handleDelete} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30">Delete</button>
        </div>
      </td>
    </tr>
  );
}

export const faqHeaders = ["Question & Answer", "Order", "Status", "Actions"];
