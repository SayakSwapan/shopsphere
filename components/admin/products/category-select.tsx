"use client";

import { category } from "@prisma/client";
import {
  UseFormRegister,
} from "react-hook-form";

import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {

  categories: category[];

  register: UseFormRegister<ProductFormValues>;

}

export default function CategorySelect({

  categories,

  register

}: Props) {

  return (

    <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

      <h2 className="text-xl font-bold text-white mb-6">
        Category
        <FieldHint text="The product category determines where the product appears in your store navigation. Choose the most relevant category for better discoverability." />
      </h2>

      <select

        {...register("categoryId")}

        className="h-11 w-full rounded-xl border border-slate-700 bg-[#111827] px-3 text-white outline-none"

      >

        <option value="">

          Select Category

        </option>

        {

          categories.map(category => (

            <option className="bg-[#111827] text-white"

              key={category.id}

              value={category.id}

            >

              {category.name}

            </option>

          ))

        }

      </select>

    </div>

  )

}