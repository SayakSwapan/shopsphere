import Link from "next/link";

const categories = [
  "Men",
  "Women",
  "Footwear",
  "Accessories",
  "Watches",
  "Sports",
  "Electronics",
  "Offers",
];

export default function CategoryStrip() {
  return (
    <div className="bg-white border-b border-zinc-200">

      <div className="max-w-7xl mx-auto px-6">

        <div
          className="
          flex
          items-center
          gap-8
          overflow-x-auto
          h-14
          text-sm
          font-bold
          uppercase
          tracking-wider
          "
        >
          {categories.map(
            (category) => (
              <Link
                key={category}
                href="/products"
                className="
                whitespace-nowrap
                hover:text-red-600
                transition-all
                "
              >
                {category}
              </Link>
            )
          )}
        </div>

      </div>

    </div>
  );
}