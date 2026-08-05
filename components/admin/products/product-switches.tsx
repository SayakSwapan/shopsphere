"use client";

import { UseFormRegister } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  register: UseFormRegister<ProductFormValues>;
}

export default function ProductSwitches({
  register,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

      <h2 className="text-xl font-bold text-white mb-6">
        Product Settings
      </h2>

      <div className="space-y-5">

        <label className="flex items-center justify-between">

          <span className="text-slate-300">
            Active Product
            <FieldHint text="When enabled, the product is visible and available for purchase on the storefront. Disable to hide it without deleting." />
          </span>

          <input
            type="checkbox"
            {...register("status")}
            className="h-5 w-5 accent-amber-500"
          />

        </label>

        <label className="flex items-center justify-between">

          <span className="text-slate-300">
            Featured Product
            <FieldHint text="Featured products are displayed prominently on the homepage and marketing sections. Use this to highlight special items." />
          </span>

          <input
            type="checkbox"
            {...register("isFeatured")}
            className="h-5 w-5 accent-amber-500"
          />

        </label>

        <label className="flex items-center justify-between">

          <span className="text-slate-300">
            Trending Product
            <FieldHint text="Mark as trending to show a 'Trending' badge on the product card. Useful for products currently gaining popularity." />
          </span>

          <input
            type="checkbox"
            {...register("isTrending")}
            className="h-5 w-5 accent-amber-500"
          />

        </label>

      </div>

    </div>
  );
}