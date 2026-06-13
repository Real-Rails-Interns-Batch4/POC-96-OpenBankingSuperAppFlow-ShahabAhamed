"use client";

import { LiveEvent } from "../../app/page";

interface LiveOperationsStreamProps {
  events: LiveEvent[];
  onEventClick?: (txnId?: string) => void;
}

const SEVERITY_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  CRITICAL:          { color: "#F87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.15)", dot: "#EF4444" },
  HIGH:              { color: "#F87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.15)", dot: "#EF4444" },
  MEDIUM:            { color: "#FCD34D", bg: "rgba(252,211,77,0.06)",  border: "rgba(252,211,77,0.15)",  dot: "#F59E0B" },
  WARNING:           { color: "#FCD34D", bg: "rgba(252,211,77,0.06)",  border: "rgba(252,211,77,0.15)",  dot: "#F59E0B" },
  RISK:              { color: "#F59E0B", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.15)",  dot: "#D97706" },
  INFO:              { color: "#94A3B8", bg: "rgba(148,163,184,0.04)", border: "rgba(148,163,184,0.08)", dot: "#475569" },
  ROUTED:            { color: "#34D399", bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.15)",  dot: "#10B981" },
  SETTLED:           { color: "#22D3EE", bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.15)",  dot: "#06B6D4" },
  SYNC:              { color: "#A78BFA", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.15)", dot: "#8B5CF6" },
  "AML REVIEW":      { color: "#F43F5E", bg: "rgba(244,63,94,0.06)",   border: "rgba(244,63,94,0.15)",   dot: "#E11D48" },
  "ACCOUNT LINKED":  { color: "#60A5FA", bg: "rgba(96,165,250,0.06)",  border: "rgba(96,165,250,0.15)",  dot: "#3B82F6" },
  "ACCOUNT REFRESH": { color: "#818CF8", bg: "rgba(129,140,248,0.06)", border: "rgba(129,140,248,0.15)", dot: "#6366F1" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LiveOperationsStream({
  events,
  onEventClick,
}: LiveOperationsStreamProps) {
  return (
    <div
      className="rounded-xl h-full flex flex-col"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div>
          <p className="section-label mb-1">Intelligence Event Stream</p>
          <h3 className="text-white font-semibold text-base leading-none">
            Live Operations Log
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="absolute inset-0 rounded-full bg-red-400 animate-gentle-pulse opacity-40" />
            </div>
            <span className="font-mono-data text-[10px] text-red-500/70 uppercase tracking-widest">
              Live
            </span>
          </div>
          <span className="font-mono-data text-[10px] text-slate-600">
            Showing latest synthetic operational events
          </span>
        </div>
      </div>

      {/* Event list */}
      <div
        className="divide-y overflow-y-auto flex-1 custom-scrollbar min-h-0 pb-6"
        style={{
          borderColor: "rgba(255,255,255,0.03)",
        }}
      >
        {events.map((evt) => {
          const cfg = SEVERITY_CFG[evt.severity] || SEVERITY_CFG.INFO;
          return (
            <div
              key={evt.id}
              onClick={() => onEventClick && onEventClick(evt.txnId)}
              className={`px-5 py-5 flex items-start gap-4 transition-all duration-150 ${evt.txnId ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
              style={{
                animation: evt.isNew
                  ? "slide-up-fade 0.3s ease-out both"
                  : "none",
                borderColor: "rgba(255,255,255,0.03)",
              }}
            >
              {/* Severity dot */}
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                style={{ background: cfg.dot }}
              />

              {/* Timestamp */}
              <span className="font-mono-data text-[10px] text-slate-600 flex-shrink-0 mt-0.5 tabular-nums w-32">
                {evt.timestamp}
              </span>

              {/* Event ID */}
              <span
                className="font-mono-data text-[10px] font-semibold flex-shrink-0 mt-0.5 w-16"
                style={{ color: cfg.color }}
              >
                {evt.eventId}
              </span>

              {/* Message */}
              <p className="text-xs text-slate-400 leading-relaxed flex-1 min-w-0">
                {evt.message}
              </p>

              {/* Severity badge */}
              <span
                className="font-mono-data text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 self-start"
                style={{
                  color: cfg.color,
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {evt.severity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
