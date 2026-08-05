import { Trash2, Pencil } from "lucide-react";
import { VariantType } from "./variant-section";

interface Props {
  variants: VariantType[];
  removeVariant: (id: string) => void;
  editVariant: (variant: VariantType) => void;
}

export default function VariantTable({
  variants,
  removeVariant,
  editVariant,
}: Props) {
  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 py-10 text-center text-slate-400">
        No variants added yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700">
      <table className="w-full border-collapse">

        <thead className="bg-[#0F172A]">

          <tr>

            <th className="border-b border-slate-700 px-4 py-3 text-left text-sm text-slate-300">
              Gender
            </th>

            <th className="border-b border-slate-700 px-4 py-3 text-left text-sm text-slate-300">
              Size
            </th>

            <th className="border-b border-slate-700 px-4 py-3 text-left text-sm text-slate-300">
              SKU
            </th>

            <th className="border-b border-slate-700 px-4 py-3 text-center text-sm text-slate-300">
              Stock
            </th>

            <th className="border-b border-slate-700 px-4 py-3 text-center text-sm text-slate-300">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {variants.map((variant) => (

            <tr
              key={variant.id}
              className="border-b border-slate-700 bg-[#111827] hover:bg-[#172033]"
            >

              <td className="px-4 py-4 text-white">
                {variant.genderName}
              </td>

              <td className="px-4 py-4 text-white">
                {variant.sizeName}
              </td>

              <td className="px-4 py-4 font-mono text-amber-400">
                {variant.sku}
              </td>

              <td className="px-4 py-4 text-center text-white">
                {variant.stock}
              </td>

              <td className="px-4 py-4">

                <div className="flex justify-center gap-2">

                  <button
                    type="button"
                    onClick={() => editVariant(variant)}
                    className="rounded-lg bg-blue-600 p-2 hover:bg-blue-500"
                  >
                    <Pencil size={16} color="white" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="rounded-lg bg-red-600 p-2 hover:bg-red-500"
                  >
                    <Trash2 size={16} color="white" />
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>
    </div>
  );
}