"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Transaction } from "@/types/transaction";

interface RiskDistributionChartProps {
  transactions: Transaction[];
}

export default function RiskDistributionChart({
  transactions,
}: RiskDistributionChartProps) {

  const riskMap: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  transactions.forEach((transaction) => {
    riskMap[transaction.risk_level] =
      (riskMap[transaction.risk_level] || 0) + 1;
  });

  const data = [
    {
      level: "LOW",
      value: riskMap.LOW,
      color: "#10b981",
    },
    {
      level: "MEDIUM",
      value: riskMap.MEDIUM,
      color: "#f59e0b",
    },
    {
      level: "HIGH",
      value: riskMap.HIGH,
      color: "#ef4444",
    },
  ];

  return (
    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl p-6">

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Risk Distribution
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Real-time fraud and transaction risk visibility.
        </p>
      </div>

      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
            />

            <XAxis
              dataKey="level"
              stroke="#94a3b8"
            />

            <YAxis
              stroke="#94a3b8"
            />

            <Tooltip />

            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
            >

              {data.map((entry) => (
                <Cell
                  key={entry.level}
                  fill={entry.color}
                />
              ))}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}