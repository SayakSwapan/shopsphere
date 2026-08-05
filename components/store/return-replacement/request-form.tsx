"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/themes/theme-provider";
import {
  MIN_DAMAGE_IMAGES,
  MAX_DAMAGE_IMAGES,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
  isDamageReason,
  RETURN_REASON_OPTIONS,
  REPLACEMENT_REASON_OPTIONS,
  type RequestType,
} from "@/lib/return-replacement";

interface Reason {
  id: string;
  type: string;
  question: string;
  options: string;
  sortOrder: number;
  isActive: boolean;
}

interface OrderItemInfo {
  name: string;
  image?: string;
  variant?: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
  items: OrderItemInfo[];
  type: RequestType;
  allowedTypes: RequestType[];
  onClose: () => void;
}

interface UploadingImage {
  url: string;
}

const FALLBACK_REASONS: Record<RequestType, string[]> = {
  RETURN: RETURN_REASON_OPTIONS,
  REPLACEMENT: REPLACEMENT_REASON_OPTIONS,
};

export default function RequestForm({
  orderId,
  orderNumber,
  items,
  type,
  allowedTypes,
  onClose,
}: Props) {
  const { themeId } = useTheme();

  const [activeType, setActiveType] = useState<RequestType>(type);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [customText, setCustomText] = useState("");
  const [images, setImages] = useState<UploadingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const damage = isDamageReason(selectedOption);
  const requiresImages = damage;
  const isOther = selectedOption === "Other";

  const effectiveTypes: RequestType[] = allowedTypes.includes(activeType)
    ? allowedTypes
    : [...allowedTypes, activeType];

  const unlockedType: RequestType | null =
    damage && allowedTypes.length === 1
      ? allowedTypes[0] === "RETURN"
        ? "REPLACEMENT"
        : "RETURN"
      : null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/return-reasons")
      .then((r) => r.json())
      .then((data: Reason[]) => {
        if (cancelled) return;
        const filtered = data.filter(
          (r) => r.isActive && (r.type === activeType || r.type === "BOTH")
        );
        setReasons(filtered);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeType]);

  const displayOptions =
    reasons.length > 0
      ? reasons.flatMap((reason) => reason.options.split("|").filter(Boolean))
      : FALLBACK_REASONS[activeType];

  function handleOptionSelect(option: string) {
    setSelectedOption(option);
    setError("");
  }

  function switchType(next: RequestType) {
    setActiveType(next);
    setSelectedOption("");
    setError("");
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    const remaining = MAX_DAMAGE_IMAGES - images.length;
    if (files.length > remaining) {
      setError(`You can upload a maximum of ${MAX_DAMAGE_IMAGES} images`);
      return;
    }

    setUploading(true);
    const newImages: UploadingImage[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Only JPG, PNG or WebP images are allowed");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Each image must be ${MAX_IMAGE_SIZE_MB}MB or smaller`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/returns/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Upload failed");
          continue;
        }
        newImages.push({ url: data.url });
      } catch {
        setError("Upload failed. Please try again.");
      }
    }

    setImages((prev) => [...prev, ...newImages].slice(0, MAX_DAMAGE_IMAGES));
    setUploading(false);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!selectedOption) {
      setError("Please select a reason.");
      return;
    }

    if (requiresImages) {
      if (images.length < MIN_DAMAGE_IMAGES) {
        setError(`Please upload at least ${MIN_DAMAGE_IMAGES} images as proof.`);
        return;
      }
      if (images.length > MAX_DAMAGE_IMAGES) {
        setError(`You can upload a maximum of ${MAX_DAMAGE_IMAGES} images.`);
        return;
      }
    }

    if (isOther && !customText.trim()) {
      setError("Please describe your issue in detail.");
      return;
    }

    setError("");
    setLoading(true);

    const body = {
      orderId,
      reason: selectedOption,
      reasonOption: selectedOption,
      customText: customText.trim() || null,
      description: customText.trim() || null,
      images: images.map((img) => img.url),
    };

    try {
      const endpoint = activeType === "RETURN" ? "/api/returns" : "/api/replacements";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to submit");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      >
        <div
          className="border p-8 max-w-md w-full text-center"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--t-success) 12%, transparent)" }}
          >
            <svg className="h-8 w-8" style={{ color: "var(--t-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--t-text-heading)" }}>Request Submitted</h3>
          <p className="text-sm mb-6" style={{ color: "var(--t-text-muted-1)" }}>
            Your {activeType.toLowerCase()} request has been submitted. Our team will review it shortly.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 font-bold transition hover:opacity-90"
            style={{
              borderRadius: "var(--t-radius-button)",
              background: "var(--t-primary)",
              color: "var(--t-bg-page)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const optionBorderRadius = themeId === "fashion" ? "999px" : "var(--t-radius-badge)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="border p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: "var(--t-radius-card)",
          borderColor: "var(--t-border-card)",
          background: "var(--t-bg-card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: "var(--t-text-heading)" }}>
            {activeType === "RETURN" ? "Return" : "Replacement"} Request
          </h3>
          <button
            onClick={onClose}
            className="text-xl transition hover:opacity-70"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            ✕
          </button>
        </div>

        {/* Order summary */}
        <div
          className="mb-4 border p-4 text-sm"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card-nested)",
          }}
        >
          <p className="font-bold" style={{ color: "var(--t-text-heading)" }}>Order {orderNumber}</p>
          <div className="mt-2 space-y-1">
            {items.map((item, idx) => (
              <p key={idx} className="text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                {item.name}
                {item.variant ? ` · ${item.variant}` : ""}
              </p>
            ))}
          </div>
        </div>

        {/* Type switch */}
        {effectiveTypes.length > 1 && (
          <div className="mb-4 flex gap-2">
            {(effectiveTypes.includes("RETURN") ? ["RETURN", "REPLACEMENT"] : ["REPLACEMENT"]).map((t) =>
              effectiveTypes.includes(t as RequestType) ? (
                <button
                  key={t}
                  onClick={() => switchType(t as RequestType)}
                  className="flex-1 px-4 py-2 text-sm font-bold transition"
                  style={{
                    borderRadius: "var(--t-radius-button)",
                    background:
                      activeType === t ? "var(--t-primary)" : "var(--t-bg-card-alt)",
                    color: activeType === t ? "var(--t-bg-page)" : "var(--t-text-muted-2)",
                  }}
                >
                  {t === "RETURN" ? "Request Return" : "Request Replacement"}
                </button>
              ) : null
            )}
          </div>
        )}
        {unlockedType && damage && (
          <div
            className="mb-4 rounded-xl p-3 text-xs"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-primary) 25%, transparent)",
            }}
          >
            <p style={{ color: "var(--t-text-muted-1)" }}>
              Because you selected a damage-related reason, you can also request a{" "}
              <button
                onClick={() => switchType(unlockedType)}
                className="font-bold underline"
                style={{ color: "var(--t-primary)" }}
              >
                {unlockedType === "RETURN" ? "Return" : "Replacement"}
              </button>{" "}
              instead.
            </p>
          </div>
        )}

        {/* Reason options */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--t-text-muted-2)" }}>
            Reason for {activeType.toLowerCase()}
          </label>
          <div className="flex flex-wrap gap-2">
            {displayOptions.map((opt) => {
              const isActive = selectedOption === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    borderRadius: optionBorderRadius,
                    background: isActive ? "var(--t-primary)" : "var(--t-bg-card-alt)",
                    color: isActive ? "var(--t-bg-page)" : "var(--t-text-muted-2)",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--t-text-muted-2)" }}>
            Description {isOther && <span style={{ color: "var(--t-danger)" }}>*</span>}
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-sm outline-none resize-none"
            style={{
              borderRadius: "var(--t-radius-input)",
              border: "1px solid var(--t-border-card)",
              background: "var(--t-bg-card-nested)",
              color: "var(--t-text-heading)",
            }}
            placeholder={isOther ? "Please describe your issue in detail..." : "Describe your issue in detail if needed..."}
          />
        </div>

        {/* Image upload */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--t-text-muted-2)" }}>
            {requiresImages ? "Damage Proof Images" : "Images (optional)"}
            {requiresImages && <span style={{ color: "var(--t-danger)" }}> *</span>}
          </label>
          {requiresImages && (
            <p className="mb-2 text-xs" style={{ color: "var(--t-text-muted-1)" }}>
              Please upload {MIN_DAMAGE_IMAGES}-{MAX_DAMAGE_IMAGES} clear photos of the damage.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={img.url} className="relative h-20 w-20 overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--t-border-card)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="Uploaded proof" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white transition hover:bg-black"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < MAX_DAMAGE_IMAGES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs font-semibold transition hover:opacity-70 disabled:opacity-40"
                style={{ borderColor: "var(--t-border-card)", color: "var(--t-text-muted-2)" }}
              >
                {uploading ? "..." : "+ Add"}
                <span className="text-[10px]">JPG/PNG</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {!requiresImages && (
            <p className="mt-2 text-xs" style={{ color: "var(--t-text-muted-1)" }}>
              Max {MAX_DAMAGE_IMAGES} images · {MAX_IMAGE_SIZE_MB}MB each · JPG/PNG/WebP
            </p>
          )}
        </div>

        {error && <p className="mb-3 text-sm" style={{ color: "var(--t-danger)" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="w-full px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{
            borderRadius: "var(--t-radius-button)",
            background: "var(--t-primary)",
            color: "var(--t-bg-page)",
          }}
        >
          {loading ? "Submitting..." : uploading ? "Uploading..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}
