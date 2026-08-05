"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { VariantType } from "./variant-section";
import FieldHint from "@/components/admin/common/field-hint";

interface Gender {
  id: string;
  name: string;
}

interface Size {
  id: string;
  genderId: string;
  sizeName: string;
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;

  genders: Gender[];
  sizes: Size[];

  sizeCategory: string;

  variants: VariantType[];
  setVariants: React.Dispatch<
    React.SetStateAction<VariantType[]>
  >;

  editingVariant: VariantType | null;
  setEditingVariant: React.Dispatch<
    React.SetStateAction<VariantType | null>
  >;

  productStock: number;
}

interface FormState {
  genderId: string;
  sizeId: string;
  sku: string;
  stock: number;
}

export default function VariantDialog({
  open,
  setOpen,
  genders,
  sizes,
  sizeCategory,
  variants,
  setVariants,
  editingVariant,
  setEditingVariant,
  productStock,
}: Props) {
  const isFreeSize = sizeCategory === "FREESIZE";

  const [form, setForm] =
    useState<FormState>({
      genderId: isFreeSize ? (genders[0]?.id ?? "") : "",
      sizeId: isFreeSize ? (sizes[0]?.id ?? "") : "",
      sku: "",
      stock: 0,
    });

 const [previousVariantId, setPreviousVariantId] =
  useState<string | null>(null);

if (
  open &&
  previousVariantId !== (editingVariant?.id ?? null)
) {
  setPreviousVariantId(editingVariant?.id ?? null);

  if (editingVariant) {
    setForm({
      genderId: editingVariant.genderId,
      sizeId: editingVariant.sizeId,
      sku: editingVariant.sku,
      stock: editingVariant.stock,
    });
  } else {
    setForm({
      genderId: isFreeSize ? (genders[0]?.id ?? "") : "",
      sizeId: isFreeSize ? (sizes[0]?.id ?? "") : "",
      sku: "",
      stock: 0,
    });
  }
}
  if (!open) return null;

  const usedStock = variants.reduce((total, variant) => {
    if (
      editingVariant &&
      variant.id === editingVariant.id
    ) {
      return total;
    }

    return total + variant.stock;
  }, 0);

  const remainingStock =
    productStock - usedStock;

 function closeDialog() {
  setPreviousVariantId(null);
  setEditingVariant(null);
  setOpen(false);
}

  function saveVariant() {
    if (
      !form.genderId ||
      !form.sizeId
    ) {
      alert("Please select Gender and Size.");

      return;
    }

    if (form.stock <= 0) {
      alert("Stock must be greater than zero.");

      return;
    }

    const allowedStock =
      remainingStock +
      (editingVariant?.stock ?? 0);

    if (
      form.stock > allowedStock
    ) {
      alert(
        `Only ${allowedStock} stock available.`
      );

      return;
    }

    const gender =
      genders.find(
        (g) =>
          g.id === form.genderId
      );

    const size =
      sizes.find(
        (s) =>
          s.id === form.sizeId
      );

    const variant: VariantType =
      {
        id:
          editingVariant?.id ??
          `${Date.now()}-${Math.random()}`,

        genderId: form.genderId,

        genderName:
          gender?.name ?? "",

        sizeId: form.sizeId,

        sizeName:
          size?.sizeName ?? "",

        sku: form.sku,

        stock: form.stock,
      };

    if (editingVariant) {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === editingVariant.id
            ? variant
            : v
        )
      );
    } else {
      setVariants((prev) => [
        ...prev,
        variant,
      ]);
    }

    closeDialog();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

      <div className="w-[650px] rounded-2xl bg-[#111827] p-7 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-xl font-bold text-white">

            {editingVariant
              ? "Edit Variant"
              : "Add Variant"}

          </h2>

          <button
            type="button"
            onClick={closeDialog}
          >
            <X
              className="text-white"
              size={22}
            />
          </button>

        </div>

        <div className="grid grid-cols-2 gap-5">

          {isFreeSize ? (
            <div className="col-span-2">
              <label className="mb-2 block text-sm text-white">
                Size
              </label>
              <div className="flex h-11 items-center rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white/60">
                Free Size (auto-selected)
              </div>
              <p className="mt-1 text-xs text-slate-500">
                This category uses a single free size. Gender and size are pre-selected.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm text-white">
                  Gender
                  <FieldHint text="Select the gender category for this variant. Filters the available sizes." />
                </label>

                <select
                  value={form.genderId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      genderId:
                        e.target.value,
                      sizeId: "",
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
                >
                  <option value="">
                    Select Gender
                  </option>

                  {genders.map(
                    (gender) => (
                      <option
                        key={gender.id}
                        value={gender.id}
                        className="bg-[#0F172A]"
                      >
                        {gender.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm text-white">
                  Size
                  <FieldHint text="The specific size for this variant. Only sizes matching the selected gender and category are shown." />
                </label>

                <select
                  value={form.sizeId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sizeId:
                        e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
                >
                  <option value="">
                    Select Size
                  </option>

                  {sizes
                    .filter(
                      (size) =>
                        size.genderId ===
                        form.genderId
                    )
                    .map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                        className="bg-[#0F172A]"
                      >
                        {size.sizeName}
                      </option>
                    ))}

                </select>

              </div>
            </>
          )}

          <div>

            <label className="mb-2 block text-sm text-white">
              SKU
              <FieldHint text="Stock Keeping Unit — a unique identifier for this variant. Use a consistent format like BRAND-CATEGORY-SIZE (e.g. NK-AJ1-09)." />
            </label>

            <input
              value={form.sku}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sku:
                    e.target.value,
                }))
              }
              placeholder="e.g. NK-AJ1-09"
              className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm text-white">
              Stock
              <FieldHint text="Quantity of this specific variant available for sale. Cannot exceed the remaining product stock." />
            </label>

            <input
              type="number"
              min={1}
              value={form.stock}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stock: Number(
                    e.target.value
                  ),
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
            />

          </div>

        </div>

        <div className="mt-6 rounded-xl bg-[#0F172A] p-4 text-sm text-amber-400">

          Remaining Product Stock :
          {" "}
          {remainingStock}

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button
            type="button"
            onClick={closeDialog}
            className="rounded-xl border border-slate-700 px-6 py-3 text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveVariant}
            className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black hover:bg-amber-400"
          >
            {editingVariant
              ? "Update Variant"
              : "Add Variant"}
          </button>

        </div>

      </div>

    </div>
  );
}