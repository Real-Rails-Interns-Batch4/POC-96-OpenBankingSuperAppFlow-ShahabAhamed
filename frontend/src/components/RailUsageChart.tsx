"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Transaction } from "@/types/transaction";
import { calculateMetrics } from "@/lib/metrics";

interface RailUsageChartProps {
  transactions: Transaction[];
}

const RAIL_COLORS: Record<string, { fill: string; text: string }> = {
  ACH:     { fill: "#22D3EE", text: "var(--cyan-bright)" },
  WIRE:    { fill: "#A78BFA", text: "var(--purple-bright)" },
  RTP:     { fill: "#34D399", text: "var(--emerald-bright)" },
  FEDNOW:  { fill: "#FCD34D", text: "var(--amber-bright)" },
};

const DEFAULT_COLORS = ["#22D3EE", "#A78BFA", "#34D399", "#FCD34D", "#F87171"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: unknown }> }) {
  if (active && payload && payload.length) {
    const d = payload[0];
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
        <p className="section-label mb-1">{d.name}</p>
        <p className="font-mono-data text-white font-semibold text-sm">
          {d.value}{" "}
          <span className="text-slate-500 font-normal text-xs">
            transaction{d.value !== 1 ? "s" : ""}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export default function RailUsageChart({
  transactions,
}: RailUsageChartProps) {
  const { railCounts, railPercentages, totalTxns } = calculateMetrics(transactions);

  const data = Object.entries(railCounts).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  if (!data.length) {
    return (
      <div
        className="rounded-xl p-5 flex items-center justify-center h-[260px]"
        style={{
          background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p className="font-mono-data text-xs text-slate-600">No rail data available</p>
      </div>
    );
  }



  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between min-h-[320px]"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div>
        <p className="section-label mb-1">Rail Distribution</p>
        <h3 className="text-white font-semibold text-base leading-none">
          Payment Routing
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center mt-4">
        {/* Chart */}
        <div className="w-1/2 relative flex items-center justify-center" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <defs>
                <filter id="glow-pie">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                strokeWidth={0}
              >
                {data.map((entry, index) => {
                  const colorEntry = RAIL_COLORS[entry.name];
                  return (
                    <Cell
                      key={entry.name}
                      fill={colorEntry ? colorEntry.fill : DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      opacity={0.9}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-white font-bold text-3xl leading-none">{totalTxns}</span>
             <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest mt-1.5">TXN</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-1/2 flex flex-col gap-4 pl-8 justify-center">
          {data.map((entry, i) => {
            const colorEntry = RAIL_COLORS[entry.name];
            const color = colorEntry ? colorEntry.fill : DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const pct = railPercentages[entry.name] || 0;
            return (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: color, boxShadow: `0 0 10px ${color}60` }}
                  />
                  <span className="font-mono-data text-xs font-semibold text-slate-200 tracking-wider">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <span className="font-mono-data text-xs text-slate-400 text-right w-12">
                    {entry.value} TXN
                  </span>
                  <span 
                    className="font-mono-data text-sm font-bold text-right w-10"
                    style={{ color: color }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}