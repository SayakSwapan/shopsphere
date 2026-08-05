import Link from "next/link";

import { prisma } from "@/lib/prisma";

import DataTable from "@/components/common/data-table";

import TableActions from "@/components/common/table-actions";

export default async function ProductVariantsPage() {
  const variants =
    await prisma.productvariant.findMany({
      include: {
        product: true,

        gender: true,

        size: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const columns = [
    {
      key: "product",

      label: "Product",

      render: (
        _: unknown,
        row: {
          product: {
            name: string;
          };
        }
      ) => row.product.name,
    },

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
      key: "size",

      label: "Size",

      render: (
        _: unknown,
        row: {
          size: {
            sizeName: string;

            sizeCode: string;

            sizeUnit: string;
          };
        }
      ) =>
        `${row.size.sizeName} (${row.size.sizeCode} ${row.size.sizeUnit})`,
    },

    {
      key: "stock",

      label: "Stock",
    },

    {
      key: "sku",

      label: "SKU",
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
          editHref={`/admin/product-variants/edit/${row.id}`}
          deleteUrl={`/api/product-variants/${row.id}`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Product Variants
        </h1>

        <Link
          href="/admin/product-variants/create"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Create Variant
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={variants}
      />
    </div>
  );
}