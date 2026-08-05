import { AlertTriangle, CheckCircle2, Package, XCircle } from "lucide-react";

interface Props {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  healthyProducts: number;
}

export default function InventoryStats({
  totalProducts,
  lowStockProducts,
  outOfStockProducts,
  healthyProducts,
}: Props) {
  const cards = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: <Package size={22} className="text-amber-500" />,
      accent: "from-amber-500/15 to-amber-500/5",
    },
    {
      title: "Low Stock",
      value: lowStockProducts,
      icon: <AlertTriangle size={22} className="text-yellow-400" />,
      accent: "from-yellow-500/15 to-yellow-500/5",
    },
    {
      title: "Out of Stock",
      value: outOfStockProducts,
      icon: <XCircle size={22} className="text-red-400" />,
      accent: "from-red-500/15 to-red-500/5",
    },
    {
      title: "Healthy",
      value: healthyProducts,
      icon: <CheckCircle2 size={22} className="text-emerald-400" />,
      accent: "from-emerald-500/15 to-emerald-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${card.accent} p-5 shadow-sm`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">{card.title}</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{card.value}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/60">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
