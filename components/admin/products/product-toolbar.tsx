"use client";

import { Search } from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

export default function ProductToolbar({
  search,
  setSearch,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-6">

      <div className="relative w-96">

        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2"
          size={18}
          color="#94A3B8"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search Product..."
          className="w-full h-12 rounded-xl pl-11 pr-4 bg-[#111827] text-white border border-slate-700 outline-none focus:border-amber-500"
        />

      </div>

    </div>
  );
}