"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SIZE_UNITS, SIZE_CATEGORY_LABELS, SIZE_CATEGORY_SUGGESTIONS, SIZE_CATEGORY_COMMON_SIZES } from "@/lib/constants/size-units";
import FieldHint from "@/components/admin/common/field-hint";

interface Gender {
  id: string;
  name: string;
}

interface Size {
  id: string;
  genderId: string;
  sizeName: string;
  sizeCode: string;
  sizeUnit: string;
  sizeCategory: string;
  isActive: boolean;
}

interface CategoryRef {
  name: string;
  sizeCategory: string;
}

interface Props {
  mode?: "create" | "edit";
  genders: Gender[];
  categories?: CategoryRef[];
  size?: Size;
}

interface FormValues {
  genderId: string;
  sizeCategory: string;
  sizeName: string;
  sizeCode: string;
  sizeUnit: string;
  isActive: boolean;
}

const SIZE_CATEGORY_LIST = [...SIZE_CATEGORY_SUGGESTIONS];

const CATEGORY_PLACEHOLDERS: Record<string, { name: string; code: string; unit: string; hint: string }> = {
  CLOTHING: { name: "e.g. Medium", code: "e.g. M", unit: "Letter", hint: "Standard letter sizing — XS, S, M, L, XL, XXL" },
  SHOES: { name: "e.g. EU 42", code: "e.g. EU42", unit: "EU", hint: "Numeric sizing — EU/UK/US sizes with CM for length" },
  FREESIZE: { name: "Free Size", code: "FREE", unit: "None", hint: "One size fits all — no gender or size selection needed" },
  SALWAAR: { name: "e.g. Medium", code: "e.g. M", unit: "Inch", hint: "Salwaar/Kurta uses S/M/L/XL with inch measurements" },
  LINGERIE: { name: "e.g. 34B", code: "e.g. 34B", unit: "Inch", hint: "Bra band size (32-42) or S/M/L for shapewear" },
  BALL: { name: "e.g. Size 5", code: "e.g. S5", unit: "Number", hint: "Standard ball sizes — Size 3 (youth) to Size 5 (adult)" },
  BAT: { name: "e.g. Size 3", code: "e.g. BAT3", unit: "Number", hint: "Cricket bat sizes — Size 0 (junior) to Size 6 (senior)" },
  ACCESSORIES: { name: "One Size", code: "OS", unit: "None", hint: "Universal fit — belts, caps, socks, etc." },
};

export default function SizeForm({
  mode = "create",
  genders,
  categories = [],
  size,
}: Props) {
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      genderId: size?.genderId ?? "",
      sizeCategory: (size as { sizeCategory?: string })?.sizeCategory ?? "CLOTHING",
      sizeName: size?.sizeName ?? "",
      sizeCode: size?.sizeCode ?? "",
      sizeUnit: size?.sizeUnit ?? "",
      isActive: size?.isActive ?? true,
    },
  });

  const sizeCategory = watch("sizeCategory");
  const placeholders = CATEGORY_PLACEHOLDERS[sizeCategory] || { name: "e.g. Custom Size", code: "e.g. CUSTOM", unit: "CM", hint: "Custom category — enter size details manually" };
  const suggestedSizes = SIZE_CATEGORY_COMMON_SIZES[sizeCategory] || [];

  const matchedCategories = categories.filter((c) => c.sizeCategory === sizeCategory);

  function selectCategory(cat: string) {
    setValue("sizeCategory", cat);
    setShowSuggestions(false);
    const p = CATEGORY_PLACEHOLDERS[cat];
    if (p && !size) {
      setValue("sizeUnit", p.unit);
    }
  }

  async function onSubmit(data: FormValues) {
    const url =
      mode === "edit"
        ? `/api/admin/sizes/${size?.id}`
        : "/api/admin/sizes";

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
        ? "Size updated"
        : "Size created"
    );

    router.push("/admin/sizes");
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
          Size Details
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Gender <FieldHint text="Select whether this size is for Men, Women, or Unisex." />
            </label>

            <select
              {...register("genderId", { required: true })}
              className={fieldClass}
            >
              <option value="">Select gender</option>
              {genders.map((gender) => (
                <option key={gender.id} value={gender.id}>
                  {gender.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Size Category <FieldHint text="What type of product is this size for? Select from suggestions or type a custom category." />
            </label>

            <input
              {...register("sizeCategory", { required: true })}
              placeholder="e.g. CLOTHING, SHOES, BALL..."
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={fieldClass}
            />

            {showSuggestions && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-600 bg-[#1E293B] shadow-2xl">
                {SIZE_CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={() => selectCategory(cat)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-700 ${
                      sizeCategory === cat ? "text-amber-400" : "text-slate-200"
                    }`}
                  >
                    <span className="font-semibold">{cat}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {SIZE_CATEGORY_LABELS[cat] || ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-1 text-xs text-slate-500">
              {placeholders.hint}
            </p>

            {matchedCategories.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 p-2.5">
                <p className="text-[11px] font-semibold text-amber-400">Used by {matchedCategories.length} categor{matchedCategories.length === 1 ? "y" : "ies"}:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {matchedCategories.map((c) => (
                    <span key={c.name} className="rounded bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {matchedCategories.length === 0 && sizeCategory && (
              <p className="mt-2 text-[11px] text-slate-500">
                No categories currently use this size category.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Size Name
            </label>

            <input
              {...register("sizeName", { required: true })}
              placeholder={placeholders.name}
              list={sizeCategory ? "suggested-size-names" : undefined}
              className={fieldClass}
            />

            {suggestedSizes.length > 0 && (
              <datalist id="suggested-size-names">
                {suggestedSizes.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Size Code <FieldHint text="Short code used internally and on invoices." />
            </label>

            <input
              {...register("sizeCode", { required: true })}
              placeholder={placeholders.code}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Size Unit
            </label>

            <select
              {...register("sizeUnit", { required: true })}
              className={fieldClass}
            >
              <option value="">Select unit</option>
              {SIZE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

        </div>

        <label className="mt-5 flex items-center gap-3">
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

      <div className="flex justify-end">
        <button
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          {mode === "edit"
            ? "Update Size"
            : "Create Size"}
        </button>
      </div>
    </form>
  );
}
