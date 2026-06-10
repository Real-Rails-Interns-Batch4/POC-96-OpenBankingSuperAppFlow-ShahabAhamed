"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { TelemetrySnapshot } from "../../app/page";

interface TransactionTimelineProps {
  telemetryHistory: TelemetrySnapshot[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
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
        <p className="section-label mb-1 text-cyan-500/70">{label}</p>
        <p className="font-mono-data text-white font-semibold text-sm">
          ${Number(payload[0].value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
}

export default function TransactionTimeline({
  telemetryHistory,
}: TransactionTimelineProps) {
  const data = telemetryHistory.map((t) => ({
    time: t.timestamp,
    amount: t.volume,
  }));

  if (!data.length) {
    return (
      <div
        className="rounded-xl p-6 flex items-center justify-center h-[320px]"
        style={{
          background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p className="font-mono-data text-xs text-slate-600">Awaiting telemetry data...</p>
      </div>
    );
  }

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
        <p className="section-label mb-1">Transaction Timeline</p>
        <h3 className="text-white font-semibold text-base leading-none">
          Volume Telemetry
        </h3>
      </div>

      {/* Chart */}
      <div className="flex-1 min-w-0 mt-4 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="1 4"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              minTickGap={60}
              tick={{
                fill: "#64748B",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 500,
              }}
              dy={10}
              tickFormatter={(val: string) => {
                 // Convert 'HH:MM:SS' to 'HH:MM'
                 const parts = val.split(":");
                 if(parts.length >= 2) return `${parts[0]}:${parts[1]}`;
                 return val;
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tick={{
                fill: "#64748B",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
              }}
              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(34,211,238,0.2)",
                strokeWidth: 1,
                strokeDasharray: "4 2",
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#22D3EE"
              strokeWidth={2.5}
              fill="url(#timelineGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#0B1220",
                stroke: "#22D3EE",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}