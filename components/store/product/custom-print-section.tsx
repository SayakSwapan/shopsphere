"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import type { CustomPrintData } from "@/types/custom-print";
import { calculatePrintCharge, printChargeInclGst } from "@/lib/print-pricing";

export interface StorePrintType {
  id: string;
  name: string;
  description: string | null;
  pricePerLetter: number | string;
  designFee: number | string;
  minLetters: number;
  maxLetters: number;
  allowName: boolean;
  allowNumber: boolean;
  allowImage: boolean;
}

interface Props {
  enabled: boolean;
  allowName?: boolean;
  allowNumber?: boolean;
  allowImage?: boolean;
  printTypes?: StorePrintType[];
  /** Product GST % — used so the per-letter rate is priced as GST-inclusive. */
  gstPercentage?: number;
  /** Pre-fill the section with an already-saved customisation (e.g. checkout). */
  initialValue?: CustomPrintData | null;
  onChange: (data: CustomPrintData | null) => void;
}

function normalizeNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export default function CustomPrintSection({
  enabled,
  allowName = true,
  allowNumber = true,
  allowImage = true,
  printTypes = [],
  gstPercentage = 0,
  initialValue = null,
  onChange,
}: Props) {
  const [printTypeId, setPrintTypeId] = useState<string>(
    initialValue?.printTypeId ??
      (printTypes.length === 1 ? printTypes[0].id : "")
  );
  const [name, setName] = useState(initialValue?.name ?? "");
  const [number, setNumber] = useState(initialValue?.number ?? "");
  const [imageUrl, setImageUrl] = useState(initialValue?.imageUrl ?? "");
  const [toggled, setToggled] = useState(Boolean(initialValue));
  const [uploading, setUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gstRate = Number(gstPercentage) || 0;
  const printType = printTypes.find((pt) => pt.id === printTypeId) ?? null;

  // Per-style field availability = product flag AND print-style flag.
  const canName = allowName && Boolean(printType?.allowName);
  const canNumber = allowNumber && Boolean(printType?.allowNumber);
  const canImage = allowImage && Boolean(printType?.allowImage);

  const maxLetters = printType?.maxLetters ?? 20;

  const hasCustomization =
    Boolean(printType) &&
    (Boolean(name.trim()) || Boolean(number.trim()) || Boolean(imageUrl));

  const charge = calculatePrintCharge(
    printType
      ? {
          pricePerLetter: printType.pricePerLetter,
          minLetters: printType.minLetters,
          maxLetters: printType.maxLetters,
          designFee: printType.designFee,
        }
      : null,
    { name, number, imageUrl },
    gstRate
  );
  const chargeInclGst = printChargeInclGst(charge, gstRate);

  const emit = useCallback(
    (next: { printTypeId?: string; name?: string; number?: string; imageUrl?: string }) => {
      const selected = printTypes.find((pt) => pt.id === (next.printTypeId ?? printTypeId));
      const effectivePrintType = selected
        ? {
            pricePerLetter: selected.pricePerLetter,
            minLetters: selected.minLetters,
            maxLetters: selected.maxLetters,
            designFee: selected.designFee,
          }
        : null;

      const mergedName = next.name ?? name;
      const mergedNumber = next.number ?? number;
      const mergedImageUrl = next.imageUrl ?? imageUrl;

      const charge = calculatePrintCharge(
        effectivePrintType,
        {
          name: mergedName,
          number: mergedNumber,
          imageUrl: mergedImageUrl,
        },
        gstRate
      );

      if (!charge.hasCustomization) {
        onChange(null);
        return;
      }

      const data: CustomPrintData = {
        printTypeId: selected?.id,
        printTypeName: selected?.name,
        pricePerLetter: charge.pricePerLetter,
        designFee: charge.designFee,
        letterCharge: charge.letterCharge,
        designCharge: charge.designCharge,
        letters: charge.letters,
        billedLetters: charge.billedLetters,
        price: charge.price,
      };
      if (mergedName?.trim()) data.name = mergedName.trim();
      if (mergedNumber?.trim()) data.number = mergedNumber.trim();
      if (mergedImageUrl) data.imageUrl = mergedImageUrl;

      onChange(data);
    },
    [printTypeId, printTypes, name, number, imageUrl, onChange, gstRate]
  );

  useEffect(() => {
    if (!printTypeId) {
      onChange(null);
      return;
    }
    emit({ printTypeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printTypeId]);

  function selectPrintType(id: string) {
    setPrintTypeId(id);
    setDropdownOpen(false);
  }

  function handleNameChange(value: string) {
    const maxName = Math.max(0, maxLetters - number.length);
    const next = value.slice(0, Math.min(20, maxName));
    setName(next);
    emit({ name: next });
  }

  function handleNumberChange(value: string) {
    const digits = normalizeNumber(value);
    const maxNumber = Math.max(0, Math.min(3, maxLetters - name.length));
    const next = digits.slice(0, maxNumber);
    setNumber(next);
    emit({ number: next });
  }

  async function handleFile(file: File | null) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/custom", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setImageUrl(data.url);
      emit({ imageUrl: data.url });
      toast.success("Design image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setImageUrl("");
    emit({ imageUrl: "" });
  }

  function clearCustomization() {
    setPrintTypeId("");
    setName("");
    setNumber("");
    setImageUrl("");
    onChange(null);
  }

  function handleToggle(next: boolean) {
    setToggled(next);
    if (next) {
      if (printTypes.length === 1) setPrintTypeId(printTypes[0].id);
    } else {
      clearCustomization();
    }
  }

  function handleRemove() {
    setToggled(false);
    clearCustomization();
  }

  if (!enabled || printTypes.length === 0) return null;

  const nameMax = Math.min(20, Math.max(0, maxLetters - number.length));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
          }}
        >
          <Pencil size={15} style={{ color: "var(--t-primary)" }} />
        </div>
        <div>
          <p
            className="text-sm font-black uppercase tracking-wider"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
          >
            Custom Printing
          </p>
          <p className="text-[11px] text-text-muted-2">
            Personalise this item — choose a print style, then add name, number and/or design
          </p>
        </div>
      </div>

      {/* Customise Print toggle */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex cursor-pointer items-center gap-3 select-none">
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors"
            style={{
              border: `1.5px solid ${toggled ? "var(--t-primary)" : "var(--t-border-card)"}`,
              background: toggled ? "var(--t-primary)" : "transparent",
            }}
          >
            {toggled && (
              <svg width="10" height="8" viewBox="0 0 8 7" fill="none">
                <path d="M1 3.5L3 6L7 1" stroke="var(--t-bg-page)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={toggled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only"
          />
          <span
            className="text-sm font-bold transition-colors"
            style={{ color: toggled ? "var(--t-text-heading)" : "var(--t-text-muted-1)" }}
          >
            Customise Print
          </span>
        </label>

        {toggled && hasCustomization && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] font-bold uppercase tracking-wide transition hover:opacity-80"
            style={{ color: "var(--t-danger)" }}
          >
            Remove custom print
          </button>
        )}
      </div>

      {toggled && (
        <>
          {/* Print style selector */}
          <div className="relative">
            <label className="mb-1 block text-xs font-bold text-text-heading">
              Print Style
            </label>
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg border border-border-card bg-bg-card-nested px-3 py-2.5 text-left text-sm text-text-heading outline-none transition focus:border-primary"
        >
          <span>
            {printType ? (
              <>
                <span className="font-bold">{printType.name}</span>
                <span className="ml-2 text-xs text-text-muted-2">
                  ₹{Number(printType.pricePerLetter)}/letter
                  {Number(printType.designFee) > 0 && ` + ₹${Number(printType.designFee)} design`}
                </span>
              </>
            ) : (
              <span className="text-text-muted-2">Select a print style</span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`transition ${dropdownOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--t-text-muted-2)" }}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border-card bg-bg-card-nested shadow-2xl">
            {printTypes.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => selectPrintType(pt.id)}
                className={`flex w-full flex-col px-3 py-2.5 text-left text-sm transition hover:bg-bg-card ${
                  pt.id === printTypeId ? "bg-bg-card" : ""
                }`}
              >
                <span
                  className="font-bold"
                  style={{
                    color: pt.id === printTypeId ? "var(--t-primary)" : "var(--t-text-heading)",
                  }}
                >
                  {pt.name}
                </span>
                <span className="text-[11px] text-text-muted-2">
                  ₹{Number(pt.pricePerLetter)} per letter
                  {Number(pt.designFee) > 0 && ` · design ₹${Number(pt.designFee)}`}
                  {pt.description ? ` · ${pt.description}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {printType && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {canName && (
              <div>
                <label className="mb-1 block text-xs font-bold text-text-heading">
                  Name to Print
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={nameMax}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. VIRAT"
                  className="w-full rounded-lg border border-border-card bg-bg-card-nested px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary"
                />
              </div>
            )}

            {canNumber && (
              <div>
                <label className="mb-1 block text-xs font-bold text-text-heading">
                  Number (000–999)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={number}
                  maxLength={3}
                  onChange={(e) => handleNumberChange(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full rounded-lg border border-border-card bg-bg-card-nested px-3 py-2.5 text-sm text-text-heading outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {canImage && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-bold text-text-heading">
                Design Image (font &amp; artwork)
              </label>

              {imageUrl ? (
                <div className="relative mt-1 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Custom design preview"
                    className="h-32 w-32 rounded-lg border border-border-card object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                      aria-label="Replace design image"
                    >
                      <ImagePlus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                      aria-label="Remove design image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-card bg-bg-card-nested px-4 py-6 text-sm font-bold text-text-muted-1 transition hover:border-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImagePlus size={16} style={{ color: "var(--t-primary)" }} />
                      Upload design image
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {imageUrl && (
                <p className="mt-1.5 text-[11px] text-text-muted-2">
                  Image uploaded. Click the pencil to replace it.
                </p>
              )}
            </div>
          )}

          {hasCustomization && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  background: "color-mix(in srgb, var(--t-success) 12%, transparent)",
                  color: "var(--t-success)",
                }}
              >
                <Check size={11} strokeWidth={3} />
                Print:{" "}
                {[
                  printType.name,
                  name.trim() && `"${name.trim()}"`,
                  number.trim() && `No. ${number.trim()}`,
                  imageUrl && "Design image",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>

              {chargeInclGst > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{
                    background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                    color: "var(--t-primary)",
                  }}
                >
                  + ₹{chargeInclGst.toFixed(2)} print
                </span>
              )}
            </div>
          )}
          </>
        )}
        </>
      )}
    </div>
  );
}
