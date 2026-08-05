import Link from "next/link";

import { prisma } from "@/lib/prisma";

import DataTable from "@/components/common/data-table";

import TableActions from "@/components/common/table-actions";

export default async function GendersPage() {
  const genders =
    await prisma.gender.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  const columns = [
    {
      key: "name",
      label: "Gender",
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
          editHref={`/admin/masters/genders/edit/${row.id}`}
          deleteUrl={`/api/genders/${row.id}`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Genders
        </h1>

        <Link
          href="/admin/masters/genders/create"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Create Gender
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={genders}
      />
    </div>
  );
}