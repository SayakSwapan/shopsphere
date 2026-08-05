"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Gender {
  id: string;
  name: string;
  isActive: boolean;
}

interface Props {
  mode?: "create" | "edit";
  gender?: Gender;
}

interface FormValues {
  name: string;
  isActive: boolean;
}

export default function GenderForm({
  mode = "create",
  gender,
}: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: {
      name: gender?.name ?? "",
      isActive: gender?.isActive ?? true,
    },
  });

  async function onSubmit(data: FormValues) {
    const url =
      mode === "edit"
        ? `/api/admin/genders/${gender?.id}`
        : "/api/admin/genders";

    const method =
      mode === "edit"
        ? "PUT"
        : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(
      mode === "edit"
        ? "Gender updated"
        : "Gender created"
    );

    router.push("/admin/genders");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
    >
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

        <h2 className="mb-6 text-xl font-bold text-white">
          Gender Details
        </h2>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Gender Name
            </label>

            <input
              {...register("name", {
                required: true,
              })}
              placeholder="Enter gender name"
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("isActive")}
              className="h-5 w-5 rounded border-slate-700 bg-[#0F172A] accent-amber-500"
            />
            <span className="text-sm font-semibold text-slate-300">
              Active
            </span>
          </label>

        </div>

      </div>

      <div className="flex justify-end">

        <button
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          {mode === "edit"
            ? "Update Gender"
            : "Create Gender"}
        </button>

      </div>

    </form>
  );
}
