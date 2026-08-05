"use client";

import { useState } from "react";
import VariantDialog from "./variant-dialog";
import VariantTable from "./variant-table";

export interface VariantType {
  id: string;

  genderId: string;
  genderName: string;

  sizeId: string;
  sizeName: string;

  sku: string;

  stock: number;
}

interface Props {
  variants: VariantType[];

  setVariants: React.Dispatch<
    React.SetStateAction<VariantType[]>
  >;

  genders: {
    id: string;
    name: string;
  }[];

  sizes: {
    id: string;
    genderId: string;
    sizeName: string;
    sizeCategory: string;
  }[];

  sizeCategory: string;

  productStock: number;
}

export default function VariantSection({
  variants,
  setVariants,
  genders,
  sizes,
  sizeCategory,
  productStock,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [editingVariant, setEditingVariant] =
    useState<VariantType | null>(null);

  const noCategory = !sizeCategory;
  const noSizesForCategory = !noCategory && sizes.length === 0;
  const isFreeSize = sizeCategory === "FREESIZE";

  function addVariant() {
    setEditingVariant(null);
    setOpen(true);
  }

  function editVariant(
    variant: VariantType
  ) {
    setEditingVariant(variant);
    setOpen(true);
  }

  function removeVariant(
    id: string
  ) {
    setVariants((prev) =>
      prev.filter(
        (v) => v.id !== id
      )
    );
  }

  const buttonDisabled = noCategory || noSizesForCategory;

  let buttonTitle = "+ Add Variant";
  if (isFreeSize) buttonTitle = "+ Add Free Size Variant";

  let statusNote = "";
  if (noCategory) statusNote = "Select a category to manage variants.";
  else if (noSizesForCategory) statusNote = "No sizes configured for this category type. Add sizes in Settings > Sizes first.";
  else if (isFreeSize) statusNote = "This category uses Free Size. Gender and size will be auto-selected.";

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-bold text-white">
            Product Variants
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {statusNote || "Create size-gender combinations for this product."}
          </p>

        </div>

        <button
          type="button"
          onClick={addVariant}
          disabled={buttonDisabled}
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {buttonTitle}
        </button>

      </div>

      <VariantTable
        variants={variants}
        editVariant={editVariant}
        removeVariant={removeVariant}
      />

      <VariantDialog
        open={open}
        setOpen={setOpen}
        genders={genders}
        sizes={sizes}
        sizeCategory={sizeCategory}
        variants={variants}
        setVariants={setVariants}
        editingVariant={editingVariant}
        setEditingVariant={setEditingVariant}
        productStock={productStock}
      />

    </div>
  );
}