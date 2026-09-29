"use client";

import { useState } from "react";
import {
  Activity,
  Monitor,
  RotateCcw,
  Search,
  Smartphone,
  Tablet,
  Users,
  UserRoundCheck,
} from "lucide-react";

type VisitorRow = {
  ipAddress: string;
  visits: number;
  devices: string[];
  lastVisitAt: string | null;
};

interface Props {
  visits: number;
  uniqueVisitors: number;
  returningVisitors: number;
  topDevice: string;
  rows: VisitorRow[];
}

const numberFormat = new Intl.NumberFormat("en-IN");

function DeviceIcon({ device }: { device: string }) {
  if (device === "mobile") return <Smartphone size={14} />;
  if (device === "tablet") return <Tablet size={14} />;
  return <Monitor size={14} />;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VisitorAnalytics({
  visits,
  uniqueVisitors,
  returningVisitors,
  topDevice,
  rows,
}: Props) {
  const [query, setQuery] = useState("");
  const filteredRows = rows.filter((row) =>
    row.ipAddress.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const cards = [
    {
      label: "Visit sessions",
      value: visits,
      icon: Activity,
      note: "Last 30 days",
    },
    {
      label: "Unique visitors",
      value: uniqueVisitors,
      icon: Users,
      note: "Distinct browser IDs",
    },
    {
      label: "Returning visitors",
      value: returningVisitors,
      icon: UserRoundCheck,
      note: "2+ sessions in period",
    },
    {
      label: "Top device",
      value: topDevice,
      icon: RotateCcw,
      note: "By visit sessions",
    },
  ];

  return (
    <div className="space-y-6">
      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        aria-label="Visitor summary"
      >
        {cards.map(({ label, value, icon: Icon, note }) => (
          <article
            key={label}
            className="min-w-0 border-l-2 border-amber-400 bg-slate-900/60 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2 text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wide">
                {label}
              </span>
              <Icon size={17} className="shrink-0 text-amber-300" />
            </div>
            <p className="mt-3 truncate text-2xl font-bold capitalize text-white sm:text-3xl">
              {typeof value === "number" ? numberFormat.format(value) : value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden border border-slate-800 bg-slate-950/40">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Visits by IP address
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {numberFormat.format(rows.length)} addresses in this period
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search IP addresses</span>
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by IP address"
              className="h-10 w-full border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition focus:border-amber-400"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="mx-auto text-slate-600" size={28} />
            <p className="mt-3 font-medium text-white">
              No visitor sessions yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Sessions will appear here as customers browse the store.
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No IP addresses match your search.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Visitor IP</th>
                    <th className="px-5 py-3 font-semibold">Device types</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Visits
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Latest visit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.ipAddress}
                      className="border-t border-slate-800/80 text-slate-300"
                    >
                      <td className="px-5 py-4 font-mono text-sm text-white">
                        {row.ipAddress}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {row.devices.map((device) => (
                            <span
                              key={device}
                              className="inline-flex items-center gap-1.5 capitalize text-slate-300"
                            >
                              <DeviceIcon device={device} />
                              {device}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-white">
                        {numberFormat.format(row.visits)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-400">
                        {formatDate(row.lastVisitAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-800 md:hidden">
              {filteredRows.map((row) => (
                <article
                  key={row.ipAddress}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="break-all font-mono text-sm text-white">
                      {row.ipAddress}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs capitalize text-slate-400">
                      {row.devices.map((device) => (
                        <span
                          key={device}
                          className="inline-flex items-center gap-1"
                        >
                          <DeviceIcon device={device} />
                          {device}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest {formatDate(row.lastVisitAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold tabular-nums text-white">
                      {numberFormat.format(row.visits)}
                    </p>
                    <p className="text-xs text-slate-500">visits</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
