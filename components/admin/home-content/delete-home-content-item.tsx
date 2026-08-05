"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  type: "feature-card" | "promo-banner";
  id: string;
}

const apiBase = (type: string) =>
  type === "feature-card" ? "home-feature-cards" : "promo-banners";

const label = (type: string) =>
  type === "feature-card" ? "feature card" : "promo banner";

export default function DeleteHomeContentItem({ type, id }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete this ${label(type)}?`)) return;
    try {
      const res = await fetch(`/api/admin/${apiBase(type)}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`${label(type)} deleted`);
      router.refresh();
    } catch {
      toast.error(`Failed to delete ${label(type)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
    >
      <Trash2 size={16} />
    </button>
  );
}
