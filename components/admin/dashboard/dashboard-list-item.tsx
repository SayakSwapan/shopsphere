interface Props {
  title: string;
  subtitle?: string;
  rightText?: string;
}

export default function DashboardListItem({
  title,
  subtitle,
  rightText,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-semibold text-white">{title}</h4>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {rightText && (
        <span className="ml-4 shrink-0 text-sm font-bold text-amber-400">
          {rightText}
        </span>
      )}
    </div>
  );
}
