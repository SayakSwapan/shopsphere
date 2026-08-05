"use client";

import {
  useForm,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  genderSchema,
} from "@/lib/validations/gender.validation";

import { z } from "zod";

import { Button } from "@/components/ui/button";

import {
  useRouter,
} from "next/navigation";

import toast from "react-hot-toast";

interface Props {
  initialData?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

type FormData = z.infer<
  typeof genderSchema
>;

export default function GenderForm({
  initialData,
}: Props) {
  const router =
    useRouter();

  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    resolver:
      zodResolver(
        genderSchema
      ),

    defaultValues: {
      name:
        initialData?.name ||
        "",

      isActive:
        initialData?.isActive ??
        true,
    },
  });

  const onSubmit =
    async (
      values: FormData
    ) => {
      try {
        const url =
          initialData
            ? `/api/genders/${initialData.id}`
            : "/api/genders";

        const method =
          initialData
            ? "PUT"
            : "POST";

        const response =
          await fetch(url, {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              values
            ),
          });

        const data =
          await response.json();

        if (!data.success) {
          toast.error(
            "Something went wrong"
          );

          return;
        }

        toast.success(
          initialData
            ? "Gender updated"
            : "Gender created"
        );

        router.push(
          "/admin/masters/genders"
        );

        router.refresh();
      } catch {
        toast.error(
          "Something went wrong"
        );
      }
    };

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="space-y-6"
    >
      <div>
        <label>
          Gender Name
        </label>

        <input
          {...register("name")}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register(
            "isActive"
          )}
        />

        <label>
          Active
        </label>
      </div>

      <Button type="submit">
        {initialData
          ? "Update Gender"
          : "Create Gender"}
      </Button>
    </form>
  );
}