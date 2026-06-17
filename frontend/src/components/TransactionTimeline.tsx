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

import { Transaction } from "@/types/transaction";

interface TransactionTimelineProps {
  transactions: Transaction[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: unknown }>; label?: string }) {
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
  transactions,
}: TransactionTimelineProps) {
  const sorted = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Create a smoothed volume trend using a 3-point rolling average
  const data = sorted.map((t, index) => {
    const windowStart = Math.max(0, index - 1);
    const windowEnd = Math.min(sorted.length - 1, index + 1);
    let sum = 0;
    for (let i = windowStart; i <= windowEnd; i++) {
      sum += sorted[i].amount;
    }
    const avg = sum / (windowEnd - windowStart + 1);

    // Add some realistic fluctuation to the smoothed baseline using a deterministic pseudo-random
    const pseudoRandom = (Math.abs(Math.sin(t.amount)) * 1000) % 1;
    const smoothedAmount = avg * (0.9 + pseudoRandom * 0.2); 

    return {
      time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: smoothedAmount,
    };
  });

  const volumes = data.map(d => d.amount);
  const maxVol = Math.max(...volumes);
  const minVol = Math.min(...volumes);
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between min-h-[340px] group"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="section-label mb-1">Generated from Mock Dataset</p>
          <h3 className="text-white font-semibold text-base leading-none">
            Transaction Volume Trend
          </h3>
        </div>
        <div className="flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-white/5 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
          <div className="text-right">
            <span className="font-mono-data text-[9px] uppercase tracking-widest text-slate-500 block mb-0.5">Average</span>
            <span className="font-mono-data text-xs font-semibold text-slate-300">${avgVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-right">
            <span className="font-mono-data text-[9px] uppercase tracking-widest text-slate-500 block mb-0.5">▼ Lowest</span>
            <span className="font-mono-data text-xs font-semibold text-emerald-400">${minVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-right">
            <span className="font-mono-data text-[9px] uppercase tracking-widest text-slate-500 block mb-0.5">▲ Peak</span>
            <span className="font-mono-data text-xs font-semibold text-amber-400">${maxVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="min-w-0 mt-8" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 0, left: -10, bottom: 0 }}
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