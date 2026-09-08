"use client";

import { useState } from "react";

interface ReelImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function ReelImage({ src, alt, className, fallback }: ReelImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return fallback ?? null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
