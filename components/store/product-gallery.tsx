"use client";

import { useState } from "react";

interface Props {
  images: {
    id: string;
    url: string;
  }[];
}

export default function ProductGallery({ images }: Props) {
  const [selectedImage, setSelectedImage] = useState(
    images?.[0]?.url || "/placeholder.png"
  );

  if (!images || images.length === 0) {
    return (
      <div
        className="flex h-90 items-center justify-center md:h-140"
        style={{
          borderRadius: "var(--t-radius-card)",
          border: "1px solid var(--t-border-card)",
          background: "var(--t-bg-card-nested)",
        }}
      >
        <span
          className="text-sm uppercase tracking-[0.25em]"
          style={{ color: "var(--t-text-muted-2)" }}
        >
          No Image Available
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="group relative overflow-hidden"
        style={{
          borderRadius: "var(--t-radius-card)",
          border: "1px solid var(--t-border-card)",
          background: "var(--t-bg-card-nested)",
          boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
        }}
      >
        <img
          src={selectedImage}
          alt="Product"
          className="relative h-90 w-full object-cover transition duration-500 group-hover:scale-105 md:h-140"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
          {images.map((image) => {
            const isActive = selectedImage === image.url;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImage(image.url)}
                className="overflow-hidden transition"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  border: `2px solid ${isActive ? "var(--t-primary)" : "var(--t-border-card)"}`,
                  boxShadow: isActive ? "0 8px 30px color-mix(in srgb, var(--t-primary) 15%, transparent)" : "none",
                }}
              >
                <img
                  src={image.url}
                  alt="Thumbnail"
                  className="h-20 w-full object-cover transition duration-300 hover:scale-105 md:h-24"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
