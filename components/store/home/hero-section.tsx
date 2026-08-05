import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">

      {/* Background Image */}

      <img
        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80"
        alt="Hero Banner"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}

      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}

      <div
        className="
        relative
        z-10
        min-h-[500px]
        md:min-h-[650px]
        lg:min-h-[750px]
        flex
        items-center
        "
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

          <div className="max-w-3xl">

            <span
              className="
              inline-block
              bg-red-600
              text-white
              px-4
              py-2
              text-[10px]
              sm:text-xs
              font-black
              uppercase
              tracking-[0.2em]
              "
            >
              New Collection 2026
            </span>

            <h1
              className="
              mt-6
              text-white
              text-4xl
              sm:text-5xl
              md:text-6xl
              lg:text-7xl
              font-black
              leading-none
              "
            >
              Elevate
              <br />
              Your Style
            </h1>

            <p
              className="
              mt-6
              text-zinc-300
              text-sm
              sm:text-base
              md:text-lg
              lg:text-xl
              max-w-xl
              leading-relaxed
              "
            >
              Premium fashion, luxury footwear,
              accessories and exclusive collections
              designed for modern lifestyles.
            </p>

            <div
              className="
              flex
              flex-col
              sm:flex-row
              gap-4
              mt-10
              "
            >

              <Link
                href="/products"
                className="
                text-center
                bg-white
                text-black
                px-8
                py-4
                font-black
                uppercase
                tracking-wider
                hover:bg-zinc-200
                transition-all
                "
              >
                Shop Now
              </Link>

              <Link
                href="/products"
                className="
                text-center
                border
                border-white
                text-white
                px-8
                py-4
                font-black
                uppercase
                tracking-wider
                hover:bg-white
                hover:text-black
                transition-all
                "
              >
                Explore Collection
              </Link>

            </div>

            {/* Stats */}

            <div
              className="
              mt-12
              grid
              grid-cols-3
              gap-6
              max-w-lg
              "
            >

              <div>
                <h3 className="text-white text-2xl md:text-3xl font-black">
                  10K+
                </h3>

                <p className="text-zinc-400 text-xs uppercase tracking-wider">
                  Customers
                </p>
              </div>

              <div>
                <h3 className="text-white text-2xl md:text-3xl font-black">
                  500+
                </h3>

                <p className="text-zinc-400 text-xs uppercase tracking-wider">
                  Products
                </p>
              </div>

              <div>
                <h3 className="text-white text-2xl md:text-3xl font-black">
                  50+
                </h3>

                <p className="text-zinc-400 text-xs uppercase tracking-wider">
                  Brands
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>

    </section>
  );
}