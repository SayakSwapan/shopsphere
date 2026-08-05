"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";
import { slugify, generateSlugSuggestions } from "@/lib/slug";

interface Props {
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  existingSlugs: string[];
}

export default function GeneralSection({
  register,
  watch,
  setValue,
  existingSlugs,
}: Props) {
  const name = watch("name");
  const currentSlug = watch("slug");
  const [slugFilter, setSlugFilter] = useState("");
  const userChangedSlug = useRef(false);

  const isSlugTaken = currentSlug?.trim()
    ? existingSlugs.includes(currentSlug.trim())
    : false;

  const suggestions = useMemo(() => {
    if (slugFilter.trim()) {
      return generateSlugSuggestions(slugFilter, existingSlugs);
    }
    if (!name?.trim()) {
      return [];
    }
    return generateSlugSuggestions(name, existingSlugs);
  }, [slugFilter, name, existingSlugs]);

  useEffect(() => {
    if (!name?.trim()) {
      return;
    }
    const generated = slugify(name);
    if (!userChangedSlug.current && !currentSlug?.trim()) {
      setValue("slug", generated, { shouldValidate: false });
    }
  }, [name, currentSlug, setValue]);

  function handleSuggestionClick(slug: string) {
    setValue("slug", slug, { shouldValidate: true });
    userChangedSlug.current = false;
    setSlugFilter("");
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    userChangedSlug.current = true;
    setSlugFilter(e.target.value);
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

      <h2 className="mb-6 text-xl font-bold text-white">
        Basic Information
      </h2>

      <div className="space-y-6">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Product Name
            <FieldHint text="The display name customers see on the product page, search results, and cart. Keep it clear and descriptive (e.g. 'Nike Air Jordan 1 Low')." />
          </label>

          <input
            {...register("name")}
            placeholder="Nike Air Jordan 1 Low"
            className="h-12 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white outline-none transition focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Product Slug
            <FieldHint text="The URL-friendly identifier (e.g. 'nike-air-jordan-1-low'). Auto-generated from the name if left empty. Used in the product page URL." />
          </label>

          <input
            {...register("slug")}
            onChange={(e) => {
              register("slug").onChange(e);
              handleSlugChange(e);
            }}
            placeholder="nike-air-jordan-1-low"
            className={`h-12 w-full rounded-xl border bg-[#0F172A] px-4 text-white outline-none transition ${
              isSlugTaken
                ? "border-red-500 focus:border-red-500"
                : "border-slate-700 focus:border-amber-500"
            }`}
          />

          {isSlugTaken && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
              This slug is already taken. Please choose a different one.
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    s === currentSlug
                      ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Weight (grams)
            <FieldHint text="The physical weight of the product in grams. Used to calculate shipping charges. Weigh the actual product if unsure." />
          </label>

          <input
            type="number"
            {...register("weight", { valueAsNumber: true })}
            placeholder="e.g. 500"
            className="h-12 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white outline-none transition focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Used for shipping charge calculation
          </p>
        </div>


      </div>

    </div>
  );
}
