"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Transaction } from "@/types/transaction";

interface RailUsageChartProps {
  transactions: Transaction[];
}

export default function RailUsageChart({
  transactions,
}: RailUsageChartProps) {

  const railMap: Record<string, number> = {};

  transactions.forEach((transaction) => {
    railMap[transaction.rail] =
      (railMap[transaction.rail] || 0) + 1;
  });

  const data = Object.entries(railMap).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const COLORS = [
    "#06b6d4",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
  ];

  return (
    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl p-6">

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Rail Distribution
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Payment routing distribution across active rails.
        </p>
      </div>

      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >

              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}