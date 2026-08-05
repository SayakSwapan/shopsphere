"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import FieldHint from "@/components/admin/common/field-hint";
import { formatCurrency } from "@/lib/format";

export interface PrintTypeFormData {
  id?: string;
  name: string;
  description: string;
  pricePerLetter: number | string;
  minLetters: number | string;
  maxLetters: number | string;
  designFee: number | string;
  allowName: boolean;
  allowNumber: boolean;
  allowImage: boolean;
  isActive: boolean;
  sortOrder: number | string;
}

interface Props {
  mode?: "create" | "edit";
  printType?: PrintTypeFormData;
}

export default function PrintTypeForm({
  mode = "create",
  printType,
}: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<PrintTypeFormData>({
    defaultValues: {
      name: printType?.name ?? "",
      description: printType?.description ?? "",
      pricePerLetter: printType?.pricePerLetter ?? "",
      minLetters: printType?.minLetters ?? 0,
      maxLetters: printType?.maxLetters ?? 20,
      designFee: printType?.designFee ?? 0,
      allowName: printType?.allowName ?? true,
      allowNumber: printType?.allowNumber ?? true,
      allowImage: printType?.allowImage ?? true,
      isActive: printType?.isActive ?? true,
      sortOrder: printType?.sortOrder ?? 0,
    },
  });

  const pricePerLetter = Number(watch("pricePerLetter")) || 0;
  const designFee = Number(watch("designFee")) || 0;
  const minLetters = Number(watch("minLetters")) || 0;
  const maxLetters = Number(watch("maxLetters")) || 0;

  const exampleName = "SAYAK";
  const exampleNumber = "7";
  const exampleLetters = exampleName.length + exampleNumber.length;
  const examplePrint = Math.round((pricePerLetter * Math.max(exampleLetters, minLetters) + designFee) * 100) / 100;

  async function onSubmit(data: PrintTypeFormData) {
    const url =
      mode === "edit"
        ? `/api/admin/print-types/${printType?.id}`
        : "/api/admin/print-types";

    const response = await fetch(url, {
      method: mode === "edit" ? "PUT" : "POST",
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
        ? "Print type updated"
        : "Print type created"
    );

    router.push("/admin/print-types");
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
    >
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

        <h2 className="mb-6 text-xl font-bold text-white">
          Print Type Details
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Name <span className="text-red-400">*</span> <FieldHint text="e.g. Normal Print, Rubber Print, Premium Print." />
            </label>

            <input
              {...register("name", { required: true })}
              placeholder="e.g. Rubber Print"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Description <FieldHint text="Optional. Shown to customers as a short note." />
            </label>

            <input
              {...register("description")}
              placeholder="e.g. Durable rubberised name & number printing"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Price Per Letter (₹) <span className="text-red-400">*</span> <FieldHint text="Charge per printable character (name + number). GST is added on top." />
            </label>

            <input
              {...register("pricePerLetter", { required: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 10"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Design Fee (₹) <FieldHint text="Extra one-time charge when the customer uploads a design image." />
            </label>

            <input
              {...register("designFee")}
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 20"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Min Letters <FieldHint text="Minimum billable characters. A 1-letter name still pays for this many." />
            </label>

            <input
              {...register("minLetters")}
              type="number"
              min="0"
              placeholder="e.g. 3"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Max Letters <FieldHint text="Upper limit on characters customers can enter for this print." />
            </label>

            <input
              {...register("maxLetters")}
              type="number"
              min="0"
              placeholder="e.g. 20"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Sort Order <FieldHint text="Lower numbers appear first in the customer dropdown." />
            </label>

            <input
              {...register("sortOrder")}
              type="number"
              min="0"
              placeholder="e.g. 1"
              className={fieldClass}
            />
          </div>

        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            Allow customer to add
          </p>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("allowName")}
                className="h-5 w-5 rounded border-slate-700 bg-[#0F172A] accent-amber-500"
              />
              <span className="text-sm font-semibold text-slate-300">
                Name
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("allowNumber")}
                className="h-5 w-5 rounded border-slate-700 bg-[#0F172A] accent-amber-500"
              />
              <span className="text-sm font-semibold text-slate-300">
                Number
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("allowImage")}
                className="h-5 w-5 rounded border-slate-700 bg-[#0F172A] accent-amber-500"
              />
              <span className="text-sm font-semibold text-slate-300">
                Design image
              </span>
            </label>
          </div>
        </div>

        {pricePerLetter > 0 && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-400">
              Live example
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Name &quot;{exampleName}&quot; + number &quot;{exampleNumber}&quot; ({exampleLetters} letters{exampleLetters < minLetters ? `, billed at min ${minLetters}` : ""})
              {designFee > 0 && ` + ₹${designFee.toFixed(2)} design fee`} ={" "}
              <span className="font-bold text-white">
                {formatCurrency(examplePrint)}
              </span>{" "}
              per item
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
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

          <p className="text-xs text-slate-500">
            Max allowed: {maxLetters} letters
          </p>
        </div>

      </div>

      <div className="flex justify-end">
        <button
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          {mode === "edit"
            ? "Update Print Type"
            : "Create Print Type"}
        </button>
      </div>
    </form>
  );
}
