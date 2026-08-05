import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function DashboardWidget({
  title,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6">
      <h2 className="mb-5 text-lg font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}
