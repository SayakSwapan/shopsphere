"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  testimonialId: string;
}

export default function DeleteTestimonialButton({ testimonialId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Testimonial deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete testimonial");
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
