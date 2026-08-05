import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WhatsAppTemplateForm from "@/components/admin/whatsapp-templates/whatsapp-template-form";

export default async function EditWhatsAppTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.whatsAppTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <WhatsAppTemplateForm
      initialData={{
        id: template.id,
        templateKey: template.templateKey,
        templateName: template.templateName,
        body: template.body,
        description: template.description,
        placeholders: template.placeholders,
        isActive: template.isActive,
      }}
    />
  );
}
