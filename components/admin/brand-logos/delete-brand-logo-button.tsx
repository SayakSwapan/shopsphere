"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  logoId: string;
}

export default function DeleteBrandLogoButton({ logoId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this brand logo?")) return;
    try {
      const res = await fetch(`/api/admin/brand-logos/${logoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Brand logo deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete brand logo");
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
