import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TemplateForm from "@/components/admin/email-templates/template-form";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <TemplateForm
      initialData={{
        id: template.id,
        templateKey: template.templateKey,
        templateName: template.templateName,
        subject: template.subject,
        body: template.body,
        description: template.description,
        placeholders: template.placeholders,
        isActive: template.isActive,
      }}
    />
  );
}
