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

import StatusBadge from "@/components/admin/common/status-badge";

export const pincodeHeaders = [
  "Pincode",
  "Status",
  "Est. Days",
  "COD",
  "Online",
  "Actions",
];

interface Props {
  pincode: {
    id: string;
    pincode: string;
    isDeliverable: boolean;
    estimatedDays: number;
    allowCod: boolean;
    allowOnline: boolean;
    createdAt: Date;
  };
}

export function PincodeRow({ pincode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deletePincode() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pincodes/${pincode.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Pincode deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-slate-800 transition hover:bg-slate-900/40">
      <td className="px-5 py-4 font-mono font-semibold text-white">
        {pincode.pincode}
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          text={pincode.isDeliverable ? "Deliverable" : "Not Deliverable"}
          color={pincode.isDeliverable ? "green" : "red"}
        />
      </td>

      <td className="px-5 py-4 text-slate-300">
        {pincode.estimatedDays} day{pincode.estimatedDays > 1 ? "s" : ""}
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          text={pincode.allowCod ? "Yes" : "No"}
          color={pincode.allowCod ? "green" : "red"}
        />
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          text={pincode.allowOnline ? "Yes" : "No"}
          color={pincode.allowOnline ? "green" : "red"}
        />
      </td>

      <td className="px-5 py-4">
        <div className="flex gap-2">
          <Link
            href={`/admin/pincodes/${pincode.id}/edit`}
            className="rounded-lg bg-amber-500 p-2 text-black hover:bg-amber-400"
          >
            <Pencil size={16} />
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600">
                <Trash2 size={16} />
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="border-slate-700 bg-[#111827] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  Delete this pincode?
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
                  onClick={deletePincode}
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
