"use client";

import { useMemo } from "react";
import { Transaction } from "@/types/transaction";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity
} from "lucide-react";

import { calculateMetrics } from "@/lib/metrics";

interface AIInsightsEngineProps {
  transactions: Transaction[];
  previousTransactions: Transaction[];
}

interface Insight {
  category: "VOLUME" | "RISK" | "ROUTING" | "SETTLEMENT" | "OPERATIONS";
  text: string;
  color: string;
  Icon: React.ElementType;
}

const CATEGORY_COLORS: Record<string, string> = {
  VOLUME:     "#A78BFA",
  RISK:       "#F87171",
  ROUTING:    "#22D3EE",
  SETTLEMENT: "#34D399",
  OPERATIONS: "#FCD34D",
};

export default function AIInsightsEngine({ transactions, previousTransactions }: AIInsightsEngineProps) {
  const insights = useMemo<Insight[]>(() => {
    // Fallback when no data
    if (transactions.length === 0) {
      return [
        {
          category: "OPERATIONS",
          text: "Infrastructure healthy. Awaiting live data.",
          color: "#FCD34D",
          Icon: Zap,
        },
        {
          category: "VOLUME",
          text: "All endpoints accepting traffic.",
          color: "#A78BFA",
          Icon: TrendingUp,
        },
        {
          category: "SETTLEMENT",
          text: "Settlement engine initialized.",
          color: "#34D399",
          Icon: CheckCircle2,
        },
      ];
    }

    const result: Insight[] = [];
    const metrics = calculateMetrics(transactions);
    const { totalTxns: total, totalAmount, railCounts, completedCount, pendingCount } = metrics;

    // 1. VOLUME / INSTITUTION CONCENTRATION
    const instVolumes: Record<string, number> = {};
    transactions.forEach((t) => { instVolumes[t.bank] = (instVolumes[t.bank] || 0) + t.amount; });
    const topInstEntry = Object.entries(instVolumes).sort((a, b) => b[1] - a[1])[0];
    
    if (topInstEntry && totalAmount > 0) {
      const pct = Math.round((topInstEntry[1] / totalAmount) * 100);
      result.push({
        category: "VOLUME",
        text: `${topInstEntry[0]} accounts generate ${pct}% of routed volume.`,
        color: "#A78BFA",
        Icon: Activity,
      });
    }

    // 2. RISK CONCENTRATION
    const highRiskTxns = transactions.filter((t) => t.risk_level === "HIGH");
    if (highRiskTxns.length > 0) {
      const hrRailCounts: Record<string, number> = {};
      highRiskTxns.forEach((t) => { hrRailCounts[t.rail] = (hrRailCounts[t.rail] || 0) + 1; });
      const topRail = Object.entries(hrRailCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "various";
      
      result.push({
        category: "RISK",
        text: `High-risk transactions concentrated in ${topRail} settlements.`,
        color: "#F87171",
        Icon: AlertTriangle,
      });
    } else {
      result.push({
        category: "RISK",
        text: `Risk profile nominal. No threats in active batch.`,
        color: "#34D399",
        Icon: CheckCircle2,
      });
    }

    // 3. ROUTING / RAIL COMPARISON
    
    if (railCounts["WIRE"] > 0) {
      result.push({
        category: "ROUTING",
        text: `WIRE used for same-day institutional settlement.`,
        color: "#22D3EE",
        Icon: Zap,
      });
    } else {
       const prevRailCounts: Record<string, number> = {};
       previousTransactions.forEach((t) => { prevRailCounts[t.rail] = (prevRailCounts[t.rail] || 0) + 1; });
       const rtpCount = railCounts["RTP"] || 0;
       const prevRtpCount = prevRailCounts["RTP"] || 0;
       if (prevRtpCount > 0 && rtpCount !== prevRtpCount) {
         const rtpDiff = Math.round(((rtpCount - prevRtpCount) / prevRtpCount) * 100);
         result.push({
           category: "ROUTING",
           text: `RTP routing ${rtpDiff >= 0 ? 'up' : 'down'} ${Math.abs(rtpDiff)}% vs previous interval.`,
           color: "#22D3EE",
           Icon: rtpDiff >= 0 ? TrendingUp : TrendingDown,
         });
       }
    }

    // 4. SETTLEMENT COMPLETION COMPARISON
    const rate = Number(((completedCount / total) * 100).toFixed(1));

    if (rate < 100) {
      result.push({
        category: "SETTLEMENT",
        text: `${pendingCount} settlements pending final clearance.`,
        color: rate >= 70 ? "#34D399" : "#F59E0B",
        Icon: rate >= 70 ? CheckCircle2 : AlertTriangle,
      });
    } else {
      result.push({
        category: "SETTLEMENT",
        text: "100% settlement clearance achieved.",
        color: "#34D399",
        Icon: CheckCircle2,
      });
    }

    return result.slice(0, 4);
  }, [transactions, previousTransactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {insights.map((insight, i) => {
        const Icon = insight.Icon;
        const catColor = CATEGORY_COLORS[insight.category] || "#94A3B8";
        return (
          <div
            key={i}
            className="flex flex-col p-3 rounded-lg transition-all duration-150 hover:brightness-105 h-[80px] justify-between"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                style={{
                  background: `${insight.color}15`,
                  color: insight.color,
                }}
              >
                <Icon className="w-2.5 h-2.5" />
              </div>
              <span
                className="font-mono-data text-[8px] font-semibold uppercase tracking-widest"
                style={{ color: catColor }}
              >
                {insight.category}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {insight.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
