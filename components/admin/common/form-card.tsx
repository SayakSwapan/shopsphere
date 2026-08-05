interface Props {
  title: string;

  children: React.ReactNode;
}

export default function FormCard({
  title,
  children,
}: Props) {
  return (
    <div className="glass-card rounded-3xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        {title}
      </h2>

      {children}
    </div>
  );
}