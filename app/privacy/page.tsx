import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <NavbarWrapper />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-12 rounded-4xl border border-slate-700 bg-[#111827] p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
            Privacy Policy
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Protecting your privacy and data
          </h1>
          <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">
            We are committed to safeguarding your personal information and providing transparency about how your data is used.
          </p>
        </div>

        <div className="rounded-4xl border border-slate-700 bg-[#0B1624] p-5 sm:p-8 space-y-6 prose prose-invert text-slate-300">
          <h2 className="text-2xl font-bold text-white">What we collect</h2>
          <p>
            We collect only the details needed to process your orders and provide a better shopping experience.
          </p>
          <h2 className="text-2xl font-bold text-white">How we use your information</h2>
          <p>
            Your information is used to complete purchases, communicate order updates, and personalize your experience.
          </p>
          <h2 className="text-2xl font-bold text-white">Your choices</h2>
          <p>
            You can review or delete your account information through your customer profile at any time.
          </p>
          <p className="text-sm text-slate-500">
            For full policy details, please review our active policies on the Terms &amp; Conditions page.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
