"use client";

import {
  useRouter,
} from "next/navigation";

import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

interface Props {
  productId: string;
}

export function DeleteProductButton({
  productId,
}: Props) {
  const router =
    useRouter();

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this product?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/products/${productId}`,
            {
              method:
                "DELETE",
            }
          );

        const data =
          await response.json();

        if (!data.success) {
          toast.error(
            "Failed to delete product"
          );

          return;
        }

        toast.success(
          "Product deleted"
        );

        router.refresh();
      } catch {
        toast.error(
          "Something went wrong"
        );
      }
    };

  return (
    <Button
      variant="destructive"
      onClick={
        handleDelete
      }
    >
      Delete
    </Button>
  );
}