"use client";

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function TableFilter({
  options,
  value,
  onChange,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="rounded-xl h-12 px-4"
      style={{
        background: "#111827",
        color: "white",
      }}
    >
      <option value="">
        All
      </option>

      {options.map((item) => (
        <option
          key={item}
          value={item}
        >
          {item}
        </option>
      ))}
    </select>
  );
}