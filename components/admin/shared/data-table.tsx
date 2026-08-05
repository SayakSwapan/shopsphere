import { ReactNode } from "react";

interface Props {
  headers: string[];
  children: ReactNode;
}

export default function DataTable({
  headers,
  children,
}: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#111827",
      }}
    >
      <table className="w-full">

        <thead
          style={{
            background: "#1F2937",
          }}
        >
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="text-left px-6 py-4 text-sm font-bold text-white"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>

      </table>
    </div>
  );
}