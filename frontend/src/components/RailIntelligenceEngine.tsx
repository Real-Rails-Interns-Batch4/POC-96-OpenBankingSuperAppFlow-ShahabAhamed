"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  Scale,
  Shield,
  ShieldCheck,
  TriangleAlert,
  Zap,
  Activity,
  Lock,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import {
  Rail,
  Priority,
  RailConfig,
  LevelLabel,
  RAIL_CONFIG,
  RAIL_STYLES,
  LEVEL_STYLES,
  generateNarrative,
  getConsentInfo,
} from "@/lib/railConfig";

// ─── Re-export types so page.tsx import stays unchanged ──────────────────────
export type { Rail, Priority };
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RailSimInput {
  amount:    number;
  riskScore: number;
  priority:  Priority;
  institution?: string;
}

export interface RailSimResult {
  rail:              Rail;
  confidence:        number;
  reasoning:         string;
  settlementTime:    string;
  riskAssessment:    RiskLevel;
  costEstimate:      string;
  reviewProbability: string;
  complianceRisk:    string;
  factors:           string[];
}

// ─── Confidence helpers ───────────────────────────────────────────────────────

function confidenceMeta(pct: number): { label: string; color: string } {
  if (pct >= 95) return { label: "HIGH",     color: "#34D399" };
  if (pct >= 80) return { label: "STRONG",   color: "#22D3EE" };
  if (pct >= 60) return { label: "MODERATE", color: "#FCD34D" };
  return              { label: "LOW",       color: "#F87171" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-4">
      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.04)" }} />
      <span
        className="font-mono-data uppercase tracking-widest flex-shrink-0"
        style={{ fontSize: "8px", color: "#334155" }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

function LevelBadge({ level }: { level: LevelLabel }) {
  const s = LEVEL_STYLES[level];
  return (
    <span
      className="font-mono-data text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}22` }}
    >
      {level}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  valueColor?: string;
}) {
  return (
    <div
      className="p-3 rounded-lg flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3 text-slate-600" />
        <span className="section-label" style={{ fontSize: "9px" }}>{label}</span>
      </div>
      <p
        className="font-mono-data text-[14px] font-bold tabular-nums leading-none"
        style={{ color: valueColor ?? "#CBD5E1" }}
      >
        {value}
      </p>
      <p className="font-mono-data text-[9px] text-slate-600 leading-tight">{subtext}</p>
    </div>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span title={text} className="cursor-help">
      {children}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RailIntelligenceEngineProps {
  result: RailSimResult;
  input:  RailSimInput;
}

const ALL_RAILS: Rail[] = ["ACH", "WIRE", "RTP"];

export default function RailIntelligenceEngine({ result, input }: RailIntelligenceEngineProps) {
  const viewRail = result.rail;
  const config = RAIL_CONFIG[viewRail];
  const recStyle = RAIL_STYLES[viewRail];
  const conf = confidenceMeta(result.confidence);

  const narrative = useMemo(() => generateNarrative(viewRail, input), [viewRail, input]);
  const consent = useMemo(() => getConsentInfo(input.institution ?? "Chase"), [input.institution]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #070F1D 0%, #0A1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: recStyle.dimBg,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          borderLeft: `3px solid ${recStyle.color}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: recStyle.bg, border: `1px solid ${recStyle.border}` }}
          >
            <GitBranch className="w-3.5 h-3.5" style={{ color: recStyle.color }} />
          </div>
          <div>
            <p className="font-mono-data uppercase tracking-widest text-[8px] mb-0" style={{ color: `${recStyle.color}99` }}>
              Rail Governance
            </p>
            <h3 className="text-white font-semibold text-sm leading-none mt-0.5">
              Rail Intelligence Engine
            </h3>
          </div>
        </div>

        {/* Active rail + confidence */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono-data text-[9px] text-slate-500">Routing Confidence</span>
            <span
              className="font-mono-data text-[10px] font-bold tabular-nums"
              style={{ color: conf.color }}
            >
              {result.confidence.toFixed(1)}%
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{ background: recStyle.bg, border: `1px solid ${recStyle.border}` }}
          >
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: recStyle.color }} />
            <span className="font-mono-data text-[9px] font-bold tracking-widest" style={{ color: recStyle.color }}>
              {result.rail} ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-4 space-y-0">
        {/* ═══════════════════════════════════════════════════════════════════
            RAIL PROFILE
        ═══════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Operator row */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg mb-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: recStyle.bg, border: `1px solid ${recStyle.border}` }}
              >
                <Building2 className="w-2.5 h-2.5" style={{ color: recStyle.color }} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <p className="text-white text-xs font-semibold leading-none">{config.operatorShort}</p>
                  <span className="section-label" style={{ fontSize: "8px" }}>Network Operator</span>
                </div>
                <p className="font-mono-data text-[9px] text-slate-500 mt-1 leading-none">{config.operator}</p>
              </div>
            </div>
          </div>

          {/* 5-cell metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
            {[
              { label: "Settlement", value: config.settlementTime, color: recStyle.color },
              { label: "Availability", value: config.availability },
            ].map((c) => (
              <div
                key={c.label}
                className="flex flex-col gap-1 px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="section-label" style={{ fontSize: "9px" }}>{c.label}</span>
                <span className="font-mono-data text-[10px] font-semibold leading-tight" style={{ color: c.color ?? "#CBD5E1" }}>
                  {c.value}
                </span>
              </div>
            ))}
            {[
              { label: "Cost", level: config.cost },
              { label: "Risk Profile", level: config.riskLevel },
              { label: "Compliance", level: config.complianceImpact },
            ].map((c) => (
              <div
                key={c.label}
                className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="section-label" style={{ fontSize: "9px" }}>{c.label}</span>
                <LevelBadge level={c.level} />
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SELECTION RATIONALE
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionDivider label="Selection Rationale" />
        <div>
          <div
            className="px-4 py-3 rounded-lg mb-2"
            style={{
              background: recStyle.dimBg,
              border: `1px solid ${recStyle.border}`,
              borderLeft: `3px solid ${recStyle.color}`,
            }}
          >
            <p className="text-slate-200 text-[13px] leading-relaxed font-medium">
              {narrative.primary}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            OPEN BANKING CONSENT INTELLIGENCE
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionDivider label="Open Banking Context" />
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="px-3 py-1.5 flex items-center gap-2"
            style={{
              background: "rgba(34,211,238,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderLeft: "3px solid rgba(34,211,238,0.4)",
            }}
          >
            <Lock className="w-3 h-3 text-cyan-500/60" />
            <span className="section-label text-cyan-500/60">Open Banking Context</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.03)" }}>
            {[
              { label: "Consent Provider", value: consent.provider,    color: "#22D3EE" },
              { label: "Consent Status",   value: consent.status,      color: consent.status === "Verified" ? "#34D399" : "#FCD34D" },
              { label: "Access Scope",     value: consent.scope,       color: "#94A3B8" },
              { label: "Token Status",     value: consent.tokenStatus, color: consent.tokenStatus === "Active" ? "#34D399" : "#FCD34D" },
              { label: "API Version",      value: consent.apiVersion,  color: "#94A3B8" },
              { label: "Last Refresh",     value: consent.lastRefresh, color: "#94A3B8" },
            ].map((row) => (
              <div
                key={row.label}
                className="px-3 py-1.5 flex flex-col gap-0.5"
                style={{ background: "#070F1D" }}
              >
                <span className="section-label" style={{ fontSize: "8px" }}>{row.label}</span>
                <div className="flex items-center gap-1.5">
                  {(row.label === "Consent Status" || row.label === "Token Status") && (
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: row.color,
                        boxShadow: `0 0 4px ${row.color}60`,
                      }}
                    />
                  )}
                  <span
                    className="font-mono-data text-[10px] font-semibold"
                    style={{ color: row.color }}
                  >
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="px-3 py-1.5 flex items-center gap-1.5"
            style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            <RefreshCw className="w-2.5 h-2.5 text-slate-700" />
            <span className="font-mono-data text-[9px] text-slate-600">
              Institution: {input.institution ?? "Chase"} · PSD2 compliant · FCA registered
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            COMPACT RAIL COMPARISON
        ═══════════════════════════════════════════════════════════════════ */}
        <SectionDivider label="Compact Rail Comparison" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ALL_RAILS.map((r) => {
            const rc = RAIL_CONFIG[r];
            const rs = RAIL_STYLES[r];
            const isRec = r === result.rail;
            return (
              <div
                key={r}
                className="px-2.5 py-2 rounded-lg flex flex-col justify-center"
                style={{
                  background: isRec ? rs.dimBg : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isRec ? rs.border : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono-data text-[11px] font-bold tracking-widest"
                    style={{ color: rs.color }}
                  >
                    {r}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Settlement</span>
                    <span className="font-mono-data text-[10px] font-semibold text-slate-300">
                      {rc.settlementWindow}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono-data text-[9px] text-slate-500 uppercase tracking-wider">Cost</span>
                    <span className="font-mono-data text-[10px] font-semibold text-slate-300">
                      {rc.flatFeeDisplay}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
