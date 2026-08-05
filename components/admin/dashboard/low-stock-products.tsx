import Link from "next/link";

interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockAlert: number;
}

interface Props {
  products: Product[];
}

export default function LowStockProducts({
  products,
}: Props) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">
          Low Stock Products
        </h2>

        <span className="text-sm text-slate-500">
          {products.length} Items
        </span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No low stock products
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(
            (product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border rounded-2xl p-4"
              >
                <div>
                  <h3 className="font-semibold">
                    {product.name}
                  </h3>

                  <p className="text-sm text-red-500">
                    Stock:
                    {" "}
                    {product.stock}
                    {" "}
                    /
                    {" "}
                    Alert:
                    {" "}
                    {product.lowStockAlert}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/products/view/${product.id}`}
                    className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm"
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/products/edit/${product.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}