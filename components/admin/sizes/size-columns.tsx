"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export const sizeHeaders = [
  "Size Name",
  "Code",
  "Size Category",
  "Unit",
  "Gender",
  "Status",
  "Actions",
];

interface Props {
  size: {
    id: string;
    sizeName: string;
    sizeCode: string;
    sizeCategory: string;
    sizeUnit: string;
    isActive: boolean;
    gender: {
      name: string;
    } | null;
  };
}

export function SizeRow({
  size,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteSize() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/sizes/${size.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Size deleted");
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

      <td className="px-5 py-4 font-semibold text-white">
        {size.sizeName}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {size.sizeCode}
      </td>

      <td className="px-5 py-4">
        <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
          {SIZE_CATEGORY_LABELS[size.sizeCategory] || size.sizeCategory}
        </span>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {size.sizeUnit}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {size.gender?.name ?? "-"}
      </td>

      <td className="px-5 py-4">
        {size.isActive ? (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-400">
            Inactive
          </span>
        )}
      </td>

      <td className="px-5 py-4">

        <div className="flex gap-2">

          <Link
            href={`/admin/sizes/${size.id}/edit`}
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
                  Delete this size?
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
                  onClick={deleteSize}
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
