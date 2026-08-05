"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { SIZE_CATEGORY_LABELS } from "@/lib/constants/size-units";

export const categoryHeaders = [
  "Category",
  "Slug",
  "Size Config",
  "Created",
  "Actions",
];

interface Props {
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    sizeCategory?: string | null;
    createdAt: Date;
  };
}

// Deterministic format so the server and client render the same string
// (avoids locale-based hydration mismatches like 9/6/2026 vs 6/9/2026).
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CategoryRow({
  category,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteCategory() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Category deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {category.image ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-700 bg-[#0F172A] flex-shrink-0">
              <Image src={category.image} alt="" fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800">
              <span className="text-xs font-bold text-slate-500">{category.name.charAt(0)}</span>
            </div>
          )}
          <span className="font-semibold text-white">{category.name}</span>
        </div>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {category.slug}
      </td>

      <td className="px-5 py-4">
        {category.sizeCategory && category.sizeCategory !== "NONE" && category.sizeCategory !== "" ? (
          <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            {SIZE_CATEGORY_LABELS[category.sizeCategory] || category.sizeCategory}
          </span>
        ) : (
          <span className="inline-block rounded-full bg-slate-600/20 px-3 py-1 text-xs font-semibold text-slate-500">
            No Sizes
          </span>
        )}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {formatDate(category.createdAt)}
      </td>

      <td className="px-5 py-4">

        <div className="flex gap-2">

          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="rounded-lg bg-amber-500 p-2 text-black hover:bg-amber-400"
          >
            <Pencil size={16} />
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
              >
                <Trash2 size={16} />
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="border-slate-700 bg-[#111827] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  Delete this category?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteCategory}
                  disabled={loading}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  {loading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>

      </td>

    </tr>
  );
}
