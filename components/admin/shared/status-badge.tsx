interface Props {
  active: boolean;
}

export default function StatusBadge({
  active,
}: Props) {
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold"
      style={{
        background: active
          ? "#14532D"
          : "#7F1D1D",

        color: active
          ? "#4ADE80"
          : "#FCA5A5",
      }}
    >
      {active
        ? "ACTIVE"
        : "INACTIVE"}
    </span>
  );
}