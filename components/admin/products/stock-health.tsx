interface Props {
  stock: number;
  lowStockAlert?: number;
}

export default function StockHealth({
  stock,
  lowStockAlert = 5,
}: Props) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
        Out of Stock
      </span>
    );
  }

  if (stock <= lowStockAlert) {
    return (
      <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-400">
        Low
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
      Healthy
    </span>
  );
}
