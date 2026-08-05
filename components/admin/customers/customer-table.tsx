"use client";

import { useState, useMemo } from "react";
import TableSearch from "@/components/admin/common/search-input";
import DataTable from "@/components/admin/common/data-table";
import TablePagination from "@/components/admin/common/table-pagination";
import {
  customerHeaders,
  CustomerRow,
} from "./customer-columns";

interface Address {
  id: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: Address[];
}

interface Props {
  customers: Customer[];
}

export default function CustomerTable({
  customers,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DataTable
      headers={customerHeaders}
      title="Customers"
      subtitle={`${filtered.length} Registered Customers`}
      toolbar={
        <TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      }
      footer={
        totalPages > 1 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        ) : null
      }
    >
      {paged.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
        />
      ))}
    </DataTable>
  );
}