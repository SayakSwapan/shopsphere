"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";

interface Props { reason: { id: string; type: string; question: string; options: string; sortOrder: number; isActive: boolean } }

export function ReturnReasonRow({ reason }: Props) {
  const router = useRouter();
  const options = reason.options.split("|").filter(Boolean);

  async function handleDelete() {
    if (!confirm("Delete this reason?")) return;
    const res = await fetch(`/api/admin/return-reasons/${reason.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <tr className="border-t border-slate-700 hover:bg-slate-800/40 transition">
      <td className="px-6 py-5">
        <p className="text-xs text-amber-400 font-semibold">{reason.type}</p>
        <p className="font-semibold text-white text-sm mt-1">{reason.question}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {options.map((o, i) => (
            <span key={i} className="rounded-lg bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{o}</span>
          ))}
        </div>
      </td>
      <td className="px-6 py-5 text-center text-white text-sm">{reason.sortOrder}</td>
      <td className="px-6 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reason.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-600/20 text-slate-400"}`}>
          {reason.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex gap-2">
          <NextLink href={`/admin/return-reasons/${reason.id}`} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">Edit</NextLink>
          <button onClick={handleDelete} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30">Delete</button>
        </div>
      </td>
    </tr>
  );
}

export const reasonHeaders = ["Question & Options", "Order", "Status", "Actions"];
