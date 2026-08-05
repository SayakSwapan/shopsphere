"use client";

import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface Props<T> {
  headers?: string[];
  children?: ReactNode;
  columns?: Column<T>[];
  data?: T[];
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
}

function TableShell({
  title,
  subtitle,
  toolbar,
  footer,
  children,
}: {
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "#111827",
        borderColor: "rgba(255,255,255,.06)",
      }}
    >
      {(title || toolbar) && (
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-5 sm:px-6">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          {toolbar}
        </div>
      )}
      {children}
      {footer && (
        <div className="border-t border-slate-700 px-4 py-4 sm:px-6">{footer}</div>
      )}
    </div>
  );
}

export default function DataTable<T>({
  headers,
  children,
  columns,
  data,
  title,
  subtitle,
  toolbar,
  footer,
}: Props<T>) {
  if (columns && data) {
    return (
      <TableShell title={title} subtitle={subtitle} toolbar={toolbar} footer={footer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#0F172A" }}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-900/40 transition">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-4 text-slate-300 sm:px-6">
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key], row as T)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    );
  }

  return (
    <TableShell title={title} subtitle={subtitle} toolbar={toolbar} footer={footer}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: "#0F172A" }}>
            <tr>
              {headers?.map((header) => (
                <th
                  key={header}
                    className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6"
                  >
                    {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </TableShell>
  );
}
