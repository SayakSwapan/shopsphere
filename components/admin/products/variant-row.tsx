"use client";

import { VariantType } from "./variant-section";
import TrashButton from "@/components/admin/common/trash-button";

interface Props {
  variant: VariantType;

  removeVariant: (id: string) => void;
}

export default function VariantRow({
  variant,
  removeVariant,
}: Props) {
  return (
    <tr className="border-b border-slate-700">

      <td className="border border-slate-700 px-4 py-3 text-slate-200">
       <span className="rounded-lg bg-sky-900/50 px-3 py-1 text-xl text-white">
            {variant.genderName}
          </span>
      </td>

      <td className="border border-slate-700 px-4 py-3 text-slate-200">
       <span className="rounded-lg bg-sky-900/50 px-3 py-1 text-xl text-white">
       {variant.sizeName}
       </span>
        
      </td>

      <td className="border border-slate-700 px-4 py-3 text-slate-200">
       <span className="rounded-lg bg-sky-900/50 px-3 py-1 text-xl text-white">
            {variant.sku}
          </span>
      </td>

      <td className="border border-slate-700 px-4 py-3 text-slate-200">
       <span className="rounded-lg bg-sky-900/50 px-3 py-1 text-xl text-white">
            {variant.stock}
          </span>
      </td>

      <td className="border border-slate-700 px-4 py-3 text-slate-200">

        <TrashButton
          onClick={() =>
            removeVariant(
              variant.id
            )
          }
        />

      </td>

    </tr>
  );
}