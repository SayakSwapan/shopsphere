import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ContactForm from "@/components/store/contact/contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{ background: "color-mix(in srgb, var(--t-primary) 8%, transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <p
            className="uppercase tracking-[0.3em] text-xs text-primary font-bold"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Get In Touch
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Contact Us
          </h1>
          <p className="mt-3 text-text-muted-1 max-w-xl">
            Have a question or need assistance? We&apos;re
            here to help. Send us a message and we&apos;ll get
            back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ContactForm />
      </div>

      <Footer />
    </div>
  );
}
