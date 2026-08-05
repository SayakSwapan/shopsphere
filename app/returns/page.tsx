import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div
          className="mb-12 border p-6 sm:p-10"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card)",
            boxShadow: "var(--t-shadow-card-hover)",
          }}
        >
          <p
            className="text-sm uppercase tracking-[0.25em] font-bold"
            style={{ color: "var(--t-primary)" }}
          >
            Return Policy
          </p>
          <h1
            className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight"
            style={{ color: "var(--t-text-heading)" }}
          >
            Easy returns, fair refunds, and replacement support
          </h1>
          <p
            className="mt-4 max-w-3xl leading-relaxed"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            Learn how our returns and replacements work, along with the timelines and conditions for a stress-free shopping experience.
          </p>
        </div>

        <div
          className="border p-5 sm:p-8 space-y-6"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card-nested)",
          }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--t-text-heading)" }}
          >
            Return window
          </h2>
          <p style={{ color: "var(--t-text-body)" }}>
            Customers may request a return or replacement within 30 days of delivery for eligible items.
          </p>
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--t-text-heading)" }}
          >
            How to request a return
          </h2>
          <p style={{ color: "var(--t-text-body)" }}>
            Use your order page to initiate the return request and follow the instructions provided.
          </p>
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--t-text-heading)" }}
          >
            Refunds and replacements
          </h2>
          <p style={{ color: "var(--t-text-body)" }}>
            Refunds are processed within 5-7 business days after the returned item is received. Replacements are shipped once the return is approved.
          </p>
          <p className="text-sm" style={{ color: "var(--t-text-muted-2)" }}>
            All policy details are maintained by the admin and displayed on the Terms &amp; Conditions page.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
