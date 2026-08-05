"use client";

import { UseFormRegister } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  register: UseFormRegister<ProductFormValues>;
}

export default function InventorySection({
  register,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

      <h2 className="text-xl font-bold text-white mb-6">
        Inventory
      </h2>

      <div className="grid md:grid-cols-2 gap-5">

        <div>

          <label className="text-sm text-slate-300">
            Stock
            <FieldHint text="Total quantity available for sale across all variants. This is the master stock count that gets distributed among variants." />
          </label>

          <input
            type="number"
            {...register("stock", { valueAsNumber: true })}
            className="mt-2 w-full h-12 rounded-xl bg-[#0F172A] border border-slate-700 px-4 text-white"
          />

        </div>

        <div>

          <label className="text-sm text-slate-300">
            Low Stock Alert
            <FieldHint text="When stock drops below this number, you will receive a low-stock notification. Set to 0 to disable alerts." />
          </label>

          <input
            type="number"
            {...register("lowStockAlert", { valueAsNumber: true })}
            className="mt-2 w-full h-12 rounded-xl bg-[#0F172A] border border-slate-700 px-4 text-white"
          />

        </div>

      </div>

    </div>
  );
}