interface SiteLogoProps {
  src?: string | null;
  alt?: string;
  height?: number;
  /** When set, overrides the height-driven auto width with an exact width. */
  width?: number;
  className?: string;
}

/**
 * Renders the uploaded transparent site logo. Designed to be used inside a
 * Link/brand lockup: while `height` controls the visual size, `maxWidth` keeps
 * very wide lockups from overflowing and `objectFit: contain` preserves
 * transparency on any background.
 */
export default function SiteLogo({
  src,
  alt,
  height = 40,
  width,
  className,
}: SiteLogoProps) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      draggable={false}
      style={{
        display: "block",
        height,
        width: width ?? "auto",
        maxWidth: "100%",
        objectFit: "contain",
      }}
    />
  );
}