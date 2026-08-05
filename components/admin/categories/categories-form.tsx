"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Upload, X } from "lucide-react";

import { SIZE_CATEGORY_LABELS, SIZE_CATEGORY_SUGGESTIONS } from "@/lib/constants/size-units";
import FieldHint from "@/components/admin/common/field-hint";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sizeCategory?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface Props {
  mode?: "create" | "edit";
  category?: Category;
}

interface FormValues {
  name: string;
  slug: string;
  sizeCategory: string;
  sortOrder: number;
  isActive: boolean;
}

const CATEGORY_LIST = ["", ...SIZE_CATEGORY_SUGGESTIONS];

const SIZE_CATEGORY_HINTS: Record<string, string> = {
  CLOTHING: "Standard letter sizing (XS-XXL). Products like T-shirts, shirts, jeans, dresses.",
  SHOES: "Numeric sizing with EU/UK/US. For footwear, slippers, sports shoes.",
  FREESIZE: "One size fits all — no variant size selection. For accessories, belts, caps.",
  SALWAAR: "S/M/L/XL with inch measurements. For ethnic wear: salwaar, kurtas, lehengas.",
  LINGERIE: "Band sizes (32-42) or S/M/L. For bras, shapewear, innerwear.",
  BALL: "Size 3/4/5 by circumference. For sports balls: football, basketball, volleyball.",
  BAT: "Size 0-6 by blade length. For cricket bats, hockey sticks.",
  ACCESSORIES: "One size fits most. For watches, sunglasses, wallets.",
};

const SIZE_CATEGORY_HINT_GENERIC = "Products in this category won't have size variants — no size selection needed at checkout.";

export default function CategoryForm({
  mode = "create",
  category,
}: Props) {
  const router = useRouter();
  const [image, setImage] = useState<string>(category?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      sizeCategory: category?.sizeCategory ?? "CLOTHING",
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  const sizeCategory = watch("sizeCategory");
  const hasSizes = sizeCategory !== "" && sizeCategory !== "NONE";

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok || !result.url) throw new Error(result.message || "Upload failed");
      setImage(result.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  }

  function selectCategory(cat: string) {
    setValue("sizeCategory", cat);
    setShowSuggestions(false);
  }

  async function onSubmit(data: FormValues) {
    const url =
      mode === "edit"
        ? `/api/admin/categories/${category?.id}`
        : "/api/admin/categories";

    const method =
      mode === "edit"
        ? "PUT"
        : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        sizeCategory: data.sizeCategory === "NONE" ? "" : data.sizeCategory,
        image: image || null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(
      mode === "edit"
        ? "Category updated"
        : "Category created"
    );

    router.push("/admin/categories");
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
          Category Details
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Category Name
            </label>
            <input
              {...register("name", { required: true })}
              placeholder="Enter category name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Slug
            </label>
            <input
              {...register("slug", { required: true })}
              placeholder="category-slug"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Sort Order
            </label>
            <input
              type="number"
              {...register("sortOrder", { valueAsNumber: true })}
              placeholder="0"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Status
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3">
              <input
                type="checkbox"
                {...register("isActive")}
                className="h-5 w-5 rounded border-slate-700 bg-[#0F172A] accent-amber-500"
              />
              <span className="text-sm text-slate-300">Active</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Image
            </label>

            {image ? (
              <div className="relative inline-flex flex-col items-start gap-2">
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-slate-700 bg-[#0F172A]">
                  <Image src={image} alt="" fill className="object-contain p-2" />
                </div>
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-[#0F172A] transition hover:border-amber-400 hover:bg-slate-800">
                {uploading ? (
                  <span className="text-sm text-slate-400">Uploading...</span>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-500" />
                    <span className="mt-2 text-xs text-slate-500">Upload</span>
                  </>
                )}
                <input hidden type="file" accept="image/*" onChange={uploadImage} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-6 text-xl font-bold text-white">
          Size Configuration
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Define how sizes work for products in this category. This controls what size options are available when creating products.
        </p>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => selectCategory("CLOTHING")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "CLOTHING"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">👕 CLOTHING</div>
              <div className="mt-0.5 text-[10px] opacity-70">S/M/L/XL sizing</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("SHOES")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "SHOES"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">👟 SHOES</div>
              <div className="mt-0.5 text-[10px] opacity-70">EU/UK/US sizing</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("FREESIZE")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "FREESIZE"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">🆓 FREESIZE</div>
              <div className="mt-0.5 text-[10px] opacity-70">One size fits all</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("BALL")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "BALL"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">⚽ BALL</div>
              <div className="mt-0.5 text-[10px] opacity-70">Size 3/4/5</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("BAT")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "BAT"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">🏏 BAT</div>
              <div className="mt-0.5 text-[10px] opacity-70">Size 0-6</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("SALWAAR")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "SALWAAR"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">🥻 SALWAAR</div>
              <div className="mt-0.5 text-[10px] opacity-70">Ethnic wear sizing</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("LINGERIE")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "LINGERIE"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">🩱 LINGERIE</div>
              <div className="mt-0.5 text-[10px] opacity-70">Band/S/M/L sizing</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("ACCESSORIES")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                sizeCategory === "ACCESSORIES"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">👜 ACCESSORIES</div>
              <div className="mt-0.5 text-[10px] opacity-70">One size / no sizes</div>
            </button>

            <button
              type="button"
              onClick={() => selectCategory("NONE")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                !hasSizes
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-600 bg-[#0F172A] text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-base">🚫 NO SIZES</div>
              <div className="mt-0.5 text-[10px] opacity-70">No variants needed</div>
            </button>
          </div>

          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Or type a custom size category <FieldHint text="If none of the standard categories fit, type your own. For example: 'HAT', 'GLOVE', 'SKI_BOOT', etc." />
            </label>

            <input
              {...register("sizeCategory")}
              placeholder="e.g. HAT, GLOVE, SKI_BOOT..."
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={fieldClass}
            />

            {showSuggestions && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-600 bg-[#1E293B] shadow-2xl">
                {CATEGORY_LIST.filter(Boolean).map((cat) => (
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

            {hasSizes && (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-semibold text-amber-400">Size Category: {sizeCategory}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {SIZE_CATEGORY_HINTS[sizeCategory] || "Custom size category — sizes will be filtered by this label when creating products."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Products in this category will only show sizes and charts tagged with &quot;{sizeCategory}&quot;.
                  You can create matching sizes in the{" "}
                  <a href="/admin/sizes/new" className="text-amber-400 underline">Size Manager</a>.
                </p>
              </div>
            )}

            {!hasSizes && (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-semibold text-slate-400">No sizes required</p>
                <p className="mt-1 text-xs text-slate-500">{SIZE_CATEGORY_HINT_GENERIC}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          {mode === "edit"
            ? "Update Category"
            : "Create Category"}
        </button>
      </div>
    </form>
  );
}
