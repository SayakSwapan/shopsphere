import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
} from "lucide-react";

export interface ProductGuideStep {
  title: string;
  detail: string;
}

interface ProductGuideProps {
  mode: "view" | "edit" | "create";
  defaultOpen?: boolean;
}

const GUIDE_CONTENT: Record<
  "view" | "edit" | "create",
  { title: string; subtitle: string; steps: ProductGuideStep[]; tips: string[]; warnings: string[] }
> = {
  view: {
    title: "Product Guide",
    subtitle: "Everything on this page and how to use it.",
    steps: [
      {
        title: "Review the product at a glance",
        detail:
          "The header shows the product name, slug, and key badges (Active, Featured, Trending) plus a stock health indicator. Below it you'll find images, product info, pricing, inventory, returns, SEO, and description.",
      },
      {
        title: "Use Quick Actions",
        detail:
          "Toggle Active/Inactive, Featured, and Trending without leaving the page. Changes apply instantly. 'View Store' opens the live product page and 'Edit' takes you to the edit form.",
      },
      {
        title: "Check inventory sync",
        detail:
          "Base stock should equal the sum of all variant stock. If a warning appears, update stock from the edit page so the numbers stay in sync.",
      },
      {
        title: "Audit stock movements",
        detail:
          "Recent stock movements (IN / OUT / ADJUSTMENT) are recorded automatically. Use this trail to see how inventory changed over time.",
      },
      {
        title: "Review pricing & margins",
        detail:
          "Confirm selling price, cost price, profit margin, GST, and the final price customers actually pay. A negative margin means you're selling below cost.",
      },
      {
        title: "Edit when needed",
        detail:
          "Click 'Edit' in Quick Actions to update any field. Products with existing orders cannot be deleted — mark them Inactive instead.",
      },
    ],
    tips: [
      "A product is only visible to customers when its status is Active.",
      "Feature 4–8 products so they appear on the homepage.",
      "Products with more than 100 views or 50 sales are auto-marked as Trending.",
    ],
    warnings: [
      "Selling price is the MRP. The final price (after discounts and GST) is what appears on the storefront.",
      "If base stock doesn't match variant stock, orders may face stockout issues.",
    ],
  },
  edit: {
    title: "Product Guide",
    subtitle: "How to edit this product correctly.",
    steps: [
      {
        title: "General details",
        detail:
          "Edit the product name, slug, and description. The slug is used in the product URL — changing it will change the product page link, so keep it short and keyword-friendly.",
      },
      {
        title: "Pricing & offers",
        detail:
          "Selling price is the MRP base. GST is added on top to get the Final Price (incl. GST). Set discountType (PERCENT or FLAT) and discountValue — the discount is deducted from the GST-inclusive final price, e.g. Final ₹100 with ₹10 (or 10%) off → ₹90 incl. GST. The discounted final price is what customers see on the storefront.",
      },
      {
        title: "Category & size chart",
        detail:
          "Pick the category — it filters which sizes and size charts are available. Link a size chart so customers can check their measurements on the product page.",
      },
      {
        title: "Images",
        detail:
          "Upload at least one image (minimum 800×800 px recommended). The first image is used as the product thumbnail across the store.",
      },
      {
        title: "Inventory",
        detail:
          "Base stock is the overall quantity. Add variants per gender and size with their own SKUs and stock. Keep base stock equal to the total variant stock.",
      },
      {
        title: "Visibility & features",
        detail:
          "Status controls storefront visibility. Feature 4–8 products for the homepage and mark Trending to surface them in the trending carousel.",
      },
      {
        title: "Return policy & custom print",
        detail:
          "Enable returnable/replaceable only if your policy allows it and set realistic windows. Enable custom print if the product supports personalisation.",
      },
      {
        title: "SEO metadata",
        detail:
          "Fill meta title, description, and keywords — these power search engines and social sharing.",
      },
      {
        title: "Save & verify",
        detail:
          "Click 'Update Product'. Then open the storefront page to confirm the images, pricing, and stock look correct.",
      },
    ],
    tips: [
      "Slugs must be unique — a duplicate slug is rejected on save.",
      "Upload clear product images (min 800×800 px) to improve conversion.",
      "Use the offer window to schedule discounts that only apply while the offer is live.",
      "After editing stock, verify the numbers match between base stock and variants.",
    ],
    warnings: [
      "A negative margin means you're selling below cost price.",
      "Changing the slug changes the product URL — update any links that point to it.",
      "Products with existing orders cannot be deleted. Mark them Inactive instead.",
    ],
  },
  create: {
    title: "Product Guide",
    subtitle: "How to create a product correctly.",
    steps: [
      {
        title: "Prepare the catalog foundations",
        detail:
          "Before adding a product, make sure the category, gender, sizes, and size chart already exist under Products & Catalog. The product references these.",
      },
      {
        title: "General details",
        detail:
          "Enter the product name, slug (auto-suggested), and a detailed description with materials, fit, and care instructions. This text appears on the product page.",
      },
      {
        title: "Pricing & offers",
        detail:
          "Selling price is the MRP base. GST is added on top to get the Final Price (incl. GST). Set discountType (PERCENT or FLAT) and discountValue — sale and final price update accordingly; the discount is deducted from the GST-inclusive final price. Optionally schedule an offer window.",
      },
      {
        title: "Category & size chart",
        detail:
          "Select the category — it filters which sizes and size charts are available. Link a size chart so customers can check measurements.",
      },
      {
        title: "Images",
        detail:
          "Upload at least one image (minimum 800×800 px recommended). The first image becomes the product thumbnail.",
      },
      {
        title: "Inventory & variants",
        detail:
          "Set the base stock and add variants per gender and size with SKUs and stock. Keep base stock equal to the total variant stock.",
      },
      {
        title: "Return policy & custom print",
        detail:
          "Enable returnable/replaceable only if your policy allows it. Enable custom print if the product supports personalisation.",
      },
      {
        title: "SEO metadata",
        detail:
          "Fill meta title, description, and keywords — these power search engines and social sharing.",
      },
      {
        title: "Save & verify",
        detail:
          "Click 'Save Product'. The product appears on the storefront immediately — open it to verify images, pricing, and stock.",
      },
    ],
    tips: [
      "Slugs must be unique — a duplicate slug is rejected on save.",
      "Upload clear product images (min 800×800 px) to improve conversion.",
      "Set a low stock alert so the dashboard highlights items that need reordering.",
      "Feature 4–8 products to showcase them on the homepage.",
    ],
    warnings: [
      "A negative margin means you're selling below cost price.",
      "At least one image is required before the product can be saved.",
      "Keep the base stock in sync with the total variant stock.",
    ],
  },
};

export default function ProductGuide({ mode, defaultOpen = false }: ProductGuideProps) {
  const content = GUIDE_CONTENT[mode];

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-slate-700/70 bg-[#111827]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <BookOpen size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500/80">
              Product Guide
            </p>
            <h2 className="text-lg font-bold text-white">{content.title}</h2>
            <p className="text-xs text-slate-500">{content.subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className="shrink-0 text-slate-500 transition-transform duration-300 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-slate-800 p-5">
        <ol className="space-y-0">
          {content.steps.map((step, idx) => (
            <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
              {idx < content.steps.length - 1 && (
                <span
                  className="absolute left-[15px] top-8 h-full w-0.5 bg-slate-800"
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
                {idx + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {content.tips.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Lightbulb size={14} /> Pro Tips
            </p>
            <ul className="space-y-1.5">
              {content.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.warnings.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <AlertTriangle size={14} /> Watch Out
            </p>
            <ul className="space-y-1.5">
              {content.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
