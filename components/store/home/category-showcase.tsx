export default function CategoryShowcase() {
  const categories = [
    {
      title: "Men",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    },

    {
      title: "Women",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    },

    {
      title: "Accessories",
      image:
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
    },
  ];

  return (
    <section className="py-20">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-black mb-12">
          Shop By Category
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">

          {categories.map(
            (category) => (
              <div
                key={
                  category.title
                }
                className="
                relative
                rounded-[32px]
                overflow-hidden
                group
                h-[450px]
                "
              >

                <img
                  src={
                    category.image
                  }
                  alt={
                    category.title
                  }
                  className="
                  w-full
                  h-full
                  object-cover
                  group-hover:scale-110
                  transition-all
                  duration-700
                  "
                />

                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute bottom-8 left-8">

                  <h3 className="text-white text-4xl font-black">
                    {
                      category.title
                    }
                  </h3>

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </section>
  );
}