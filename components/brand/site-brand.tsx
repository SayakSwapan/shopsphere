interface SiteBrandProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  accentClassName?: string;
  accentStyle?: React.CSSProperties;
}

function splitSegments(name: string): string[] {
  return name
    .split(/(?=[A-Z])/)
    .flatMap((part) => part.split(/\s+/))
    .filter(Boolean);
}

export default function SiteBrand({
  name,
  className,
  style,
  accentClassName,
  accentStyle,
}: SiteBrandProps) {
  const segments = splitSegments(name);

  if (segments.length <= 1) {
    return (
      <span className={className} style={{ color: "var(--t-primary)", ...style }}>
        {name}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {segments.slice(0, -1).join("")}
      <span
        className={accentClassName}
        style={{ color: "var(--t-primary)", ...accentStyle }}
      >
        {segments[segments.length - 1]}
      </span>
    </span>
  );
}
