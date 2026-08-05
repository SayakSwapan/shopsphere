import TransactionChargeForm from "@/components/admin/transaction-charges/transaction-charge-form";

export default function NewTransactionChargePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">New Transaction Charge</h1>
        <p className="mt-1 text-sm text-slate-500">Add a fee rule for payment transactions. Rules are evaluated in sort order.</p>
      </div>
      <TransactionChargeForm mode="create" />
    </div>
  );
}
