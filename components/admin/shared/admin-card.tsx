import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function AdminCard({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-6 ${className}`}
      style={{
        background: "#111827",
        borderColor: "rgba(255,255,255,.06)",
      }}
    >
      {children}
    </div>
  );
}