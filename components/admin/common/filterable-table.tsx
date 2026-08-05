"use client";

import { useState, useMemo, ReactNode } from "react";
import TableSearch from "./search-input";
import DataTable from "./data-table";
import TablePagination from "./table-pagination";

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props<T> {
  data: T[];
  searchFields: string[];
  headers: string[];
  pageSize?: number;
  filters?: FilterConfig[];
  renderRow: (item: T, index: number) => ReactNode;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export default function FilterableTable<T>({
  data,
  searchFields,
  headers,
  pageSize = 15,
  filters,
  renderRow,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = data;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = getNestedValue(item, field);
          return String(val ?? "").toLowerCase().includes(q);
        })
      );
    }

    if (filters) {
      for (const f of filters) {
        const val = filterValues[f.key];
        if (val) {
          result = result.filter((item) => {
            const itemVal = getNestedValue(item, f.key);
            return String(itemVal ?? "") === val;
          });
        }
      }
    }

    return result;
  }, [data, search, searchFields, filters, filterValues]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap">
      <TableSearch
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      {filters?.map((f) => (
        <select
          key={f.key}
          value={filterValues[f.key] || ""}
          onChange={(e) => {
            setFilterValues((prev) => ({
              ...prev,
              [f.key]: e.target.value,
            }));
            setPage(1);
          }}
          className="h-11 rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none text-sm"
        >
          <option value="">All {f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );

  return (
    <DataTable
      headers={headers}
      toolbar={toolbar}
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
      {paged.map((item, i) => renderRow(item, i))}
    </DataTable>
  );
}
