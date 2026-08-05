"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import toast from "react-hot-toast";

import {
  Trash2,
} from "lucide-react";

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

interface Props {
  id: string;
}

export function DeleteCategory({
  id,
}: Props) {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

  const handleDelete =
    async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/categories/${id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!data.success) {
          toast.error(
            "Delete failed"
          );

          return;
        }

        toast.success(
          "Category deleted"
        );

        router.refresh();
      } catch (error) {
        console.log(error);

        toast.error(
          "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="border rounded-lg p-2 hover:bg-red-50">
          <Trash2
            size={18}
            className="text-red-500"
          />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Category?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={
              handleDelete
            }
            disabled={loading}
          >
            {loading
              ? "Deleting..."
              : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}