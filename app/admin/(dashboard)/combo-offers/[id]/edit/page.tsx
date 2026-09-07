import ComboOfferForm from "@/components/admin/combo-offers/combo-offer-form";

export const dynamic = "force-dynamic";

export default async function EditComboOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComboOfferForm mode="edit" id={id} />;
}
