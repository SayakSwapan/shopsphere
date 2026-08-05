export default function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

        <h1 className="text-3xl font-black">
          {title}
        </h1>

        <p className="text-slate-500 mt-2 mb-8">
          {subtitle}
        </p>

        {children}
      </div>
    </div>
  );
}