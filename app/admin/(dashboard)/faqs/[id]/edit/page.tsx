import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FaqForm from "@/components/admin/faqs/faq-form";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) notFound();

  return <FaqForm initialData={{ id: faq.id, question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive }} />;
}
