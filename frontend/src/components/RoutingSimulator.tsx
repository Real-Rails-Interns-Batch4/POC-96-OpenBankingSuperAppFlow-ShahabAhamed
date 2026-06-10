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

// ─── Types ───────────────────────────────────────────────────────────────────

export type Rail = "ACH" | "WIRE" | "RTP";
export type Priority = "STANDARD" | "URGENT" | "BATCH";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SimInput {
  amount: number;
  institution: string;
  riskScore: number;
  priority: Priority;
}

export interface SimResult {
  rail: Rail;
  confidence: number;
  reasoning: string;
  settlementTime: string;
  riskAssessment: RiskLevel;
  costEstimate: string;
  reviewProbability: string;
  complianceRisk: string;
  factors: string[];
}

// ─── Routing engine (pure deterministic function) ────────────────────────────

function computeRouting(input: SimInput): SimResult {
  const { amount, riskScore, priority } = input;
  let rail: Rail;
  let rawConfidence: number;
  let reasoning: string;
  let factors: string[];

  if (amount >= 50000) {
    rail = "WIRE";
    rawConfidence = 98.5 + (riskScore > 50 ? 1.2 : 0) - (amount % 100 === 0 ? 0 : 0.4);
    reasoning = `High-value wire mandatory for transactions ≥$50K. Federal Regulation J and UCC Article 4A require WIRE for institutional-grade settlement. Same-day finality with full SWIFT audit trail.`;
    factors = ["Amount ≥$50K — WIRE mandatory", "Federal Reg J compliance", "SWIFT correspondent routing"];
  } else if (amount >= 10000) {
    rail = "WIRE";
    rawConfidence = 92.4 + (riskScore / 10) - (priority === "URGENT" ? 1.5 : 0);
    reasoning = `Transaction value $${amount.toLocaleString()} exceeds $10K threshold, triggering WIRE routing for institutional settlement guarantees, BSA compliance monitoring, and same-day finality.`;
    factors = ["Amount >$10K threshold crossed", "BSA/AML monitoring required", "Same-day institutional settlement"];
  } else if (priority === "URGENT" && riskScore < 55) {
    rail = "RTP";
    rawConfidence = 95.8 - (riskScore / 15) + (amount < 1000 ? 2.1 : 0);
    reasoning = `URGENT priority with acceptable risk score (${riskScore}) qualifies for Real-Time Payment rail. FedNow guarantees sub-30 second settlement finality with 24/7 availability.`;
    factors = [`URGENT priority flag`, `Risk score ${riskScore} — within RTP policy`, "FedNow sub-30s finality"];
  } else if (riskScore >= 70) {
    rail = "WIRE";
    rawConfidence = 85.0 + (riskScore / 5) - (amount < 500 ? 3.2 : 0);
    reasoning = `Elevated risk score (${riskScore}) triggers risk-mitigation escalation to WIRE. Full correspondent bank audit trail enables compliance review and manual intervention before settlement.`;
    factors = [`Risk score ${riskScore} exceeds threshold`, "WIRE provides complete audit trail", "Compliance review window available"];
  } else if (priority === "BATCH") {
    rail = "ACH";
    rawConfidence = 98.9 + (amount % 2 === 0 ? 0.3 : -0.2);
    reasoning = `BATCH processing mode optimally routes via ACH. NACHA-compliant batch settlement at sub-$0.50 per-transaction cost. T+1 finality suitable for non-urgent bulk processing.`;
    factors = ["BATCH mode — ACH optimal", "NACHA T+1 settlement", "Lowest per-transaction cost"];
  } else if (priority === "URGENT" && riskScore >= 55) {
    rail = "RTP";
    rawConfidence = 72.4 - ((riskScore - 55) / 3) + (amount < 1000 ? 1.5 : -1.5);
    reasoning = `URGENT priority overrides elevated risk (${riskScore}). RTP selected to minimize exposure window. Enhanced behavioral monitoring applied throughout the real-time settlement cycle.`;
    factors = ["URGENT priority override", `Risk score ${riskScore} — monitoring active`, "Short exposure window via RTP"];
  } else {
    rail = "ACH";
    rawConfidence = 91.2 + (50 - riskScore) / 10 + (amount < 2000 ? 2.3 : -1.1);
    reasoning = `Standard transaction with low-moderate risk (${riskScore}) routes optimally via ACH. Cost-efficient NACHA batch settlement with proven reliability across domestic payment infrastructure.`;
    factors = ["Standard priority — ACH default", `Risk score ${riskScore} — within ACH policy`, "Cost-optimal routing"];
  }

  const confidence = Math.min(99.9, Math.max(0.1, rawConfidence));

  const riskAssessment: RiskLevel =
    riskScore < 35 ? "LOW" : riskScore < 65 ? "MEDIUM" : "HIGH";

  const settlementTime =
    rail === "RTP" ? "< 30 seconds" : rail === "WIRE" ? "Same Business Day" : "T+1 Business Day";

  const costEstimate = RAIL_CONFIG[rail].flatFeeRange;

  const reviewProbability = riskScore > 80 ? "High (Manual Review)" : riskScore > 50 ? "Moderate" : "Low (Auto-Clear)";
  const complianceRisk = amount > 10000 ? "Elevated (BSA/AML)" : "Standard";

  return {
    rail,
    confidence,
    reasoning,
    settlementTime,
    riskAssessment,
    costEstimate,
    reviewProbability,
    complianceRisk,
    factors,
  };
}

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
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
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
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          >
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="section-label mb-0.5 text-purple-400/70">
              AI-Powered · Live Computation
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
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          REAL-TIME
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        {/* ── LEFT: Inputs ── */}
        <div className="p-4 flex flex-col h-full justify-between">
          <p className="section-label">Simulation Parameters</p>

          {/* Amount */}
          <div>
            <label className="section-label mb-2 block">Payment Amount</label>
            <div className="relative mb-2">
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
                className="w-full font-mono-data text-sm text-white pl-7 pr-4 py-2 rounded-lg outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-1.5">
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
          <div>
            <label className="section-label mb-2 block">Institution</label>
            <select
              value={input.institution}
              onChange={(e) =>
                setInput((p) => ({ ...p, institution: e.target.value }))
              }
              className="w-full text-sm text-white px-3 py-2 rounded-lg outline-none appearance-none cursor-pointer"
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
          <div>
            <div className="flex items-center justify-between mb-2">
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
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
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
              <span className="font-mono-data text-[9px] text-emerald-600/70">
                LOW
              </span>
              <span className="font-mono-data text-[9px] text-amber-600/70">
                MEDIUM
              </span>
              <span className="font-mono-data text-[9px] text-red-600/70">
                HIGH
              </span>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="section-label mb-2 block">
              Transaction Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["STANDARD", "URGENT", "BATCH"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setInput((prev) => ({ ...prev, priority: p }))}
                  className="py-2 rounded-lg font-mono-data text-[10px] font-semibold uppercase tracking-wider transition-all duration-150"
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
        </div>

        {/* ── RIGHT: Output ── */}
        <div className="p-4 flex flex-col h-full justify-between">
          <div>
            <p className="section-label mb-2">Routing Recommendation</p>

          {/* Rail hero */}
          <div
            className="p-3 rounded-xl mb-3 transition-all duration-300"
            style={{
              background: railStyle.bg,
              border: `1px solid ${railStyle.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="section-label">Recommended Rail</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: railStyle.color }}
                />
                <span
                  className="font-mono-data text-[9px] uppercase tracking-widest"
                  style={{ color: railStyle.color }}
                >
                  COMPUTED
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
              {result.rail}
            </p>
            {/* Confidence bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="section-label">Model Confidence</span>
                <span
                  className="font-mono-data text-[10px] font-semibold tabular-nums"
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
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {result.reasoning}
            </p>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
