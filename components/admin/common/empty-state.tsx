interface Props {
  title: string;
}

export default function EmptyState({
  title,
}: Props) {
  return (
    <div className="py-20 text-center">

      <h2 className="text-xl font-bold text-white">
        No {title} Found
      </h2>

      <p className="text-slate-400 mt-3">
        Data will appear here after adding.
      </p>

    </div>
  );
}