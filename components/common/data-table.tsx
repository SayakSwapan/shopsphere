import {
  Column,
} from "@/types/table";

interface Props<T> {
  columns: Column<T>[];

  data: T[];
}

export default function DataTable<
  T extends {
    id: string;
  }
>({
  columns,
  data,
}: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full">
        <thead className="bg-slate-100">
          <tr>
            {columns.map(
              (column) => (
                <th
                  key={String(
                    column.key
                  )}
                  className="text-left p-4 font-semibold"
                >
                  {
                    column.label
                  }
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className="border-t"
            >
              {columns.map(
                (column) => (
                  <td
                    key={String(
                      column.key
                    )}
                    className="p-4"
                  >
                    {column.render
                      ? column.render(
                          row[
                            column.key as keyof T
                          ],
                          row
                        )
                      : String(
                          row[
                            column.key as keyof T
                          ]
                        )}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}