"use client";

import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { useEffect } from "react";
import { ProductFormValues } from "@/types/product-form";
import { getDiscountedPrice, getPriceBreakdown, isFlatDiscount } from "@/lib/pricing";
import { calculateOfflineMinimumPrice } from "@/lib/pricing/offline";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
}

function inr(value: number): string {
  return `₹ ${value.toFixed(2)}`;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default function PricingSection({
  register,
  watch,
  setValue,
}: Props) {
  const sellingPrice = Number(watch("sellingPrice")) || 0;
  const costPrice = Number(watch("costPrice")) || 0;
  const lastSellingPrice = Number(watch("lastSellingPrice")) || 0;

  const discountType = watch("discountType");

  const discountValue =
    Number(watch("discountValue")) || 0;

  const gstPercentage =
    Number(watch("gstPercentage")) || 0;

  const breakdown = getPriceBreakdown({
    sellingPrice,
    costPrice,
    gstRate: gstPercentage,
    discountType,
    discountValue,
  });

  const offlineMinimum = calculateOfflineMinimumPrice({
    priceInclGst: lastSellingPrice,
    costPrice,
    gstRate: gstPercentage,
  });

  const discountLabel = isFlatDiscount(discountType)
    ? `Flat ₹${discountValue.toFixed(2)}`
    : `${discountValue}%`;

  // Persist the pre-GST discounted base so the storefront (which adds GST on
  // top) reproduces the exact GST-inclusive price shown below.
  useEffect(() => {
    const { salePriceBase } = getDiscountedPrice(
      sellingPrice,
      gstPercentage,
      discountType,
      discountValue
    );
    setValue("salePrice", salePriceBase);
    setValue("finalPrice", salePriceBase);
  }, [sellingPrice, discountType, discountValue, gstPercentage, setValue]);

  // The admin enters the GST-INCLUSIVE minimum offline selling price directly
  // (`lastSellingPrice`). Derive and persist the implied profit % from it so
  // both values stay consistent for reports / offline validation.
  useEffect(() => {
    const offline = calculateOfflineMinimumPrice({
      priceInclGst: lastSellingPrice,
      costPrice,
      gstRate: gstPercentage,
    });
    setValue("lastSellingProfitPercentage", offline.profitPercent);
  }, [lastSellingPrice, costPrice, gstPercentage, setValue]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

      <h2 className="mb-6 text-xl font-bold text-white">
        Pricing
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>

          <label className="mb-2 block text-white">
            Selling Price <FieldHint text="The listed MRP / base price before GST and before any discount. GST is applied on top of this." />
          </label>

          <input
            type="number"
            {...register("sellingPrice", {
              valueAsNumber: true,
            })}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

        <div>

          <label className="mb-2 block text-white">
            Cost Price
            <FieldHint text="Your purchase/acquisition cost per unit. Used in balance sheet COGS (Cost of Goods Sold)." />
          </label>

          <input
            type="number"
            {...register("costPrice", {
              valueAsNumber: true,
            })}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

        <div>

          <label className="mb-2 block text-white">
            Discount Type <FieldHint text="PERCENT = percentage off the final price (incl. GST). FIXED = flat amount off (e.g. ₹500)." />
          </label>

          <select
            {...register("discountType")}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          >
            <option value="PERCENT">
              Percentage
            </option>

            <option value="FIXED">
              Fixed Amount
            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block text-white">
            Discount Value <FieldHint text="The discount amount. If type is PERCENT, enter a number like 20 for 20% off. If FIXED, enter the flat amount." />
          </label>

          <input
            type="number"
            {...register("discountValue", {
              valueAsNumber: true,
            })}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

        <div>

          <label className="mb-2 block text-white">
            GST % <FieldHint text="Goods & Services Tax percentage. Common rates: 0%, 5%, 12%, 18%. GST is included in the price customers see." />
          </label>

          <input
            type="number"
            step="0.01"
            {...register("gstPercentage", {
              valueAsNumber: true,
            })}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

        <div>

          <label className="mb-2 block text-white">
            Offer Start
            <FieldHint text="The date and time when the discount offer becomes active. Leave empty for the offer to start immediately." />
          </label>

          <input
            type="datetime-local"
            {...register("offerStart")}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

        <div>

          <label className="mb-2 block text-white">
            Offer End
            <FieldHint text="The date and time when the discount offer expires. After this time, the product reverts to the original selling price." />
          </label>

          <input
            type="datetime-local"
            {...register("offerEnd")}
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
          />

        </div>

      </div>

      {/* ── Offline / POS minimum selling price ── */}
      <div className="mt-6 rounded-xl border border-indigo-700/40 bg-indigo-950/20 p-5">

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Offline Sale Pricing
          </h3>
          <span className="rounded bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-300">
            POS minimum price
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          <div>
            <label className="mb-2 block text-white">
              Minimum Selling Price (₹, incl. GST)
              <FieldHint text="The lowest GST-INCLUSIVE amount this product can be sold for at the offline counter. Enter the price the customer would pay — GST is included in it. Costs and profit are derived from this automatically." />
            </label>

            <input
              type="number"
              step="0.01"
              min={0}
              {...register("lastSellingPrice", { valueAsNumber: true })}
              className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
              placeholder="e.g. 999.00"
            />
          </div>

          <div className="rounded-xl bg-[#0F172A] p-4 sm:self-end">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Implied Last-Selling Margin
            </div>
            <div className={`mt-1 text-2xl font-black ${offlineMinimum.profitPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {offlineMinimum.profitPercent}%
            </div>
            {costPrice <= 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                Enter a cost price to see the implied margin.
              </p>
            )}
          </div>

        </div>

        {lastSellingPrice > 0 && costPrice > 0 && (
          <div className="mt-4 space-y-1.5 rounded-lg bg-[#0F172A] p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum (incl. GST)</span>
              <span className="font-bold text-white">{inr(offlineMinimum.priceInclGst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GST ({gstPercentage}%) included</span>
              <span className="text-slate-300">{inr(offlineMinimum.gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Taxable Base (pre-GST)</span>
              <span className="font-bold text-indigo-300">{inr(offlineMinimum.base)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-300">Minimum Profit per unit</span>
              <span className="font-bold text-emerald-400">
                {inr(round2(offlineMinimum.base - costPrice))} ({offlineMinimum.profitPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-indigo-300/80">
              The offline counter cannot sell this product below this GST-inclusive price.
            </p>
          </div>
        )}

      </div>

      <div className="mt-6 space-y-3 rounded-xl bg-[#0F172A] p-5">

        <div className="flex justify-between">

          <span className="text-slate-300">
            Selling Price (MRP)
          </span>

          <span className="font-bold text-white">
            {inr(breakdown.sellingPrice)}
          </span>

        </div>

        <div className="flex justify-between text-sm">

          <span className="text-slate-400">
            GST ({breakdown.gstRate}%)
          </span>

          <span className="text-slate-300">
            {inr(breakdown.gstOnSellingPrice)}
          </span>

        </div>

        <div className="flex justify-between text-sm">

          <span className="text-slate-300">
            Final Price (incl. GST)
          </span>

          <span className="font-bold text-white">
            {inr(breakdown.finalPriceInclGst)}
          </span>

        </div>

        {breakdown.hasDiscount ? (
          <>
            <div className="flex justify-between text-sm">

              <span className="text-slate-400">
                Discount ({discountLabel})
              </span>

              <span className="font-bold text-emerald-400">
                − {inr(breakdown.discountAmount)}
              </span>

            </div>

            <div className="flex justify-between border-t border-slate-700 pt-3">

              <span className="text-slate-300">
                Discounted Final Price (incl. GST)
              </span>

              <span className="text-2xl font-bold text-amber-400">
                {inr(breakdown.discountedPriceInclGst)}
              </span>

            </div>

            <p className="text-[11px] text-slate-500">
              This is the GST-inclusive price customers pay — shown on the
              storefront with the MRP struck through.
            </p>
          </>
        ) : (
          <div className="flex justify-between border-t border-slate-700 pt-3">

            <span className="text-slate-300">
              Customer Price (incl. GST)
            </span>

            <span className="text-2xl font-bold text-amber-400">
              {inr(breakdown.discountedPriceInclGst)}
            </span>

          </div>
        )}

        <div className="flex justify-between border-t border-slate-700 pt-3 text-sm">

          <span className="text-slate-400">
            Taxable Sale Price (pre-GST)
          </span>

          <span className="text-slate-300">
            {inr(breakdown.salePriceBase)}
          </span>

        </div>

        {costPrice > 0 && (
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="text-slate-300">
              Profit Margin (after discount)
            </span>
            <span className={`text-lg font-bold ${breakdown.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {inr(breakdown.profit)} ({breakdown.profitPercent}%)
            </span>
          </div>
        )}

      </div>

    </div>
  );
}
