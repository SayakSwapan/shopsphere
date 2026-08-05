import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TransactionChargeForm from "@/components/admin/transaction-charges/transaction-charge-form";

export default async function EditTransactionChargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const charge = await prisma.transactionCharge.findUnique({ where: { id } });

  if (!charge) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Edit Transaction Charge</h1>
        <p className="mt-1 text-sm text-slate-500">Update the fee rule details.</p>
      </div>
      <TransactionChargeForm
        mode="edit"
        initial={{
          id: charge.id,
          minAmount: Number(charge.minAmount),
          maxAmount: charge.maxAmount ? Number(charge.maxAmount) : null,
          feeType: charge.feeType,
          feeValue: Number(charge.feeValue),
          isActive: charge.isActive,
          sortOrder: charge.sortOrder,
          description: charge.description,
        }}
      />
    </div>
  );
}
