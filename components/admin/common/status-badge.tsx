interface Props {
  text: string;
  color?: "green" | "red" | "yellow" | "blue";
}

export default function StatusBadge({
  text,
  color = "green",
}: Props) {
  const colors = {
    green: {
      bg: "#064E3B",
      text: "#34D399",
    },
    red: {
      bg: "#7F1D1D",
      text: "#F87171",
    },
    yellow: {
      bg: "#78350F",
      text: "#FBBF24",
    },
    blue: {
      bg: "#1E3A8A",
      text: "#60A5FA",
    },
  };

  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        background: colors[color].bg,
        color: colors[color].text,
      }}
    >
      {text}
    </span>
  );
}