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

import { formatCurrency } from "@/lib/format";

export const printTypeHeaders = [
  "Name",
  "Per Letter",
  "Design Fee",
  "Min / Max",
  "Fields",
  "Status",
  "Actions",
];

interface Props {
  printType: {
    id: string;
    name: string;
    description: string | null;
    pricePerLetter: number | string;
    designFee: number | string;
    minLetters: number;
    maxLetters: number;
    allowName: boolean;
    allowNumber: boolean;
    allowImage: boolean;
    isActive: boolean;
    sortOrder: number;
  };
}

export function PrintTypeRow({
  printType,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deletePrintType() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/print-types/${printType.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Print type deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const allowedFields = [
    printType.allowName ? "Name" : null,
    printType.allowNumber ? "Number" : null,
    printType.allowImage ? "Design" : null,
  ].filter(Boolean);

  return (
    <tr className="border-b border-slate-800 transition hover:bg-slate-900/40">

      <td className="px-5 py-4">
        <p className="font-semibold text-white">
          {printType.name}
        </p>
        {printType.description && (
          <p className="mt-0.5 text-xs text-slate-500">
            {printType.description}
          </p>
        )}
      </td>

      <td className="px-5 py-4 font-semibold text-amber-400">
        {formatCurrency(Number(printType.pricePerLetter))}
        <span className="ml-1 text-xs font-normal text-slate-500">/letter</span>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {Number(printType.designFee) > 0
          ? formatCurrency(Number(printType.designFee))
          : "—"}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {printType.minLetters} / {printType.maxLetters}
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {allowedFields.length === 0 ? (
            <span className="text-slate-600">—</span>
          ) : (
            allowedFields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px] font-medium text-slate-300"
              >
                {field}
              </span>
            ))
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        {printType.isActive ? (
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
            href={`/admin/print-types/${printType.id}/edit`}
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
                  Delete this print type?
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
                  onClick={deletePrintType}
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
