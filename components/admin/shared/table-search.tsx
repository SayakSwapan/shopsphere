"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TableSearch({
  value,
  onChange,
}: Props) {
  return (
    <div
      className="flex items-center rounded-xl px-4 h-12 w-80"
      style={{
        background: "#111827",
      }}
    >
      <Search
        size={18}
        color="#94A3B8"
      />

      <input
        className="flex-1 ml-3 bg-transparent outline-none text-white"
        placeholder="Search..."
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />
    </div>
  );
}