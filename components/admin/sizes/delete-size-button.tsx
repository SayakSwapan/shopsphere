"use client";

import toast from "react-hot-toast";

import {
  useRouter,
} from "next/navigation";

interface Props {
  id: string;
}

export default function DeleteSizeButton({
  id,
}: Props) {
  const router =
    useRouter();

  const handleDelete =
    async () => {
      const confirmDelete =
        confirm(
          "Delete size?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/sizes/${id}`,
            {
              method:
                "DELETE",
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
          "Size deleted"
        );

        router.refresh();
      } catch {
        toast.error(
          "Something went wrong"
        );
      }
    };

  return (
    <button
      onClick={
        handleDelete
      }
      className="text-red-600"
    >
      Delete
    </button>
  );
}