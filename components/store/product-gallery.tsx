"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  images: {
    id: string;
    url: string;
  }[];
  productName?: string;
}

export default function ProductGallery({ images, productName }: Props) {
  const [selectedImage, setSelectedImage] = useState(
    images?.[0]?.url || "/placeholder.png"
  );
  // Mobile swipe gallery: which slide is in view (drives the dots + counter).
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);

  if (!images || images.length === 0) {
    return (
      <div
        className="flex h-72 items-center justify-center sm:h-90 md:h-140"
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

  const altText = productName || "Product image";

  // Step (in px) that one swipe moves the track: slide width + the 8px gap.
  const step = () => {
    const first = trackRef.current?.firstElementChild as HTMLElement | null;
    const slideWidth = first?.offsetWidth ?? trackRef.current?.clientWidth ?? 0;
    return Math.max(1, slideWidth + 8);
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.min(
      images.length - 1,
      Math.max(0, Math.round(el.scrollLeft / step()))
    );
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      setActiveIndex(idx);
    }
  };

  const scrollToIndex = (index: number) => {
    trackRef.current?.scrollTo({ left: index * step(), behavior: "smooth" });
  };

  const imageStyle: React.CSSProperties = {
    borderRadius: "var(--t-radius-card)",
    border: "1px solid var(--t-border-card)",
    background: "var(--t-bg-card-nested)",
    overflow: "hidden",
  };

  return (
    <div className="space-y-4">
      {/* MOBILE (< sm): compact swipe gallery — no thumbnail grid */}
      {images.length > 1 ? (
        <div className="sm:hidden">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                className="relative shrink-0 snap-start"
                style={{
                  ...imageStyle,
                  width: "calc(100% - 48px)",
                  boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
                }}
              >
                <Image
                  src={image.url}
                  alt={altText}
                  width={800}
                  height={800}
                  unoptimized
                  className="h-72 w-full object-cover select-none"
                />
              </div>
            ))}
          </div>

          {/* Dots + counter */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: activeIndex === i ? 20 : 6,
                  background:
                    activeIndex === i
                      ? "var(--t-primary)"
                      : "var(--t-text-muted-3)",
                }}
              />
            ))}
            <span
              className="ml-2 text-[11px] font-medium tabular-nums"
              style={{ color: "var(--t-text-muted-2)" }}
            >
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      ) : (
        <div className="sm:hidden">
          <div
            className="relative overflow-hidden"
            style={{
              ...imageStyle,
              boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src={selectedImage}
              alt={altText}
              width={800}
              height={800}
              unoptimized
              className="h-72 w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* TABLET + DESKTOP (≥ sm): existing main image + thumbnail grid */}
      <div className="hidden sm:block">
        <div
          className="group relative overflow-hidden"
          style={{
            borderRadius: "var(--t-radius-card)",
            border: "1px solid var(--t-border-card)",
            background: "var(--t-bg-card-nested)",
            boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
          }}
        >
          <Image
            src={selectedImage}
            alt={altText}
            width={800}
            height={800}
            unoptimized
            className="relative h-72 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-90 md:h-140"
          />
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2 md:grid-cols-5 md:gap-3">
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
                  <Image
                    src={image.url}
                    alt={`${altText} — thumbnail`}
                    width={200}
                    height={200}
                    unoptimized
                    className="h-16 w-full object-cover transition duration-300 hover:scale-105 sm:h-20 md:h-24"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}