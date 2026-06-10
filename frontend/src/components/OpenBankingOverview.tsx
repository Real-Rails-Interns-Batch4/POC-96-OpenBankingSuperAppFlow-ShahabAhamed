"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";

// ─── Static Open Banking institution data ─────────────────────────────────────

const INSTITUTIONS = [
  {
    name: "Chase",
    initials: "C",
    color: "#22D3EE",
    consentStatus: "Active",
    expiryDate: "2025-12-31",
    accounts: ["Checking", "Savings", "Credit"],
    lastSync: "2 min ago",
    syncHealth: "Healthy" as const,
    balance: "$24,150.00",
    apiVersion: "FDX 5.0",
  },
  {
    name: "Bank of America",
    initials: "B",
    color: "#34D399",
    consentStatus: "Active",
    expiryDate: "2025-11-15",
    accounts: ["Checking", "Investment"],
    lastSync: "5 min ago",
    syncHealth: "Healthy" as const,
    balance: "$8,920.50",
    apiVersion: "OBP 3.1",
  },
  {
    name: "Wells Fargo",
    initials: "W",
    color: "#A78BFA",
    consentStatus: "Active",
    expiryDate: "2025-10-08",
    accounts: ["Checking", "Savings", "Credit", "Investment"],
    lastSync: "8 min ago",
    syncHealth: "Degraded" as const,
    balance: "$18,750.00",
    apiVersion: "FDX 4.1",
  },
];

const ALL_ACCOUNT_TYPES = ["Checking", "Savings", "Credit", "Investment"];

// ─── Component ───────────────────────────────────────────────────────────────

interface OpenBankingOverviewProps {
  connectedBanksCount?: number;
}

export default function OpenBankingOverview({ connectedBanksCount }: OpenBankingOverviewProps) {
  const linkedBanks = connectedBanksCount ?? INSTITUTIONS.length;
  const allCoveredTypes = [
    ...new Set(INSTITUTIONS.flatMap((i) => i.accounts)),
  ];

  return (
    <div
      className="premium-card-secondary rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{
          background: "rgba(34,211,238,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          borderLeft: "3px solid rgba(34,211,238,0.4)",
        }}
      >
        <div>
          <h3 className="text-white font-semibold text-sm leading-none flex items-center gap-2">
            Connected Institutions
            <span className="font-mono-data text-[10px] text-cyan-500/80 uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10">
              OAuth 2.0 / FDX
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right flex items-baseline gap-2">
            <span className="section-label">Banks Linked</span>
            <span
              className="font-bold tabular-nums leading-none"
              style={{
                fontSize: "20px",
                color: "#22D3EE",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {linkedBanks}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Account coverage summary (Compact) */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
          <p className="section-label whitespace-nowrap">Account Coverage</p>
          <div className="flex flex-wrap gap-2 flex-1">
            {ALL_ACCOUNT_TYPES.map((type) => {
              const covered = allCoveredTypes.includes(type);
              return (
                <div
                  key={type}
                  className="px-2 py-1 rounded flex items-center gap-1.5"
                  style={{
                    background: covered
                      ? "rgba(52,211,153,0.06)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      covered
                        ? "rgba(52,211,153,0.15)"
                        : "rgba(255,255,255,0.04)"
                    }`,
                  }}
                >
                  <CheckCircle2
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: covered ? "#34D399" : "#334155" }}
                  />
                  <span
                    className="font-mono-data text-[9px] uppercase tracking-wider leading-none mt-0.5"
                    style={{ color: covered ? "#34D399" : "#475569" }}
                  >
                    {type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institution List (Dense Horizontal Rows) */}
        <div className="space-y-2">
          {INSTITUTIONS.map((inst, i) => (
            <div
              key={i}
              className="px-4 py-2.5 rounded-lg transition-all duration-150 hover:bg-white/[0.03] flex items-center gap-4"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Logo & Name */}
              <div className="flex items-center gap-3 w-48 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 font-bold text-xs"
                  style={{
                    background: `${inst.color}12`,
                    color: inst.color,
                    border: `1px solid ${inst.color}25`,
                  }}
                >
                  {inst.initials}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">
                    {inst.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: inst.syncHealth === "Healthy" ? "#34D399" : "#F59E0B",
                        animation: inst.syncHealth !== "Healthy" ? "status-pulse 2s ease-in-out infinite" : "none",
                      }}
                    />
                    <span
                      className="font-mono-data text-[8px] font-semibold uppercase tracking-wider"
                      style={{ color: inst.consentStatus === "Active" ? "#34D399" : "#F59E0B" }}
                    >
                      {inst.consentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Types */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1">
                  {inst.accounts.map((acc) => (
                    <span
                      key={acc}
                      className="font-mono-data text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: "#64748B",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {acc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Standard & Sync */}
              <div className="w-40 flex-shrink-0 flex flex-col items-end gap-1">
                <span
                  className="font-mono-data text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center"
                  style={{
                    background: `${inst.color}08`,
                    color: inst.color,
                    border: `1px solid ${inst.color}20`,
                  }}
                >
                  {inst.apiVersion}
                </span>
                <div className="flex items-center gap-1 text-slate-500">
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span className="font-mono-data text-[9px]">{inst.lastSync}</span>
                </div>
              </div>

              {/* Balance */}
              <div className="w-24 flex-shrink-0 text-right">
                <span className="font-mono-data text-xs font-semibold text-white tabular-nums tracking-tight">
                  {inst.balance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
