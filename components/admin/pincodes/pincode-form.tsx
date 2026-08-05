"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Pincode {
  id: string;
  pincode: string;
  isDeliverable: boolean;
  estimatedDays: number;
  allowCod: boolean;
  allowOnline: boolean;
}

interface Props {
  mode?: "create" | "edit";
  pincode?: Pincode;
}

interface FormValues {
  pincode: string;
  isDeliverable: boolean;
  estimatedDays: number;
  allowCod: boolean;
  allowOnline: boolean;
}

export default function PincodeForm({ mode = "create", pincode }: Props) {
  const router = useRouter();

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      pincode: pincode?.pincode ?? "",
      isDeliverable: pincode?.isDeliverable ?? true,
      estimatedDays: pincode?.estimatedDays ?? 3,
      allowCod: pincode?.allowCod ?? true,
      allowOnline: pincode?.allowOnline ?? true,
    },
  });

  const allowCod = watch("allowCod");
  const allowOnline = watch("allowOnline");

  async function onSubmit(data: FormValues) {
    if (!allowCod && !allowOnline) {
      toast.error("At least one payment method must be enabled.");
      return;
    }

    const url =
      mode === "edit"
        ? `/api/admin/pincodes/${pincode?.id}`
        : "/api/admin/pincodes";

    const method = mode === "edit" ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(mode === "edit" ? "Pincode updated" : "Pincode created");
    router.push("/admin/pincodes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Pincode Details</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Pincode
            </label>
            <input
              {...register("pincode", {
                required: true,
                pattern: /^\d{6}$/,
                minLength: 6,
                maxLength: 6,
              })}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Must be exactly 6 digits
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Estimated Delivery Days
            </label>
            <input
              type="number"
              min={1}
              max={30}
              {...register("estimatedDays", { valueAsNumber: true })}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Business days for delivery after order is shipped
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                {...register("isDeliverable")}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-600 after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
            <span className="text-sm font-semibold text-slate-300">
              Delivery Available
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                {...register("allowCod")}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-600 after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
            <span className="text-sm font-semibold text-slate-300">
              Allow Cash on Delivery (COD)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                {...register("allowOnline")}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-600 after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
            <span className="text-sm font-semibold text-slate-300">
              Allow Online Payment
            </span>
          </div>

          {!allowCod && !allowOnline && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              At least one payment method must be enabled.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400">
          {mode === "edit" ? "Update Pincode" : "Create Pincode"}
        </button>
      </div>
    </form>
  );
}
