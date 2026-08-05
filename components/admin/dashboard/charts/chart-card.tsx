import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  children,
}: Props) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        background: "#111827",
        borderColor: "rgba(255,255,255,.06)",
      }}
    >
      <h2 className="text-xl font-bold text-white mb-6">
        {title}
      </h2>

      {children}
    </div>
  );
}