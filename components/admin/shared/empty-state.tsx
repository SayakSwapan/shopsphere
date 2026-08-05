interface Props {
  text: string;
}

export default function EmptyState({
  text,
}: Props) {
  return (
    <div
      className="rounded-2xl p-16 text-center"
      style={{
        background: "#111827",
      }}
    >
      <h2 className="text-xl font-bold text-white">
        {text}
      </h2>
    </div>
  );
}