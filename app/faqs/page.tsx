import { prisma } from "@/lib/prisma";
import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import { HelpCircle, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      <NavbarWrapper />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-[#0D1424] to-[#111827]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #fff 0, transparent 1px, transparent 60px)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-3">Help Center</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-white">
            Frequently Asked <span className="text-amber-400">Questions</span>
          </h1>
          <p className="mt-4 text-sm max-w-md mx-auto leading-relaxed text-slate-400">
            Find answers to common questions about shopping, orders, returns, and more.
          </p>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-amber-500 to-transparent" />
      </div>

      {/* FAQs */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-amber-500/20 transition-colors">
                <summary className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none list-none">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                    <HelpCircle size={20} className="text-amber-400" />
                  </div>
                  <span className="flex-1 text-sm font-bold uppercase tracking-wider text-white">{faq.question}</span>
                  <span className="text-slate-500 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <div className="px-6 pb-5 pl-12 sm:pl-20">
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-4xl border border-slate-700 bg-[#111827] p-8 sm:p-12 text-center">
            <MessageCircle size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No FAQs available yet. Check back soon!</p>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-16 text-center rounded-4xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-2">Still have questions?</p>
          <h2 className="text-2xl font-black uppercase text-white mb-4">We&apos;re Here to Help</h2>
          <a href="/contact" className="inline-block rounded-xl bg-amber-500 px-8 py-3 font-bold text-black hover:bg-amber-400 transition-colors">
            Contact Us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
