"use client";

// Pipeline nodes — visual only, no business logic
const PIPELINE_NODES = [
  {
    id: "bank",
    label: "Connected Bank",
    value: "Chase",
    sublabel: "Primary Institution",
    status: "ACTIVE",
    accentColor: "#06B6D4",
    accentBg: "rgba(6,182,212,0.06)",
    accentBorder: "rgba(6,182,212,0.18)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V7m0 0L4 10.5M12 7l8 3.5M4 10.5V19a1 1 0 001 1h14a1 1 0 001-1v-8.5M4 10.5h16" />
      </svg>
    ),
  },
  {
    id: "consent",
    label: "Consent Layer",
    value: "Approved",
    sublabel: "OAuth 2.0 · Plaid",
    status: "VERIFIED",
    accentColor: "#10B981",
    accentBg: "rgba(16,185,129,0.05)",
    accentBorder: "rgba(16,185,129,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: "risk",
    label: "Risk Engine",
    value: "Score: 12",
    sublabel: "ML Model v4.2",
    status: "NOMINAL",
    accentColor: "#F59E0B",
    accentBg: "rgba(245,158,11,0.05)",
    accentBorder: "rgba(245,158,11,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: "rail",
    label: "Rail Selected",
    value: "ACH",
    sublabel: "Optimal Route",
    status: "ROUTING",
    accentColor: "#06B6D4",
    accentBg: "rgba(6,182,212,0.06)",
    accentBorder: "rgba(6,182,212,0.18)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    id: "settlement",
    label: "Settlement",
    value: "Complete",
    sublabel: "T+1 · FedNow",
    status: "SETTLED",
    accentColor: "#10B981",
    accentBg: "rgba(16,185,129,0.06)",
    accentBorder: "rgba(16,185,129,0.18)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75h-.75m0 0h-1.5m1.5 0v-9m0 0H3.75" />
      </svg>
    ),
  },
];

// Animated connector between nodes
function FlowConnector({ glowColor }: { glowColor: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-2 min-w-[24px]">
      <div
        className="flow-line relative w-full h-px overflow-hidden"
        style={{ 
          background: "rgba(255,255,255,0.1)",
          boxShadow: `0 0 8px ${glowColor}40`
        }}
      >
        {/* Animated Data Sweep */}
        <div 
          className="absolute inset-0 h-full animate-data-sweep"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          }}
        />
        {/* Static arrow tip */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderTop: "4px solid transparent",
            borderBottom: "4px solid transparent",
            borderLeft: "6px solid rgba(255,255,255,0.4)",
          }}
        />
      </div>
    </div>
  );
}

export default function RailFlowEngine() {
  return (
    <div
      className="premium-card rounded-xl p-6"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center gap-4 mb-1.5">
          <p className="section-label mb-0">Payment Orchestration Pipeline</p>
          <div className="flex items-center gap-2 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            <div className="relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-gentle-pulse" />
            </div>
            <span className="font-mono-data text-[9px] text-cyan-500 uppercase tracking-widest leading-none pt-0.5">
              Pipeline Active
            </span>
          </div>
        </div>
        <h3 className="text-white font-semibold text-base leading-none mt-1">
          Hybrid Rail Flow Engine
        </h3>
        <p className="text-slate-500 text-xs mt-1.5">
          Intelligent routing pipeline for open banking payment settlement
        </p>
      </div>

      {/* Flow */}
      <div className="flex items-center w-full overflow-x-auto pt-6 pb-4">
        {PIPELINE_NODES.map((node, index) => {
          const isLast = index === PIPELINE_NODES.length - 1;
          const elements = [
            <div
              key={`${node.id}-node`}
              className="premium-card-secondary w-[180px] shrink-0 rounded-lg p-5 flex flex-col justify-center gap-2.5 cursor-default relative"
              style={{
                background: node.accentBg,
                border: `1px solid ${node.accentBorder}`,
                boxShadow: `0 0 20px ${node.accentColor}08 inset`,
              }}
            >
              {/* Decision Confidence Indicator */}
              {node.id === "rail" && (
                <div 
                  className="absolute -top-2.5 -right-2 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono-data text-cyan-400 whitespace-nowrap shadow-sm shadow-cyan-500/10"
                >
                  94% CONF
                </div>
              )}
              {/* Icon + status */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-md"
                  style={{
                    color: node.accentColor,
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  {node.icon}
                </div>
                <span
                  className="font-mono-data text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    color: node.accentColor,
                    background: "rgba(0,0,0,0.25)",
                    opacity: 0.9,
                  }}
                >
                  {node.status}
                </span>
              </div>

              {/* Label */}
              <div className="mt-1">
                <p className="section-label mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>
                  {node.label}
                </p>
                {/* Value */}
                <p
                  className="text-sm font-bold leading-none"
                  style={{ color: node.accentColor }}
                >
                  {node.value}
                </p>
              </div>

              {/* Sublabel */}
              <p className="font-mono-data text-[10px] text-slate-500 mt-0.5">
                {node.sublabel}
              </p>
            </div>
          ];

          if (!isLast) {
            elements.push(<FlowConnector key={`${node.id}-conn`} glowColor={node.accentColor} />);
          }

          return elements;
        })}
      </div>
    </div>
  );
}