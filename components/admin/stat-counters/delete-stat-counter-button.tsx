"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  counterId: string;
}

export default function DeleteStatCounterButton({ counterId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this stat counter?")) return;
    try {
      const res = await fetch(`/api/admin/stat-counters/${counterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Stat counter deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete stat counter");
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
