"use client";

import {
  useRouter,
} from "next/navigation";

import toast from "react-hot-toast";

interface Props {
  editHref: string;

  deleteUrl: string;
}

export default function TableActions({
  editHref,
  deleteUrl,
}: Props) {
  const router =
    useRouter();

  const handleDelete =
    async () => {
      const confirmDelete =
        confirm(
          "Are you sure?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        const response =
          await fetch(
            deleteUrl,
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
          "Deleted successfully"
        );

        router.refresh();
      } catch {
        toast.error(
          "Something went wrong"
        );
      }
    };

  return (
    <div className="flex items-center gap-3">
      <a
        href={editHref}
        className="text-blue-600"
      >
        Edit
      </a>

      <button
        onClick={
          handleDelete
        }
        className="text-red-600"
      >
        Delete
      </button>
    </div>
  );
}