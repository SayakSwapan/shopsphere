interface Props {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function PartnerStats({
  total,
  approved,
  pending,
  rejected,
}: Props) {
  const cards = [
    {
      title: "Total Partners",
      value: total,
      color: "border-blue-500",
    },
    {
      title: "Approved",
      value: approved,
      color: "border-green-500",
    },
    {
      title: "Pending",
      value: pending,
      color: "border-yellow-500",
    },
    {
      title: "Rejected",
      value: rejected,
      color: "border-red-500",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-2xl border-l-4 ${card.color} bg-[#111827] p-6 shadow`}
        >
          <p className="text-sm text-slate-400">
            {card.title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}