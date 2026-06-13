"use client";

import { Transaction } from "@/types/transaction";
import { Brain } from "lucide-react";
import { calculateMetrics } from "@/lib/metrics";

interface AnalyticsIntelligenceProps {
  transactions: Transaction[];
}

export default function AnalyticsIntelligence({
  transactions,
}: AnalyticsIntelligenceProps) {
  const { railPercentages, riskPercentages } = calculateMetrics(transactions);
  
  const achPct = railPercentages.ACH || 0;
  const lowRiskPct = riskPercentages.LOW || 0;

  return (
    <div
      className="premium-card rounded-xl overflow-hidden h-full flex flex-col group"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: "rgba(167,139,250,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          borderLeft: "3px solid #A78BFA",
        }}
      >
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 flex-shrink-0 text-purple-400" />
          <div className="flex-1 min-w-0">
            <p className="section-label">Executive Summary</p>
            <p className="text-white font-semibold text-sm leading-none mt-0.5">
              Analytics Intelligence
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono-data text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-md text-amber-500 bg-amber-500/10 border border-amber-500/20">
            Generated from Mock Data
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-white font-semibold">ACH</span> remained the dominant settlement corridor, processing <span className="font-mono-data text-purple-400 font-semibold">{achPct}%</span> of total volume and demonstrating stable routing efficiency.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Network security models sustained high efficacy, with <span className="font-mono-data text-emerald-400 font-semibold">{lowRiskPct}%</span> of transactions clearing low-risk thresholds and requiring zero manual intervention.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Expedited corridors like <span className="text-white font-semibold">RTP</span> successfully absorbed high-priority settlement demands without introducing systemic latency.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}
