import { prisma } from "@/lib/prisma";
import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import FaqSearchList from "@/components/store/faq/faq-search-list";
import { MessageCircleQuestion, Headset } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div
      className="min-h-screen bg-bg-page"
      style={{ color: "var(--t-text-heading)" }}
    >
      <NavbarWrapper />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--t-primary) 8%, var(--t-bg-page)) 0%, var(--t-bg-page) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--t-text-heading) 0, transparent 1px, transparent 72px), repeating-linear-gradient(90deg, var(--t-text-heading) 0, transparent 1px, transparent 72px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--t-primary) 25%, transparent), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{
              borderRadius: "var(--t-radius-badge)",
              background: "color-mix(in srgb, var(--t-primary) 14%, transparent)",
              color: "var(--t-primary)",
            }}
          >
            <MessageCircleQuestion size={14} />
            Help Center
          </span>
          <h1
            className="mt-6 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Frequently Asked{" "}
            <span style={{ color: "var(--t-primary)" }}>Questions</span>
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            Quick, clear answers to the questions customers ask us most about
            orders, payments, delivery, returns, refunds, and more.
          </p>
        </div>
        <div
          className="h-[3px] bg-gradient-to-r"
          style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
        />
      </div>

      {/* FAQ list */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        {faqs.length > 0 ? (
          <FaqSearchList faqs={faqs} />
        ) : (
          <div
            className="rounded-xl border p-10 sm:p-14 text-center"
            style={{
              borderRadius: "var(--t-radius-card)",
              borderColor: "var(--t-border-card)",
              background: "var(--t-bg-card)",
            }}
          >
            <MessageCircleQuestion
              size={40}
              className="mx-auto mb-4 text-[var(--t-text-muted-3)]"
            />
            <p
              className="text-base font-semibold"
              style={{ color: "var(--t-text-heading)" }}
            >
              No FAQs available yet
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--t-text-muted-1)" }}
            >
              Check back soon, or contact our support team for help.
            </p>
          </div>
        )}

        {/* Contact CTA */}
        <div
          className="mt-16 text-center border p-6 sm:p-10"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card-nested)",
            boxShadow: "var(--t-shadow-card)",
          }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 14%, transparent)",
              color: "var(--t-primary)",
            }}
          >
            <Headset size={14} />
            Still have questions?
          </span>
          <h2
            className="mt-4 text-2xl font-black uppercase sm:text-3xl"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            We&apos;re Here to Help
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm leading-relaxed"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            Did not find your answer? Our support team is ready to assist you
            with anything you need.
          </p>
          <a
            href="/contact"
            className="mt-6 inline-block rounded-xl px-8 py-3 font-bold transition-opacity hover:opacity-85"
            style={{
              borderRadius: "var(--t-radius-button)",
              background: "var(--t-primary)",
              color: "var(--t-button-text, #ffffff)",
              boxShadow: "var(--t-shadow-button)",
            }}
          >
            Contact Us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}