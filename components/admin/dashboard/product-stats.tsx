interface Props {
  totalProducts: number;

  activeProducts: number;

  lowStockProducts: number;

  featuredProducts: number;
}

export default function ProductStats({
  totalProducts,
  activeProducts,
  lowStockProducts,
  featuredProducts,
}: Props) {
  const cards = [
    {
      title: "Total Products",
      value: totalProducts,
    },
    {
      title: "Active Products",
      value: activeProducts,
    },
    {
      title: "Low Stock",
      value: lowStockProducts,
    },
    {
      title: "Featured",
      value: featuredProducts,
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="glass-card p-6 rounded-3xl"
        >
          <p className="text-slate-500">
            {card.title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}