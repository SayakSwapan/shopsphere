"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import ChartCard from "./chart-card";

interface Props {
  data: {
    month: string;
    revenue: number;
  }[];
}

export default function RevenueChart({
  data,
}: Props) {
  return (
    <ChartCard title="Monthly Revenue">

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart
          data={data}
        >

          <CartesianGrid
            stroke="#374151"
          />

          <XAxis
            dataKey="month"
            stroke="#94A3B8"
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#F59E0B"
            strokeWidth={4}
          />

        </LineChart>

      </ResponsiveContainer>

    </ChartCard>
  );
}