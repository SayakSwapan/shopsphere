"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  ExternalLink,
  Star,
  Flame,
  Power,
  Loader2,
} from "lucide-react";

interface Props {
  productId: string;
  slug: string;
  status: boolean;
  isFeatured: boolean;
  isTrending: boolean;
}

type ToggleKey = "status" | "isFeatured" | "isTrending";

export default function ProductQuickActions({
  productId,
  slug,
  status,
  isFeatured,
  isTrending,
}: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleToggle(key: ToggleKey, value: boolean) {
    setBusyKey(key);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Update failed");
      }

      const labels: Record<ToggleKey, string> = {
        status: value ? "enabled" : "disabled",
        isFeatured: value ? "featured" : "unfeatured",
        isTrending: value ? "trending" : "removed from trending",
      };

      toast.success(`Product ${labels[key]}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This cannot be undone."
    );
    if (!confirmed) return;

    setBusyKey("delete");
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Product deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to delete product"
      );
    } finally {
      setBusyKey(null);
    }
  }

  const toggleBtn = (
    active: boolean,
    key: ToggleKey,
    onLabel: string,
    offLabel: string,
    activeClass: string,
    inactiveClass: string,
    icon: React.ReactNode
  ) => {
    const loading = busyKey === key;
    return (
      <button
        onClick={() => handleToggle(key, !active)}
        disabled={loading}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
          active ? activeClass : inactiveClass
        }`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
        {active ? onLabel : offLabel}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/products/${slug}`}
        target="_blank"
        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 hover:bg-slate-700"
      >
        <ExternalLink size={16} />
        View Store
      </Link>

      <Link
        href={`/admin/products/edit/${productId}`}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
      >
        <Pencil size={16} />
        Edit
      </Link>

      <button
        onClick={handleDelete}
        disabled={busyKey === "delete"}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyKey === "delete" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
        Delete
      </button>

      {toggleBtn(
        status,
        "status",
        "Active",
        "Inactive",
        "bg-emerald-500 text-white",
        "bg-slate-700 text-slate-300",
        <Power size={16} />
      )}

      {toggleBtn(
        isFeatured,
        "isFeatured",
        "Featured",
        "Feature",
        "bg-amber-500 text-black",
        "bg-slate-700 text-slate-300",
        <Star size={16} />
      )}

      {toggleBtn(
        isTrending,
        "isTrending",
        "Trending",
        "Make Trending",
        "bg-pink-500 text-white",
        "bg-slate-700 text-slate-300",
        <Flame size={16} />
      )}
    </div>
  );
}
