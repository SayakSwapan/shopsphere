import { prisma } from "@/lib/prisma";
import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";

export default async function TermsPage() {
  const policies = await prisma.policy.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-bg-page" style={{ color: "var(--t-text-heading)" }}>
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
            className="text-sm uppercase tracking-[0.25em]"
            style={{ color: "var(--t-primary)" }}
          >
            Terms & Policies
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Store policies and terms of service
          </h1>
          <p className="mt-4 max-w-3xl leading-relaxed" style={{ color: "var(--t-text-muted-1)" }}>
            Browse the full set of active policies that govern returns, replacements, shipping, warranties, and customer rights.
          </p>
        </div>

        <div className="space-y-8">
          {policies.map((policy) => (
            <section
              key={policy.id}
              className="border p-5 sm:p-8"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card-nested)",
              }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--t-primary)" }}>
                    {policy.type}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold" style={{ color: "var(--t-text-heading)" }}>
                    {policy.title}
                  </h2>
                </div>
                <span
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{
                    borderRadius: "var(--t-radius-badge)",
                    background: "var(--t-bg-card-alt)",
                    color: "var(--t-text-muted-2)",
                  }}
                >
                  {new Date(policy.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div
                className="mt-6 max-w-none text-sm leading-relaxed"
                style={{ color: "var(--t-text-body)" }}
                dangerouslySetInnerHTML={{
                  __html: policy.content,
                }}
              />
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
