import GenderForm from "@/components/admin/genders/gender-form";

export default function CreateGenderPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        Create Gender
      </h1>

      <GenderForm />
    </div>
  );
}