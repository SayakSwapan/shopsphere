"use client";

interface Props {
  value: string;
  onChange: (
    value: string
  ) => void;
}

export function CategorySearch({
  value,
  onChange,
}: Props) {
  return (
    <input
      type="text"
      placeholder="Search category..."
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
      className="w-full md:w-80 border rounded-lg px-4 py-2"
    />
  );
}