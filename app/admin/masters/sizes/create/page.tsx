import SizeForm from "@/components/admin/sizes/size-form";

export default function CreateSizePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">
        Create Size
      </h1>

      <SizeForm />
    </div>
  );
}