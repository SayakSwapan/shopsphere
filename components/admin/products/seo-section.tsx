import { UseFormRegister } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  register: UseFormRegister<ProductFormValues>;
}

export default function SeoSection({
  register,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

      <h2 className="mb-6 text-xl font-bold text-white">
        SEO
      </h2>

      <div className="grid gap-5">

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Meta Title
            <FieldHint text="The browser tab title and the clickable headline in search engine results. Keep it under 60 characters. Include your primary keyword." />
          </label>

          <input
            {...register("metaTitle")}
            placeholder="e.g. Nike Air Jordan 1 Low - Premium Sneakers"
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Meta Description
            <FieldHint text="The short description that appears under the title in search results. Aim for 150-160 characters. Summarise what makes this product unique." />
          </label>

          <textarea
            rows={4}
            {...register("metaDescription")}
            placeholder="e.g. Premium quality sneakers with comfortable cushioning and durable outsole. Perfect for everyday wear."
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] p-4 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Meta Keywords
            <FieldHint text="Comma-separated keywords that describe the product (e.g. 'shoe, nike, sneaker, athletic'). Helps with search engine categorisation." />
          </label>

          <input
            {...register("metaKeywords")}
            placeholder="shoe, nike, sneaker..."
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white outline-none focus:border-amber-500"
          />
        </div>

      </div>

    </div>
  );
}