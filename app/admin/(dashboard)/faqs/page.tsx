import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import FaqsTable from "@/components/admin/faqs/faqs-table";

export default async function FaqsPage() {
  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  const rows = faqs.map((faq) => ({ ...faq, createdAt: faq.createdAt.toISOString() }));

  return (
    <PageContainer>
      <PageHeader title="FAQs" subtitle={`${faqs.length} questions`} />
      <div className="mb-6 flex justify-end">
        <Link href="/admin/faqs/new" className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400">+ Add FAQ</Link>
      </div>
      <FaqsTable faqs={rows} />
    </PageContainer>
  );
}
