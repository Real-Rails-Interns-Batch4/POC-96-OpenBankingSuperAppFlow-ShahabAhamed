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

const RISK_CONFIG = {
  LOW:    { fill: "#10B981", textColor: "#34D399", label: "Low Risk" },
  MEDIUM: { fill: "#F59E0B", textColor: "#FCD34D", label: "Medium Risk" },
  HIGH:   { fill: "#EF4444", textColor: "#F87171", label: "High Risk" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const cfg = RISK_CONFIG[label as keyof typeof RISK_CONFIG];
    return (
      <div
        style={{
          background: "#0B1220",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        }}
      >
        <p className="section-label mb-1" style={{ color: cfg?.textColor }}>
          {cfg?.label || label}
        </p>
        <p className="font-mono-data text-white font-semibold text-sm">
          {payload[0].value}{" "}
          <span className="text-slate-500 font-normal text-xs">
            transaction{payload[0].value !== 1 ? "s" : ""}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export default function RiskDistributionChart({
  transactions,
}: RiskDistributionChartProps) {
  const riskMap: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  transactions.forEach((t) => {
    riskMap[t.risk_level] = (riskMap[t.risk_level] || 0) + 1;
  });

  const data = [
    { level: `Low Risk (${riskMap.LOW})`,    value: riskMap.LOW,    fill: "#10B981" },
    { level: `Medium Risk (${riskMap.MEDIUM})`, value: riskMap.MEDIUM, fill: "#F59E0B" },
    { level: `High Risk (${riskMap.HIGH})`,   value: riskMap.HIGH,   fill: "#EF4444" },
  ];

  const highRiskCount = riskMap.HIGH;

  return (
    <div
      className="rounded-xl p-6 flex flex-col justify-between h-[280px]"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div>
        <p className="section-label mb-1">Risk Distribution</p>
        <h3 className="text-white font-semibold text-base leading-none">
          Threat Analysis
        </h3>
      </div>

      {/* Chart */}
      <div className="flex-1 min-w-0 mt-4 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: -24, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="1 4"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="level"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94A3B8",
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748B",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
              }}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={64}
              label={{ 
                position: 'top', 
                fill: '#94A3B8', 
                fontSize: 11, 
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
                dy: -4
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.level}
                  fill={entry.fill}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}