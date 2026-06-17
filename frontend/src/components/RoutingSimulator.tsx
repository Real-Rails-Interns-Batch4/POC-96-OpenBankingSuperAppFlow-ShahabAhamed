"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Brain,
  Clock,
  Shield,
  DollarSign,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { RAIL_CONFIG } from "@/lib/railConfig";
import { computeRouting, SimInput, SimResult, Rail, Priority, RiskLevel } from "@/lib/routingEngine";

// Re-export for compatibility with other components
export type { Rail, Priority, RiskLevel, SimInput, SimResult };

// ─── Constants ───────────────────────────────────────────────────────────────

const RAIL_COLORS: Record<Rail, { color: string; bg: string; border: string }> = {
  ACH:  { color: "#22D3EE", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.25)" },
  WIRE: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  RTP:  { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
};

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#34D399", MEDIUM: "#FCD34D", HIGH: "#F87171",
};

const QUICK_AMOUNTS = [500, 5000, 15000, 50000];

const INSTITUTIONS = [
  "Chase",
  "Wells Fargo",
  "Bank of America",
  "Citibank",
  "Goldman Sachs",
];

// ─── Component ───────────────────────────────────────────────────────────────

interface RoutingSimulatorProps {
  onResultChange?: (result: SimResult, input: SimInput) => void;
}

export default function RoutingSimulator({ onResultChange }: RoutingSimulatorProps) {
  const [input, setInput] = useState<SimInput>({
    amount: 5000,
    institution: "Chase",
    riskScore: 32,
    priority: "STANDARD",
  });

  const result = useMemo(() => computeRouting(input), [input]);

  // Notify parent whenever routing decision changes (include full input with institution)
  useEffect(() => {
    onResultChange?.(result, input);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, input.institution]);

  const railStyle = RAIL_COLORS[result.rail];
  const riskColor = RISK_COLORS[result.riskAssessment];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #030712 0%, #081120 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: "rgba(167,139,250,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          borderLeft: "3px solid rgba(167,139,250,0.5)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          >
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="font-mono-data text-[9px] uppercase tracking-widest mb-0.5 text-purple-400/70">
              AI ROUTING SIMULATION · DECISION INTELLIGENCE ENGINE
            </p>
            <h3 className="text-white font-semibold text-base leading-none">
              Payment Routing Simulator
            </h3>
          </div>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono-data text-[10px] font-semibold"
          style={{
            background: "rgba(167,139,250,0.1)",
            color: "#A78BFA",
            border: "1px solid rgba(167,139,250,0.2)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          INTERACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x"
        style={{ borderColor: "rgba(255,255,255,0.02)" }}
      >
        {/* ── LEFT: Inputs ── */}
        <div className="p-5 space-y-4 flex flex-col h-full">
          <p className="section-label">Simulation Parameters</p>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="section-label block">Payment Amount</label>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-data text-sm text-slate-500">
                $
              </span>
              <input
                type="number"
                value={input.amount}
                min={0}
                step={100}
                onChange={(e) =>
                  setInput((p) => ({ ...p, amount: Number(e.target.value) || 0 }))
                }
                className="w-full font-mono-data text-sm text-white pl-7 pr-4 py-2 rounded outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
            {/* Quick amounts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setInput((p) => ({ ...p, amount: amt }))}
                  className="font-mono-data text-[10px] py-1.5 rounded transition-all duration-150"
                  style={{
                    background:
                      input.amount === amt
                        ? "rgba(34,211,238,0.1)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      input.amount === amt
                        ? "rgba(34,211,238,0.25)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    color: input.amount === amt ? "#22D3EE" : "#64748B",
                  }}
                >
                  ${amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Institution */}
          <div className="flex flex-col gap-1.5">
            <label className="section-label block">Institution</label>
            <select
              value={input.institution}
              onChange={(e) =>
                setInput((p) => ({ ...p, institution: e.target.value }))
              }
              className="w-full text-sm text-white px-3 py-2 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {INSTITUTIONS.map((b) => (
                <option key={b} value={b} style={{ background: "#0B1220" }}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Score */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <label className="section-label">Risk Score</label>
              <span
                className="font-mono-data text-xs font-semibold tabular-nums"
                style={{ color: riskColor }}
              >
                {input.riskScore}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={input.riskScore}
              onChange={(e) =>
                setInput((p) => ({ ...p, riskScore: Number(e.target.value) }))
              }
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-1"
              style={{
                accentColor:
                  input.riskScore < 35
                    ? "#34D399"
                    : input.riskScore < 65
                    ? "#F59E0B"
                    : "#EF4444",
              }}
            />
            <div className="flex justify-between mt-1">
              <span className={`font-mono-data text-[9px] font-bold tracking-widest ${input.riskScore < 35 ? "text-emerald-400" : "text-emerald-900"}`}>LOW</span>
              <span className={`font-mono-data text-[9px] font-bold tracking-widest ${input.riskScore >= 35 && input.riskScore < 65 ? "text-amber-400" : "text-amber-900"}`}>MEDIUM</span>
              <span className={`font-mono-data text-[9px] font-bold tracking-widest ${input.riskScore >= 65 ? "text-red-400" : "text-red-900"}`}>HIGH</span>
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="section-label block">
              Transaction Priority
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["STANDARD", "URGENT", "BATCH"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setInput((prev) => ({ ...prev, priority: p }))}
                  className="py-2 rounded font-mono-data text-[10px] font-semibold uppercase tracking-wider transition-all duration-150"
                  style={{
                    background:
                      input.priority === p
                        ? "rgba(167,139,250,0.12)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      input.priority === p
                        ? "rgba(167,139,250,0.3)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    color: input.priority === p ? "#A78BFA" : "#64748B",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ── Simulation Impact Preview ── */}
          <div className="mt-auto pt-6">
            <p className="font-mono-data uppercase tracking-widest text-[10px] font-bold text-slate-400 mb-2">
              SIMULATION IMPACT PREVIEW
            </p>
            <div
              className="p-3.5 rounded-lg flex flex-col gap-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Settlement Time</span>
                <span className="font-mono-data text-[10px] font-semibold text-slate-300 text-right">
                  {result.settlementTime.replace("T+1", "1")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Estimated Cost</span>
                <span className="font-mono-data text-[10px] font-semibold text-slate-300 text-right">{result.costEstimate}</span>
              </div>
              
              <div className="h-px w-full my-0.5" style={{ background: "rgba(255,255,255,0.04)" }} />
              
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Review Probability</span>
                <span className="font-mono-data text-[10px] font-semibold text-slate-300 text-right">
                  {result.reviewProbability.replace(" (Auto-Clear)", " (Straight Through Processing)").replace(" (Manual Review)", " (Manual Review)")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Compliance Status</span>
                <span className="font-mono-data text-[10px] font-semibold text-slate-300 text-right">
                  {result.complianceRisk === "Standard" ? "NACHA Compliant" : result.complianceRisk}
                </span>
              </div>
              
              <div className="h-px w-full my-0.5" style={{ background: "rgba(255,255,255,0.04)" }} />
              
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Recommended Rail</span>
                <span className="font-mono-data text-[11px] font-bold text-right" style={{ color: railStyle.color }}>{result.rail === "RTP" ? "FEDNOW" : result.rail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Success Rate</span>
                <span className="font-mono-data text-[10px] font-semibold text-emerald-400 text-right">
                  {RAIL_CONFIG[result.rail].successRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Output ── */}
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            <p className="section-label mb-2">Routing Recommendation</p>

          {/* Rail hero */}
          <div
            className="p-3.5 rounded-lg mb-3 transition-all duration-300 relative overflow-hidden"
            style={{
              background: railStyle.bg,
              border: `1px solid ${railStyle.border}`,
              boxShadow: `0 0 24px ${railStyle.bg}`,
            }}
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ background: `radial-gradient(circle at 50% -20%, ${railStyle.color}20, transparent 70%)` }} />
            
            <div className="flex items-center justify-between mb-2 relative">
              <span className="section-label text-slate-300">Recommended Rail</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: `${railStyle.color}15`, border: `1px solid ${railStyle.color}30` }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: railStyle.color }} />
                <span
                  className="font-mono-data text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: railStyle.color }}
                >
                  RECOMMENDED
                </span>
              </div>
            </div>
            <p
              className="font-bold leading-none mb-3 tabular-nums transition-all duration-300"
              style={{
                fontSize: "28px",
                color: railStyle.color,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {result.rail === "RTP" ? "FEDNOW" : result.rail}
            </p>
            {/* Confidence bar */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="section-label text-slate-400">Model Confidence</span>
                <span
                  className="font-mono-data text-[11px] font-bold tabular-nums"
                  style={{ color: railStyle.color }}
                >
                  {result.confidence.toFixed(1)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${result.confidence}%`,
                    background: railStyle.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metrics 3×2 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              {
                icon: Clock,
                label: "Settlement",
                value: result.settlementTime,
                color: "#94A3B8",
              },
              {
                icon: DollarSign,
                label: "Est. Cost",
                value: result.costEstimate,
                color: "#94A3B8",
              },
              {
                icon: Shield,
                label: "Risk Level",
                value: result.riskAssessment,
                color: riskColor,
              },
              {
                icon: Zap,
                label: "Priority",
                value: input.priority,
                color: "#94A3B8",
              },
              {
                icon: Brain,
                label: "Review Prob",
                value: result.reviewProbability,
                color: result.reviewProbability.includes("High") ? "#F87171" : "#34D399",
              },
              {
                icon: CheckCircle2,
                label: "Compliance",
                value: result.complianceRisk,
                color: result.complianceRisk.includes("Elevated") ? "#FCD34D" : "#34D399",
              },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-slate-600" />
                    <span className="section-label">{m.label}</span>
                  </div>
                  <p
                    className="font-mono-data text-xs font-semibold truncate"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* AI Reasoning */}
          <div
            className="p-3 rounded-lg flex flex-col justify-center"
            style={{
              background: "rgba(167,139,250,0.04)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="w-3 h-3 text-purple-400/60" />
              <span className="section-label text-purple-400/60">
                AI Reasoning
              </span>
            </div>
            <p className="text-[12px] text-white font-semibold mb-2">Routing Decision Summary</p>
            <ul className="space-y-1">
              {result.factors.map((f, i) => (
                 <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-relaxed">
                   <div className="w-1 h-1 rounded-full bg-purple-400/60 mt-1.5 flex-shrink-0" />
                   {f}
                 </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Decision Inputs */}
            <div className="px-3 py-2.5 rounded-lg flex flex-col h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="section-label mb-2 text-slate-300">Decision Inputs</p>
              <div className="space-y-1.5 flex-1 mt-1">
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">Amount</span><span className="text-[10px] font-mono-data text-white">${input.amount.toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">Risk Score</span><span className="text-[10px] font-mono-data" style={{ color: riskColor }}>{input.riskScore}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">Priority</span><span className="text-[10px] font-mono-data text-white">{input.priority}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">Institution</span><span className="text-[10px] font-mono-data text-white truncate max-w-[60px]" title={input.institution}>{input.institution}</span></div>
              </div>
            </div>

            {/* Why This Matters */}
            <div className="p-3.5 rounded-lg flex flex-col h-full" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)" }}>
              <p className="section-label mb-3 text-cyan-400">Why This Matters</p>
              <ul className="space-y-1.5 flex-1">
                <li className="flex items-start gap-1.5 text-[10px] text-slate-300"><div className="w-1 h-1 rounded-full bg-cyan-400/60 mt-1.5 flex-shrink-0" /> Lowest projected processing cost</li>
                <li className="flex items-start gap-1.5 text-[10px] text-slate-300"><div className="w-1 h-1 rounded-full bg-cyan-400/60 mt-1.5 flex-shrink-0" /> Suitable settlement timeframe</li>
                <li className="flex items-start gap-1.5 text-[10px] text-slate-300"><div className="w-1 h-1 rounded-full bg-cyan-400/60 mt-1.5 flex-shrink-0" /> Strong compliance profile</li>
              </ul>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
