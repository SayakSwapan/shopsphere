import { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  accent?: "amber" | "emerald" | "blue" | "red" | "purple";
}

const accentMap = {
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/20",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/20",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/20",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    borderHover: "hover:border-red-500/20",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/20",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  accent = "amber",
}: Props) {
  const colors = accentMap[accent];

  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-[#111827] p-4 sm:p-6 transition-colors ${colors.borderHover}`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-2 text-xl sm:text-3xl font-black text-white tracking-tight">
            {value}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
          <span className={colors.iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
