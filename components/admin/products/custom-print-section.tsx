"use client";

import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";
import { formatCurrency } from "@/lib/format";

export interface PrintTypeOption {
  id: string;
  name: string;
  description: string | null;
  pricePerLetter: number | string;
  designFee: number | string;
}

interface Props {
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  printTypes?: PrintTypeOption[];
}

export default function CustomPrintSection({
  register,
  watch,
  setValue,
  printTypes = [],
}: Props) {
  const enabled = watch("customPrintEnabled");
  const selectedIds = watch("customPrintTypeIds") ?? [];

  function togglePrintType(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((existing) => existing !== id)
      : [...selectedIds, id];

    setValue("customPrintTypeIds", next, { shouldDirty: true });
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
      <h2 className="mb-2 text-xl font-bold text-white">
        Custom Printing
      </h2>
      <p className="mb-6 text-xs text-slate-500">
        Let customers personalise this product with a name, a number (000–999)
        and/or an uploaded design image before adding it to the cart.
      </p>

      <div className="space-y-5">
        <label className="flex items-center justify-between">
          <span className="text-slate-300">
            Enable Custom Printing
            <FieldHint text="When enabled, the storefront shows a personalisation panel (name, number and/or design image) for this product." />
          </span>
          <input
            type="checkbox"
            {...register("customPrintEnabled")}
            className="h-5 w-5 accent-amber-500"
          />
        </label>

        <div className={`space-y-5 ${enabled ? "" : "pointer-events-none opacity-40"}`}>
          <label className="flex items-center justify-between">
            <span className="text-slate-300">
              Allow Name
              <FieldHint text="Customers can type the name they want printed." />
            </span>
            <input
              type="checkbox"
              {...register("customPrintName")}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-slate-300">
              Allow Number (000–999)
              <FieldHint text="Customers can enter a jersey-style number between 000 and 999." />
            </span>
            <input
              type="checkbox"
              {...register("customPrintNumber")}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-slate-300">
              Allow Design Image
              <FieldHint text="Customers can upload an image/design for the name and number with the font they want." />
            </span>
            <input
              type="checkbox"
              {...register("customPrintImage")}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <div className="border-t border-slate-700 pt-5">
            <p className="mb-1 text-sm font-semibold text-slate-300">
              Available Print Types
              <FieldHint text="Pick the print styles customers can choose for this product. Leave empty to allow every active print type." />
            </p>

            {printTypes.length === 0 ? (
              <p className="text-xs text-slate-500">
                No print types yet —{" "}
                <a href="/admin/print-types/new" className="text-amber-400 underline">
                  create one first
                </a>.
              </p>
            ) : (
              <div className="space-y-2">
                {printTypes.map((printType) => {
                  const checked = selectedIds.includes(printType.id);

                  return (
                    <label
                      key={printType.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition ${
                        checked
                          ? "border-amber-500/60 bg-amber-500/10"
                          : "border-slate-700 bg-[#0F172A]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePrintType(printType.id)}
                          className="h-4 w-4 accent-amber-500"
                        />
                        <span className="text-sm font-medium text-white">
                          {printType.name}
                        </span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatCurrency(Number(printType.pricePerLetter))}/letter
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
