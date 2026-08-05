interface Props {
  title: string;
  subtitle: string;
  description?: string;

  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
      <div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          {title}
        </h1>
        <span className="text-slate-500 mt-1">
          {subtitle}
        </span>

        <p className="text-slate-500 mt-1">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}