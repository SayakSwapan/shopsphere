import Link from "next/link";

export default function HomePage() {
  return (
    <div>

      <section className="py-28 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">

        <div className="max-w-7xl mx-auto px-6">

          <h1 className="text-6xl font-black">
            Shop Better
          </h1>

          <p className="mt-6 text-xl">
            Premium products at
            amazing prices.
          </p>

          <Link
            href="/products"
            className="inline-flex mt-8 px-8 py-4 bg-white text-black rounded-2xl font-bold"
          >
            Shop Now
          </Link>

        </div>

      </section>

    </div>
  );
}