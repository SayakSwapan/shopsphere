"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import WishlistButton from "@/components/store/wishlist-button";
import ShareIconButton from "@/components/store/share-icon-button";
import { optimizedImageUrl } from "@/lib/cloudinary-image";

interface Props {
  images: {
    id: string;
    url: string;
  }[];
  productName?: string;
  productId: string;
}

export default function ProductGallery({
  images,
  productName,
  productId,
}: Props) {
  const [selectedImage, setSelectedImage] = useState(
    images?.[0]?.url || "/placeholder.png",
  );
  // Mobile swipe gallery: which slide is in view (drives the dots + counter).
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);

  // ── Zoom viewer state ────────────────────────────────────────────────
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [zoomAlt, setZoomAlt] = useState("Product image");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; baseScale: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Lock body scroll and autofocus overlay when zoom opens
  useEffect(() => {
    if (!zoomSrc) return;
    overlayRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoomSrc]);

  const openZoom = (src: string, alt?: string) => {
    setZoomSrc(src);
    setZoomAlt(alt || "Product image");
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches))
      pointersRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (e.touches.length === 2) {
      const [a, b] = Array.from(e.touches);
      pinchRef.current = {
        dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        baseScale: scale,
      };
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        setScale((s) => (s >= 1.5 ? 1 : 2));
        setOffset({ x: 0, y: 0 });
        pinchRef.current = null;
        pointersRef.current.clear();
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = Array.from(e.touches);
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const ratio = dist / pinchRef.current.dist;
      setScale(Math.min(4, Math.max(1, pinchRef.current.baseScale * ratio)));
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      const prev = pointersRef.current.get(t.identifier);
      if (prev) {
        setOffset((o) => ({
          x: o.x + (t.clientX - prev.x),
          y: o.y + (t.clientY - prev.y),
        }));
        pointersRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches))
      pointersRef.current.delete(t.identifier);
    if (e.touches.length < 2) pinchRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) =>
      Math.min(4, Math.max(1, s + (e.deltaY > 0 ? -0.12 : 0.12))),
    );
  };

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
      Math.max(0, Math.round(el.scrollLeft / step())),
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
          {/* Relative wrapper so the wishlist/share overlay stays pinned over
              the image area while the carousel swipes underneath. */}
          <div className="relative">
            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative shrink-0 snap-start cursor-pointer"
                  style={{
                    ...imageStyle,
                    width: "100%",
                    boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
                  }}
                  onClick={() => openZoom(image.url, altText)}
                >
                  <Image
                    src={optimizedImageUrl(image.url, 900)}
                    alt={altText}
                    width={800}
                    height={800}
                    unoptimized
                    className="w-full object-contain select-none"
                    style={{ aspectRatio: "auto" }}
                  />
                </div>
              ))}
            </div>

            {/* Wishlist + Share — bottom-right of the image for visibility */}
            <div
              className="absolute bottom-3 right-3 z-10 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <WishlistButton productId={productId} />
              <ShareIconButton productName={productName} />
            </div>
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
            className="relative overflow-hidden cursor-pointer"
            style={{
              ...imageStyle,
              boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
            }}
            onClick={() => openZoom(selectedImage, altText)}
          >
            <Image
              src={optimizedImageUrl(selectedImage, 900)}
              alt={altText}
              width={800}
              height={800}
              unoptimized
              className="w-full object-contain select-none"
              style={{ aspectRatio: "auto" }}
            />
            <div
              className="absolute bottom-3 right-3 z-10 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <WishlistButton productId={productId} />
              <ShareIconButton productName={productName} />
            </div>
          </div>
        </div>
      )}

      {/* TABLET + DESKTOP (≥ sm): existing main image + thumbnail grid */}
      <div className="hidden sm:block">
        <div
          className="group relative overflow-hidden cursor-zoom-in"
          style={{
            borderRadius: "var(--t-radius-card)",
            border: "1px solid var(--t-border-card)",
            background: "var(--t-bg-card-nested)",
            boxShadow: "0 35px 120px rgba(0,0,0,0.12)",
          }}
          onClick={() => openZoom(selectedImage, altText)}
        >
          <Image
            src={optimizedImageUrl(selectedImage, 900)}
            alt={altText}
            width={800}
            height={800}
            unoptimized
            className="relative w-full object-contain select-none"
            style={{ aspectRatio: "auto" }}
          />
          {/* Wishlist + Share — bottom-right of the image */}
          <div
            className="absolute bottom-3 right-3 z-10 flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <WishlistButton productId={productId} />
            <ShareIconButton productName={productName} />
          </div>
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
                    boxShadow: isActive
                      ? "0 8px 30px color-mix(in srgb, var(--t-primary) 15%, transparent)"
                      : "none",
                  }}
                >
                  <Image
                    src={optimizedImageUrl(image.url, 200)}
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

      {/* ── Fullscreen zoom viewer ───────────────────────────────────── */}
      {zoomSrc && (
        <div
          ref={overlayRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom viewer"
          className="fixed inset-0 z-[90] flex flex-col bg-black outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") setZoomSrc(null);
          }}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <button
              type="button"
              onClick={() => setZoomSrc(null)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <X size={16} /> Close
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setScale((s) => Math.max(1, s - 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-bold"
              >
                −
              </button>
              <span className="min-w-[3.4rem] text-center text-xs font-semibold tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setScale((s) => Math.min(4, s + 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div
            className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              src={zoomSrc}
              alt={zoomAlt}
              draggable={false}
              className="block max-h-full max-w-full select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: "transform 0.15s ease-out",
              }}
            />
          </div>

          <p className="shrink-0 px-4 py-3 text-center text-[11px] text-white/50">
            Tap image to open · pinch or scroll to zoom · drag to pan
          </p>
        </div>
      )}
    </div>
  );
}
