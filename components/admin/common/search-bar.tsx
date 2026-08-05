"use client";

interface Props {
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
}: Props) {
  return (
    <div className="relative w-full md:w-96">
      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder ||
          "Search..."
        }
        className="w-full h-14 rounded-2xl border border-slate-200 bg-white/70 px-5 text-slate-700 shadow-sm"
      />
    </div>
  );
}