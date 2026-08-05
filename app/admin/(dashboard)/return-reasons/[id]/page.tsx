import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReturnReasonForm from "@/components/admin/return-reasons/return-reason-form";

export default async function EditReasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reason = await prisma.returnReason.findUnique({ where: { id } });
  if (!reason) notFound();

  return <ReturnReasonForm initialData={{ id: reason.id, type: reason.type, question: reason.question, options: reason.options.split("|").filter(Boolean), sortOrder: reason.sortOrder, isActive: reason.isActive }} />;
}
