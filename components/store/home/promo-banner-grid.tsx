export default function PromoBannerGrid() {
  return (
    <section className="py-12">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid md:grid-cols-3 gap-6">

          <div className="md:col-span-2 relative h-60 sm:h-80 overflow-hidden">

            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 p-6 sm:p-10 text-white">

              <span className="text-xs uppercase tracking-widest">
                Limited Time
              </span>

              <h2 className="text-2xl sm:text-4xl font-black mt-3">
                Up To 40% OFF
              </h2>

            </div>

          </div>

          <div className="relative h-60 sm:h-80 overflow-hidden">

            <img
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 p-6 sm:p-10 text-white">

              <span className="text-xs uppercase tracking-widest">
                Trending
              </span>

              <h2 className="text-xl sm:text-3xl font-black mt-3">
                Sports Collection
              </h2>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}