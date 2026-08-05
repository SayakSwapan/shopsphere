"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
} from "recharts";

import ChartCard from "./chart-card";

interface Props {
  data: {
    month: string;
    orders: number;
  }[];
}

export default function OrdersChart({
  data,
}: Props) {
  return (
    <ChartCard title="Monthly Orders">

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <BarChart
          data={data}
        >

          <XAxis
            dataKey="month"
            stroke="#94A3B8"
          />

          <Tooltip />

          <Bar
            dataKey="orders"
            fill="#F59E0B"
            radius={[8,8,0,0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </ChartCard>
  );
}