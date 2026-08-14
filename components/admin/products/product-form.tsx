"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import SeoSection from "./seo-section";
import ImageUpload from "./image-upload";
import GeneralSection from "./general-section";
import PricingSection from "./pricing-section";
import InventorySection from "./inventory-section";
import ProductSwitches from "./product-switches";
import CategorySelect from "./category-select";
import VariantSection, {
  VariantType,
} from "./variant-section";
import ReturnPolicySection from "./return-policy-section";
import CustomPrintSection, {
  PrintTypeOption,
} from "./custom-print-section";
import DeliverySection from "./delivery-section";
import RichTextEditor from "@/components/admin/ui/rich-text-editor";
import SizeChartSection from "./size-chart-section";
import ProductGuide from "./product-guide";

import { ProductFormValues } from "@/types/product-form";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  itemCount: number;
  sortOrder: number;
  isActive: boolean;
  sizeCategory: string;
  createdAt: Date;
  updatedAt: Date;
}
interface ProductImage {
  id: string;
  url: string;
}
interface ProductVariant {
  id: string; genderId: string; sizeId: string; sku: string; stock: number; gender: { id: string; name: string; }; size: { id: string; sizeName: string; };
}
export interface ProductData {
  metaDescription: string | null;
  metaTitle: string | null;
  metaKeywords: string | null;
  id: string;
  name: string;
  slug: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  discountType: string;
  discountValue: number;
  salePrice: number;
  finalPrice: number;
  gstPercentage: number;
  weight: number;
  offerStart: string | null;
  offerEnd: string | null;
  stock: number;
  lowStockAlert: number;
  categoryId: string;
  status: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  productimage: ProductImage[];
  productvariant: ProductVariant[];
  isReturnable: boolean;
  isReplaceable: boolean;
  returnDays: number;
  replaceDays?: number;
  sizeChartId?: string;
  customPrintEnabled?: boolean;
  customPrintName?: boolean;
  customPrintNumber?: boolean;
  customPrintImage?: boolean;
  restrictedPincodes?: string[];
  printTypes?: {
    id: string;
    name: string;
  }[];
}

interface Props {
  mode?: "create" | "edit";

  categories: Category[];

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

  sizeCharts?: {
    id: string;
    name: string;
    sizeCategory: string;
    description?: string | null;
    headerRow?: string;
    rows?: string;
    image?: string | null;
  }[];

  printTypes?: PrintTypeOption[];

  product?: ProductData;
}

export default function ProductForm({
  mode = "create",
  categories,
  genders,
  sizes,
  sizeCharts = [],
  printTypes = [],
  product,
}: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",

      sellingPrice: 0,
      costPrice: 0,

      maximumDiscount: 0,

      gstPercentage: 0,

      taxIncluded: false,

      weight: 0,

      stock: 0,

      lowStockAlert: 5,

      categoryId: "",

      status: true,

      isFeatured: false,

      isTrending: false,

      isReturnable: false,

      isReplaceable: false,

      returnDays: 0,

      replaceDays: 0,

      customPrintEnabled: false,
      customPrintName: false,
      customPrintNumber: false,
      customPrintImage: false,
      customPrintTypeIds: [],
      restrictedPincodes: [],

      metaTitle: "",

      metaDescription: "",

      metaKeywords: "",

      mainImage: "",

      images: [],

      variants: [],
      discountType: "PERCENT",

      discountValue: 0,

      salePrice: 0,

      finalPrice: 0,

      offerStart: "",

      offerEnd: "",

      sizeChartId: product?.sizeChartId ?? "",
    },
  });

  const initialImages =
    product?.productimage.map((i) => i.url) ?? [];

  const initialVariants: VariantType[] =
    product?.productvariant.map((v) => ({
      id: v.id,
      genderId: v.genderId,
      genderName: v.gender.name,
      sizeId: v.sizeId,
      sizeName: v.size.sizeName,
      sku: v.sku,
      stock: v.stock,
    })) ?? [];

  const [images, setImages] =
    useState<string[]>(initialImages);

  const [variants, setVariants] =
    useState<VariantType[]>(initialVariants);

  const productStock = Number(watch("stock")) || 0;
  const selectedCategoryId = watch("categoryId");

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );
  const sizeCategory = selectedCategory?.sizeCategory ?? "";

  const filteredSizes = sizeCategory
    ? sizes.filter((s) => s.sizeCategory === sizeCategory)
    : [];

  const filteredSizeCharts = sizeCategory
    ? sizeCharts.filter((sc) => sc.sizeCategory === sizeCategory)
    : [];

  const [submitting, setSubmitting] = useState(false);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/products?take=1000")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setExistingSlugs(
            data.products
              .map((p: { slug: string }) => p.slug)
              .filter((s: string) => s !== product?.slug)
          );
        }
      })
      .catch(() => {});
  }, []);

  const [description, setDescription] =
    useState<string>(product?.description ?? "");

  useEffect(() => {
    if (!product) return;

    reset({
      name: product.name,
      slug: product.slug,
      description: product.description,

      sellingPrice: Number(product.sellingPrice),
      costPrice: Number(product.costPrice),

      discountType: product.discountType,
      discountValue: Number(product.discountValue),
      salePrice: Number(product.salePrice),
      finalPrice: Number(product.finalPrice),
      gstPercentage: Number(product.gstPercentage) || 0,
      weight: Number(product.weight) || 0,
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      metaKeywords: product.metaKeywords ?? "",
      offerStart: product.offerStart
        ? new Date(product.offerStart)
          .toISOString()
          .slice(0, 16)
        : "",

      offerEnd: product.offerEnd
        ? new Date(product.offerEnd)
          .toISOString()
          .slice(0, 16)
        : "",

      isReturnable: product.isReturnable,
      isReplaceable: product.isReplaceable,
      returnDays: product.returnDays,
      replaceDays: (product as { replaceDays?: number }).replaceDays ?? 0,

      customPrintEnabled: (product as { customPrintEnabled?: boolean }).customPrintEnabled ?? false,
      customPrintName: (product as { customPrintName?: boolean }).customPrintName ?? false,
      customPrintNumber: (product as { customPrintNumber?: boolean }).customPrintNumber ?? false,
      customPrintImage: (product as { customPrintImage?: boolean }).customPrintImage ?? false,
      customPrintTypeIds: (product as { printTypes?: { id: string }[] }).printTypes?.map((pt) => pt.id) ?? [],
      restrictedPincodes: (product as { restrictedPincodes?: string[] }).restrictedPincodes ?? [],

      stock: product.stock,
      lowStockAlert: product.lowStockAlert,

      categoryId: product.categoryId,

      status: product.status,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,

      sizeChartId: (product as { sizeChartId?: string }).sizeChartId ?? "",
    });
  }, [product, reset]);

  async function onSubmit(
    data: ProductFormValues
  ) {
    if (submitting) return;

    if (!data.name?.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!data.slug?.trim()) {
      toast.error("Product slug is required.");
      return;
    }

    if (existingSlugs.includes(data.slug.trim())) {
      toast.error("This slug is already taken. Please choose a different one.");
      return;
    }

    if (!description.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Product description is required.");
      return;
    }

    if (!data.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (images.length === 0) {
      toast.error("Upload at least one product image.");
      return;
    }

    setSubmitting(true);

    const payload = {
      ...data,
      images,
      variants,
    };

    const url =
      mode === "edit"
        ? `/api/admin/products/${product?.id}`
        : "/api/admin/products";

    const method =
      mode === "edit"
        ? "PUT"
        : "POST";

    try {
      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || "Failed to save product.");
        return;
      }

      toast.success(
        mode === "edit"
          ? "Product updated"
          : "Product added"
      );

      router.push("/admin/products");

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <ProductGuide mode={mode === "edit" ? "edit" : "create"} defaultOpen />

      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-8 space-y-6">

          <GeneralSection
            register={register}
            watch={watch}
            setValue={setValue}
            existingSlugs={existingSlugs}
          />

          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="mb-2 text-xl font-bold text-white">
              Product Description
            </h2>
            <p className="mb-6 text-xs text-slate-500">
              Describe the product in detail — materials, fit, features, and care instructions. This text appears on the product page.
            </p>

            <RichTextEditor
              value={description}
              onChange={(value) => {
                setDescription(value);
                setValue("description", value);
              }}
            />
          </div>

          <ImageUpload
            images={images}
            setImages={setImages}
          />

          {images.length === 0 && (
            <p className="mt-2 text-sm text-red-400">
              At least one product image is required.
            </p>
          )}

          <VariantSection
            variants={variants}
            setVariants={setVariants}
            genders={genders}
            sizes={filteredSizes}
            sizeCategory={sizeCategory}
            productStock={productStock}
          />

          <SeoSection register={register} />

        </div>

        <div className="col-span-4 space-y-6">

          <CategorySelect
            categories={categories}
            register={register}
          />

          <SizeChartSection
            sizeCharts={filteredSizeCharts}
            register={register}
            watch={watch}
            sizeCategory={sizeCategory}
          />

          <PricingSection
            register={register}
            watch={watch}
            setValue={setValue}
          />

          <InventorySection register={register} />

          <ProductSwitches register={register} />

          <CustomPrintSection
            register={register}
            watch={watch}
            setValue={setValue}
            printTypes={printTypes}
          />

          <DeliverySection watch={watch} setValue={setValue} />

          <ReturnPolicySection
            register={register}
            watch={watch}
          />

        </div>

      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-xl bg-amber-500 px-8 font-bold text-black disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : mode === "edit"
              ? "Update Product"
              : "Save Product"}
        </button>
      </div>
    </form>
  );
}