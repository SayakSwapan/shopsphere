"use client";

import {
  useRouter,
} from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import Link from "next/link";

interface Props {
  editHref: string;

  deleteUrl: string;

  viewHref?: string;
}

export default function TablesActions({
  editHref,
  deleteUrl,
  viewHref,
}: Props) {
  const router =
    useRouter();

  const handleDelete =
    async () => {
      const confirmDelete =
        confirm(
          "Are you sure you want to delete?"
        );

      if (!confirmDelete)
        return;

      try {
        const response =
          await fetch(
            deleteUrl,
            {
              method:
                "DELETE",
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            "Delete failed"
          );
        }
toast.success(
  "Deleted successfully"
);
        router.refresh();
      } catch (
        error
      ) {
        console.log(
          error
        );

        toast.error(
          "Failed to delete"
        );
          
      }
    };

  return (
    <div className="flex items-center gap-3">
      {/* VIEW */}

      {viewHref && (
        <Link
          href={viewHref}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all"
        >
          <Eye size={16} />

          View
        </Link>
      )}

      {/* EDIT */}

      <Link
        href={editHref}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all"
      >
        <Pencil size={16} />

        Edit
      </Link>

      {/* DELETE */}

      <button
        onClick={
          handleDelete
        }
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all"
      >
        <Trash2
          size={16}
        />

        Delete
      </button>
    </div>
  );
}