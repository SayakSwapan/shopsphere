import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PincodeForm from "@/components/admin/pincodes/pincode-form";

export default function NewPincodePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Add Pincode"
        subtitle="Create a new delivery pincode"
      />

      <PincodeForm />
    </PageContainer>
  );
}
