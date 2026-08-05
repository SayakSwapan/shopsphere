import { Mail, ArrowRight } from "lucide-react";

export default function NewsletterSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 88%, #000)",
            borderRadius: "var(--t-radius-card)",
          }}
        >
          {/* subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-8 py-12 md:px-16 md:py-16">
            <div className="flex-shrink-0 hidden md:flex w-16 h-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--t-accent) 20%, transparent)" }}
            >
              <Mail size={28} style={{ color: "var(--t-accent)" }} />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h2
                className="text-2xl md:text-3xl font-black uppercase"
                style={{ color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
              >
                Stay in the Game
              </h2>
              <p
                className="mt-3 text-sm md:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                Get first access to new drops, exclusive deals and insider training tips. No spam, just gear.
              </p>
            </div>

            <div className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent transition-colors"
                style={{
                  borderRadius: "var(--t-radius-input) 0 0 var(--t-radius-input)",
                  fontFamily: "var(--t-font-body)",
                }}
              />
              <button
                className="px-6 py-3.5 text-sm font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-opacity hover:opacity-90"
                style={{
                  background: "var(--t-accent)",
                  color: "#0A0F1E",
                  borderRadius: "0 var(--t-radius-button) var(--t-radius-button) 0",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                Subscribe
                <ArrowRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
