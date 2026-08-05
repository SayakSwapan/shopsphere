interface Props {
  totalViews: number;

  totalSold: number;

  sellingPrice: number;

  costPrice: number;
}

export default function ProductAnalytics({
  totalViews,
  totalSold,
  sellingPrice,
  costPrice,
}: Props) {
  const profit =
    sellingPrice -
    costPrice;

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="glass-card p-6 rounded-3xl">
        <p className="text-slate-500">
          Total Views
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {totalViews}
        </h2>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <p className="text-slate-500">
          Total Sold
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {totalSold}
        </h2>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <p className="text-slate-500">
          Profit Margin
        </p>

        <h2 className="text-3xl font-bold mt-2">
          ₹{profit}
        </h2>
      </div>
    </div>
  );
}