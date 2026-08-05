import DomainPaymentsManager from "@/components/admin/domain-payments/domain-payments-manager";

export const dynamic = "force-dynamic";

export default function DomainPaymentsPage() {
  return (
    <div className="p-6">
      <DomainPaymentsManager />
    </div>
  );
}
