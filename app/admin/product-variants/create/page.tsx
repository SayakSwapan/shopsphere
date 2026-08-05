import VariantForm from "@/components/admin/product-variants/variant-form";

export default function CreateVariantPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">
        Create Variant
      </h1>

      <VariantForm />
    </div>
  );
}