import Link from "next/link";

import { prisma } from "@/lib/prisma";

import DataTable from "@/components/common/data-table";

import TableActions from "@/components/common/table-actions";

export default async function SizesPage() {
  const sizes =
  await prisma.size.findMany({
    include: {
      gender: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
    console.log(sizes);

  const columns = [
  {
    key: "gender",

    label: "Gender",

    render: (
      _: unknown,
      row: {
        gender: {
          name: string;
        };
      }
    ) => row.gender.name,
  },

  {
    key: "sizeName",

    label: "Size",
  },

  {
    key: "sizeCode",

    label: "Measurement",

    render: (
      _: unknown,
      row: {
        sizeCode: string;

        sizeUnit: string;
      }
    ) =>
      `${row.sizeCode} ${row.sizeUnit}`,
  },

  {
    key: "isActive",

    label: "Status",

    render: (
      value: unknown
    ) =>
      value
        ? "Active"
        : "Inactive",
  },

  {
    key: "actions",

    label: "Actions",

    render: (
      _: unknown,
      row: {
        id: string;
      }
    ) => (
      <TableActions
        editHref={`/admin/masters/sizes/edit/${row.id}`}
        deleteUrl={`/api/sizes/${row.id}`}
      />
    ),
  },
];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Sizes
        </h1>

        <Link
          href="/admin/masters/sizes/create"
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          Create Size
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={sizes}
      />
    </div>
  );
}