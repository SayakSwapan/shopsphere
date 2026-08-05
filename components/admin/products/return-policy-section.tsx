"use client";

import { ProductFormValues } from "@/types/product-form";
import { UseFormRegister, UseFormWatch } from "react-hook-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
}

export default function ReturnPolicySection({
  register,
  watch,
}: Props) {
  const isReturnable = watch("isReturnable");
  const isReplaceable = watch("isReplaceable");

  return (
    <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Return & Exchange
      </h2>

      <div className="space-y-5">
        <label className="flex items-center justify-between">
          <span className="text-slate-300">
            Returnable
            <FieldHint text="Allow customers to return this product within a specified number of days. Enable to show the return option on the product page." />
          </span>
          <input
            type="checkbox"
            {...register("isReturnable")}
            className="h-5 w-5 accent-amber-500"
          />
        </label>

        {isReturnable && (
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Return Window (days)
              <FieldHint text="Number of days customers have to initiate a return after delivery. Common: 7, 15, or 30 days." />
            </label>
            <input
              type="number"
              {...register("returnDays", {
                valueAsNumber: true,
              })}
              min={0}
              placeholder="e.g. 7"
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
          </div>
        )}

        <label className="flex items-center justify-between">
          <span className="text-slate-300">
            Replaceable
            <FieldHint text="Allow customers to request a replacement instead of a refund. Useful for defective or damaged items." />
          </span>
          <input
            type="checkbox"
            {...register("isReplaceable")}
            className="h-5 w-5 accent-amber-500"
          />
        </label>

        {isReplaceable && (
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Replace Window (days)
              <FieldHint text="Number of days customers have to request a replacement after delivery. Common: 7, 15, or 30 days." />
            </label>
            <input
              type="number"
              {...register("replaceDays", {
                valueAsNumber: true,
              })}
              min={0}
              placeholder="e.g. 7"
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
