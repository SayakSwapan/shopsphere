"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
}

export default function TableSearch({
  value,
  onChange,
  placeholder,
}: Props) {
  return (
    <div className="relative w-80">

      <Search
        size={18}
        className="absolute left-4 top-3.5 text-slate-500"
      />

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder ??
          "Search..."
        }
        className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] pl-11 text-white outline-none"
      />

    </div>
  );
}