import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SportsMarqueeForm from "@/components/admin/sports-home-content/sports-marquee-form";

export const dynamic = "force-dynamic";

export default async function EditMarqueePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.sportsMarqueeItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <SportsMarqueeForm
      mode="edit"
      item={{
        id: item.id,
        phrase: item.phrase,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      }}
    />
  );
}
