"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  linkId: string;
}

export default function DeleteSocialLinkButton({ linkId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this social link?")) return;
    try {
      const res = await fetch(`/api/admin/social-links/${linkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Social link deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete social link");
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
