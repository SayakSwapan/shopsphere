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

export const genderHeaders = [
  "Gender",
  "Status",
  "Sizes",
  "Created",
  "Actions",
];

interface Props {
  gender: {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    _count: {
      size: number;
    };
  };
}

// Deterministic format so server and client render the same string
// (avoids locale-based hydration mismatches).
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function GenderRow({
  gender,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteGender() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/genders/${gender.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Gender deleted");
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
        {gender.name}
      </td>

      <td className="px-5 py-4">
        {gender.isActive ? (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-400">
            Inactive
          </span>
        )}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {gender._count.size}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {formatDate(gender.createdAt)}
      </td>

      <td className="px-5 py-4">

        <div className="flex gap-2">

          <Link
            href={`/admin/genders/${gender.id}/edit`}
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
                  Delete this gender?
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
                  onClick={deleteGender}
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
