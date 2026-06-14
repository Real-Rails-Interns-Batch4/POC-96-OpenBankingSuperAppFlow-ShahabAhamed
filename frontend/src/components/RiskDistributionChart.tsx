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
import { calculateMetrics } from "@/lib/metrics";

interface RiskDistributionChartProps {
  transactions: Transaction[];
}

const RISK_CONFIG = {
  LOW:    { fill: "#10B981", textColor: "#34D399", label: "Low Risk" },
  MEDIUM: { fill: "#F59E0B", textColor: "#FCD34D", label: "Medium Risk" },
  HIGH:   { fill: "#EF4444", textColor: "#F87171", label: "High Risk" },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: unknown }>; label?: string }) {
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
  const { riskMap, riskPercentages, riskExposureScore } = calculateMetrics(transactions);

  const exposureLabel = riskExposureScore <= 35 ? "LOW" : riskExposureScore <= 65 ? "MEDIUM" : "HIGH";
  const exposureColor = riskExposureScore <= 35 ? "#34D399" : riskExposureScore <= 65 ? "#F59E0B" : "#EF4444";

  const data = [
    { level: `Low`,   levelName: "Low Risk",    value: riskMap.LOW || 0,    fill: "#10B981", pct: riskPercentages.LOW },
    { level: `Medium`, levelName: "Medium Risk", value: riskMap.MEDIUM || 0, fill: "#F59E0B", pct: riskPercentages.MEDIUM },
    { level: `High`,   levelName: "High Risk",   value: riskMap.HIGH || 0,   fill: "#EF4444", pct: riskPercentages.HIGH },
  ];


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
        <p className="section-label mb-1">Risk Distribution</p>
        <h3 className="text-white font-semibold text-base leading-none">
          Threat Analysis
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 flex mt-4">
        {/* Chart */}
        <div className="w-3/5 min-w-0" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: -24, bottom: 0 }}
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
                maxBarSize={48}
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

        {/* Legend / Metrics */}
        <div className="w-2/5 flex flex-col justify-center pl-6 border-l border-white/5">
          <div className="mb-5 pb-4 border-b border-white/5">
             <p className="section-label mb-1">Exposure Score</p>
             <div className="flex items-baseline gap-2">
               <span className="text-3xl font-bold leading-none font-mono-data tracking-tight" style={{ color: exposureColor }}>
                 {riskExposureScore}
                 <span className="text-sm text-slate-500">/100</span>
               </span>
               <span className="font-mono-data text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: exposureColor, background: `${exposureColor}15` }}>
                 {exposureLabel}
               </span>
             </div>
          </div>
          <div className="space-y-3">
            {data.map((entry) => (
              <div key={entry.level} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
                  <span className="text-xs text-slate-300 font-medium">{entry.levelName}</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="font-mono-data text-xs text-slate-500">{entry.value}</span>
                   <span className="font-mono-data text-sm font-bold w-9 text-right" style={{ color: entry.fill }}>
                     {entry.pct}%
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}