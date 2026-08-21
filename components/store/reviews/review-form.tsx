"use client";

import { useRef, useState } from "react";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
  initialRating?: number;
  initialComment?: string;
  initialImages?: string[];
  onSubmitted?: () => void;
}

export default function ReviewForm({
  productId,
  initialRating = 0,
  initialComment = "",
  initialImages = [],
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const room = 5 - images.length;

    if (room <= 0) {
      toast.error("You can attach up to 5 photos.");
      return;
    }

    setUploading(true);

    try {
      const picked = Array.from(files).slice(0, room);
      const uploaded: string[] = [];

      for (const file of picked) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/custom", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.message || "Image upload failed.");
          continue;
        }

        if (data?.url) {
          uploaded.push(data.url);
        }
      }

      if (uploaded.length) {
        setImages((prev) => [...prev, ...uploaded]);
      }
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating < 1) {
      toast.error("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a short comment.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Could not submit review.");
        return;
      }

      toast.success(
        data.updated ? "Your review was updated." : "Thanks for your review!"
      );

      onSubmitted?.();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6"
      style={{
        borderRadius: "var(--t-radius-card)",
        border: "1px solid var(--t-border-card)",
        background: "var(--t-bg-card)",
      }}
    >
      <p
        className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
      >
        Write a review
      </p>

      {/* STAR PICKER */}
      <div className="mb-5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || rating) >= n;

          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1.5 transition-transform hover:scale-110"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                size={30}
                color={filled ? "var(--t-accent)" : "var(--t-text-muted-3)"}
                fill={filled ? "var(--t-accent)" : "transparent"}
              />
            </button>
          );
        })}

        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold" style={{ color: "var(--t-text-heading)" }}>
            {rating}/5
          </span>
        )}
      </div>

      {/* COMMENT */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Share your experience with this product..."
        className="w-full resize-none p-4 text-sm outline-none"
        style={{
          borderRadius: "var(--t-radius-input)",
          border: "1px solid var(--t-border-card)",
          background: "var(--t-bg-card-nested)",
          color: "var(--t-text-body)",
        }}
      />

      {/* IMAGE UPLOAD */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {images.map((url) => (
          <div
            key={url}
            className="relative h-20 w-20 overflow-hidden"
            style={{
              borderRadius: "var(--t-radius-card)",
              border: "1px solid var(--t-border-card)",
            }}
          >
            <img src={url} alt="review" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute right-1 top-1 rounded-full p-2"
              style={{ background: "rgba(0,0,0,0.7)", color: "var(--t-bg-page)" }}
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 transition"
            style={{
              borderRadius: "var(--t-radius-card)",
              border: "1px dashed var(--t-border-card)",
              color: "var(--t-text-muted-1)",
            }}
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={20} />
                <span className="text-[10px]">Photo</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="mt-6 flex items-center justify-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-[0.15em] transition disabled:opacity-60"
        style={{
          background: "var(--t-primary)",
          color: "var(--t-bg-page)",
          borderRadius: "var(--t-radius-button)",
          fontFamily: "var(--t-font-heading)",
        }}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
