import Link from "next/link";

export default function ArtisanBanner() {
  return (
    <section
      className="text-center py-10 sm:py-16 px-4 sm:px-6"
      style={{ background: "#0F4C46" }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-4"
        style={{ color: "#D8C39B" }}
      >
        Our Promise
      </p>
      <h2
        className="text-2xl sm:text-4xl font-semibold mb-5 max-w-xl mx-auto leading-tight"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#FBF3E6" }}
      >
        Every thread has a name behind it
      </h2>
      <p
        className="text-sm leading-relaxed max-w-lg mx-auto mb-8"
        style={{ color: "#CDE0DC" }}
      >
        We work directly with over 40 weaving and embroidery clusters, paying
        fair wages and keeping century-old crafts alive.
      </p>
      <Link
        href="/about"
        className="inline-flex items-center justify-center font-semibold uppercase text-[13px] px-7 sm:px-9 py-4 transition-all hover:opacity-90"
        style={{
          letterSpacing: "0.12em",
          fontFamily: "var(--t-font-body)",
          background: "#C9972F",
          color: "#FBF3E6",
          border: "1px solid #C9972F",
          borderRadius: "var(--t-radius-button)",
        }}
      >
        Meet the Artisans
      </Link>
    </section>
  );
}
