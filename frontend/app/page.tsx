"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Transaction } from "@/types/transaction";

// ─── Existing components ──────────────────────────────────────────────────────
import RailFlowEngine      from "@/components/RailFlowEngine";
import AnalyticsGrid       from "@/components/AnalyticsGrid";
import SystemStatusBar     from "@/components/SystemStatusBar";
import LiveClock           from "@/components/LiveClock";

// ─── New Phase-2 & 3 components ───────────────────────────────────────────────
import AIInsightsEngine      from "@/components/AIInsightsEngine";
import BackendHealthMonitor  from "@/components/BackendHealthMonitor";
import TransactionDrawer     from "@/components/TransactionDrawer";
import LiveOperationsStream  from "@/components/LiveOperationsStream";
import RoutingSimulator      from "@/components/RoutingSimulator";
import RailIntelligenceEngine from "@/components/RailIntelligenceEngine";
import OpenBankingOverview   from "@/components/OpenBankingOverview";
import type { SimResult, SimInput } from "@/components/RoutingSimulator";

// ─── APIs ─────────────────────────────────────────────────────────────────────
import { fetchTransactions, fetchSourceStatus } from "@/lib/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Percent,
  Server,
  ShieldAlert,
  Terminal,
  Timer,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

// =============================================================================
// MOCK FALLBACK DATA
// =============================================================================

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "mock-1",
    user: "alice.morgan",
    bank: "Chase",
    amount: 4200.0,
    rail: "ACH",
    risk_score: 22,
    risk_level: "LOW",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-2",
    user: "bob.hayes",
    bank: "Wells Fargo",
    amount: 18750.5,
    rail: "WIRE",
    risk_score: 71,
    risk_level: "HIGH",
    status: "PENDING",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-3",
    user: "carol.chen",
    bank: "Bank of America",
    amount: 950.25,
    rail: "RTP",
    risk_score: 45,
    risk_level: "MEDIUM",
    status: "PROCESSING",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-4",
    user: "david.osei",
    bank: "Citibank",
    amount: 2100.0,
    rail: "ACH",
    risk_score: 15,
    risk_level: "LOW",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-5",
    user: "emma.silva",
    bank: "Goldman Sachs",
    amount: 7300.75,
    rail: "WIRE",
    risk_score: 58,
    risk_level: "MEDIUM",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-6",
    user: "frank.zhou",
    bank: "Chase",
    amount: 320.0,
    rail: "RTP",
    risk_score: 82,
    risk_level: "HIGH",
    status: "PENDING",
    timestamp: new Date().toISOString(),
  },
];

const POLL_INTERVAL_MS = 5000;

type TabId = "OVERVIEW" | "ANALYTICS" | "OPERATIONS" | "SIMULATION";

interface Notification {
  id: string;
  timestamp: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "INFO";
}

// =============================================================================
// PAGE
// =============================================================================

export interface TelemetrySnapshot {
  timestamp: string;
  volume: number;
  count: number;
  risk: number;
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  eventId: string;
  severity: "HIGH" | "MEDIUM" | "INFO";
  type: string;
  message: string;
  isNew?: boolean;
  txnId?: string;
}

export default function DashboardPage() {
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [previousTransactions, setPreviousTransactions] = useState<Transaction[]>([]);
  const transactions = useMemo(() => {
    return rawTransactions;
  }, [rawTransactions]);
  const [sourceMode, setSourceMode]     = useState("MOCK");
  const [dataMode, setDataMode]         = useState<"LIVE" | "MOCK">("MOCK");
  const [apiLatency, setApiLatency]     = useState<number>(0);
  const [apiStatus, setApiStatus]       = useState<"ONLINE" | "OFFLINE" | "DEGRADED">("ONLINE");
  const [loading, setLoading]           = useState(true);
  const [selectedTxn, setSelectedTxn]   = useState<Transaction | null>(null);
  
  // Phase 4 States
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySnapshot[]>([]);
  const [operationsLog, setOperationsLog] = useState<LiveEvent[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabId>("OVERVIEW");

  // Routing simulator state — shared with Rail Intelligence Engine
  const [simRouting, setSimRouting] = useState<{ result: SimResult; input: SimInput } | null>(null);

  const handleSimResultChange = useCallback((result: SimResult, input: SimInput) => {
    setSimRouting({ result, input });
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived Source State
  let sourceState: "LIVE_API" | "MOCK_MODE" | "OFFLINE_FALLBACK" = "MOCK_MODE";
  if (apiStatus === "OFFLINE") sourceState = "OFFLINE_FALLBACK";
  else if (dataMode === "LIVE") sourceState = "LIVE_API";

  const prevSourceStateRef = useRef(sourceState);

  useEffect(() => {
    if (prevSourceStateRef.current !== sourceState && !loading) {
      if (sourceState === "MOCK_MODE" || sourceState === "OFFLINE_FALLBACK") {
        setToastMessage("Backend unavailable. Switching to simulation mode.");
      } else if (sourceState === "LIVE_API") {
        setToastMessage("Simulation mode ended. Live banking services restored.");
      }
      prevSourceStateRef.current = sourceState;
      
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [sourceState, loading]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventCycleRef = useRef(0);
  const [highlightedTxnId, setHighlightedTxnId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // BACKEND POLLING
  // ---------------------------------------------------------------------------

  const addNotification = useCallback((msg: string, sev: Notification["severity"]) => {
    setNotifications(prev => {
      const newNotif = {
        id: Math.random().toString(36).slice(2, 10),
        timestamp: new Date().toLocaleTimeString(),
        message: msg,
        severity: sev
      };
      return [newNotif, ...prev].slice(0, 20); // Keep last 20
    });
    setUnreadNotifications(prev => prev + 1);
  }, []);

  async function pollBackend() {
    const start = performance.now();
    try {
      const data = await fetchTransactions();
      const latency = Math.round(performance.now() - start);
      setApiLatency(latency);
      setApiStatus(latency > 800 ? "DEGRADED" : "ONLINE");

      if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
        setRawTransactions(prev => {
          setPreviousTransactions(prev);
          
          // Generate notifications for new high risk txns
          const prevIds = new Set(prev.map(t => t.id));
          const newTxns = data.transactions.filter((t: Transaction) => !prevIds.has(t.id));
          const newHighRisk = newTxns.filter((t: Transaction) => t.risk_level === "HIGH");
          
          newHighRisk.forEach((t: Transaction) => {
            addNotification(`HIGH risk transaction flagged: ${t.id} ($${t.amount})`, "HIGH");
          });

          // Generate operation logs rotating through event types
          const newEvents: LiveEvent[] = [];
          const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          
          if (newTxns.length > 0) {
            const t = newTxns[0]; // Pick one transaction to anchor the event
            const cycleIdx = eventCycleRef.current % 8;
            eventCycleRef.current += 1;
            
            const eventIdNum = Math.floor(Math.random() * 900) + 100;
            
            if (cycleIdx === 0) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `ROUTE-${eventIdNum}`,
                severity: "ROUTED",
                type: "ROUTE",
                message: `New transaction routed via ${t.rail} for ${t.user}. Routing optimal.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 1) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `RISK-${eventIdNum}`,
                severity: t.risk_level === "HIGH" || t.risk_level === "CRITICAL" ? "CRITICAL" : "RISK",
                type: "RISK",
                message: `Risk engine completed evaluation for ${t.bank} transfer. Score: ${t.risk_score}.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 2) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `SETTLE-${eventIdNum}`,
                severity: "SETTLED",
                type: "SETTLE",
                message: `Settlement acknowledged for ${t.rail} transfer. Funds moving to ledger.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 3) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `CONSENT-${eventIdNum}`,
                severity: "CONSENT",
                type: "CONSENT",
                message: `User ${t.user} consent verified for Open Banking data access.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 4) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `SYNC-${eventIdNum}`,
                severity: "SYNC",
                type: "SYNC",
                message: `Core banking ledger synchronized with Gateway for ${t.bank}.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 5) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `AML-${eventIdNum}`,
                severity: "AML REVIEW",
                type: "AML",
                message: `Automated AML checks cleared for ${t.user}.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 6) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `LINK-${eventIdNum}`,
                severity: "ACCOUNT LINKED",
                type: "LINK",
                message: `New external account successfully linked at ${t.bank}.`,
                isNew: true,
                txnId: t.id
              });
            } else if (cycleIdx === 7) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `REFRESH-${eventIdNum}`,
                severity: "ACCOUNT REFRESH",
                type: "REFRESH",
                message: `Real-time balance snapshot requested for ${t.user}.`,
                isNew: true,
                txnId: t.id
              });
            }
          }

          if (newEvents.length > 0) {
            setOperationsLog(logPrev => {
              const cleared = logPrev.map(e => ({ ...e, isNew: false }));
              return [...newEvents, ...cleared].slice(0, 50);
            });
          }

          return data.transactions;
        });

        // Update telemetry
        setTelemetryHistory(prev => {
           const vol = data.transactions.reduce((acc: number, t: Transaction) => acc + t.amount, 0);
           const riskAvg = data.transactions.reduce((acc: number, t: Transaction) => acc + t.risk_score, 0) / Math.max(data.transactions.length, 1);
           const point: TelemetrySnapshot = {
             timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
             volume: vol,
             count: data.transactions.length,
             risk: Math.round(riskAvg)
           };
           // Prevent exact duplicate timestamp keys by just keeping array max 60 length.
           // However, if we want chronological labels every 5s, we can just append. 
           // If we append 1 per 5s, some strings will be identical ("18:18").
           // Let's keep seconds in timestamp to make it unique on x-axis.
           point.timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
           return [...prev, point].slice(-60);
        });

        setDataMode("LIVE");
        return;
      }
      // Fallback
      setRawTransactions(prev => {
        setPreviousTransactions(prev);
        return MOCK_TRANSACTIONS;
      });
      setDataMode("MOCK");
    } catch {
      setApiStatus("OFFLINE");
      setApiLatency(0);
      setRawTransactions(prev => {
        setPreviousTransactions(prev);
        return MOCK_TRANSACTIONS;
      });
      setDataMode("MOCK");
    }
  }

  // ---------------------------------------------------------------------------
  // BOOTSTRAP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function bootstrap() {
      try {
        const status = await fetchSourceStatus();
        setSourceMode(status.mode || "MOCK");
      } catch {
        setSourceMode("MOCK");
      }

      await pollBackend();
      setLoading(false);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(pollBackend, POLL_INTERVAL_MS);
    }

    bootstrap();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // EXPORTS
  // ---------------------------------------------------------------------------
  
  const exportCSV = useCallback(() => {
    const headers = ["ID", "User", "Bank", "Amount", "Rail", "Risk Level", "Risk Score", "Status", "Timestamp"];
    const rows = transactions.map(t => [t.id, t.user, t.bank, t.amount, t.rail, t.risk_level, t.risk_score, t.status, t.timestamp].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obir_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obir_ledger_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions]);

  // ---------------------------------------------------------------------------
  // KPI CALCULATIONS (Unconditional Hooks)
  // ---------------------------------------------------------------------------

  const {
    connectedBanks,
    totalAmount,
    riskAlerts,
    clearedAnomalies,
    successRateStr,
    avgSettlementLabel,
    threatLevel,
    railCounts,
    railPercentages
  } = useMemo(() => {
    // Current state
    const connectedBanks = new Set(transactions.map(t => t.bank)).size;
    const totalAmount = transactions.reduce((acc, t) => acc + t.amount, 0);
    const riskAlerts = transactions.filter(t => t.risk_level === "HIGH").length;
    
    const completedCount = transactions.filter(t => t.status === "COMPLETED").length;
    const totalTxns = Math.max(transactions.length, 1);
    const successRateStr = ((completedCount / totalTxns) * 100).toFixed(1);

    let totalHours = 0;
    const rc: Record<string, number> = {};
    transactions.forEach(t => {
      rc[t.rail] = (rc[t.rail] || 0) + 1;
      if (t.rail === "ACH") totalHours += 24;
      else if (t.rail === "WIRE") totalHours += 2;
    });
    
    // Exact rail percentages summing to 100%
    let railSum = 0;
    const railPercentages: Record<string, number> = {};
    if (transactions.length > 0) {
      ["ACH", "WIRE"].forEach(rail => {
        const pct = Math.round(((rc[rail] || 0) / transactions.length) * 100);
        railPercentages[rail] = pct;
        railSum += pct;
      });
      railPercentages["RTP"] = Math.max(0, 100 - railSum);
    } else {
      railPercentages["ACH"] = 0;
      railPercentages["WIRE"] = 0;
      railPercentages["RTP"] = 0;
    }

    const avgHrs = totalHours / totalTxns;
    const avgSettlementLabel = avgHrs < 1 ? "< 1 hr" : `${avgHrs.toFixed(1)} hrs`;

    // Threat Level
    const detectedAnomalies = riskAlerts;
    const clearedAnomalies = transactions.filter(t => t.risk_level === "HIGH" && t.status === "COMPLETED").length;
    const activeThreats = Math.max(0, detectedAnomalies - clearedAnomalies);

    let threatLevel: "LOW" | "GUARDED" | "ELEVATED" | "CRITICAL" = "LOW";
    if (activeThreats >= 8) threatLevel = "CRITICAL";
    else if (activeThreats >= 4) threatLevel = "ELEVATED";
    else if (activeThreats >= 1) threatLevel = "GUARDED";

    return { connectedBanks, totalAmount, riskAlerts, clearedAnomalies, successRateStr, avgSettlementLabel, threatLevel, railCounts: rc, railPercentages };
  }, [transactions]);

  const {
    prevConnectedBanks,
    prevTotalAmount,
    prevRiskAlerts,
    prevSuccessRateStr,
    prevAvgSettlementHrs
  } = useMemo(() => {
    const prevConnectedBanks = new Set(previousTransactions.map(t => t.bank)).size;
    const prevTotalAmount = previousTransactions.reduce((acc, t) => acc + t.amount, 0);
    const prevRiskAlerts = previousTransactions.filter(t => t.risk_level === "HIGH").length;
    
    const completedCount = previousTransactions.filter(t => t.status === "COMPLETED").length;
    const totalTxns = Math.max(previousTransactions.length, 1);
    const prevSuccessRateStr = ((completedCount / totalTxns) * 100).toFixed(1);

    let totalHours = 0;
    previousTransactions.forEach(t => {
      if (t.rail === "ACH") totalHours += 24;
      else if (t.rail === "WIRE") totalHours += 2;
    });
    const prevAvgSettlementHrs = totalHours / totalTxns;

    return { prevConnectedBanks, prevTotalAmount, prevRiskAlerts, prevSuccessRateStr, prevAvgSettlementHrs };
  }, [previousTransactions]);

  // Derived Trend values
  const getTrend = (current: number, prev: number) => {
    if (prev === 0) return { trend: "neutral" as const, text: "" };
    const diff = current - prev;
    if (diff > 0) return { trend: "up" as const, text: `↑ ${((diff / prev) * 100).toFixed(1)}%` };
    if (diff < 0) return { trend: "down" as const, text: `↓ ${((Math.abs(diff) / prev) * 100).toFixed(1)}%` };
    return { trend: "neutral" as const, text: "No change" };
  };

  const getSuccessTrend = (current: number, prev: number): { trend: "up" | "down"; text: string } => {
    const diff = current - prev;
    return {
        trend: diff >= 0 ? "up" : "down" as const,
        text: `${Math.abs(diff).toFixed(1)}% vs prev`
    };
  };

  const amountTrend = getTrend(totalAmount, prevTotalAmount);
  const riskTrend = getTrend(riskAlerts, prevRiskAlerts);
  const successTrend = getSuccessTrend(Number(successRateStr), Number(prevSuccessRateStr));
  
  // Settlement trend: lower is better
  let settlementTrend: "up" | "down" | "neutral" = "neutral";
  let settlementText = "";
  const currentAvgHrs = totalAmount > 0 ? (avgSettlementLabel === "< 1 hr" ? 0.5 : parseFloat(avgSettlementLabel)) : 0;
  if (prevAvgSettlementHrs > 0) {
    if (currentAvgHrs < prevAvgSettlementHrs) { settlementTrend = "up"; settlementText = `↓ improved`; }
    else if (currentAvgHrs > prevAvgSettlementHrs) { settlementTrend = "down"; settlementText = `↑ slower`; }
  }


  // ---------------------------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="w-full max-w-sm px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight">OBIR Platform</p>
              <p className="section-label text-cyan-600">Initializing...</p>
            </div>
          </div>

          {/* Boot lines */}
          <div className="space-y-2 mb-8 font-mono-data text-[11px]">
            {[
              { text: "Connecting to financial intelligence rail...", color: "text-cyan-500" },
              { text: "Loading payment orchestration engine...",      color: "text-slate-500" },
              { text: "Establishing risk analysis context...",        color: "text-slate-500" },
              { text: "Awaiting data feed confirmation...",           color: "text-slate-600" },
            ].map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{ animation: `fade-in 0.4s ease-out ${i * 0.15}s both` }}
              >
                <span className={line.color} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {">"}
                </span>
                <span className="text-slate-500">{line.text}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div
            className="relative h-px w-full rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: "60%",
                background: "linear-gradient(90deg, #22D3EE, #06B6D4)",
                animation: "shimmer 2s linear infinite",
                backgroundSize: "200% auto",
              }}
            />
          </div>

          <p className="font-mono-data text-[10px] text-slate-600 mt-3 text-center tracking-widest">
            OPEN BANKING INTELLIGENCE RAIL
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <main
      className="min-h-screen relative"
      style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
      onClick={() => { if(showNotifications) setShowNotifications(false); }}
    >
      {/* Subtle ambient gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.04) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-[1680px] mx-auto px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">

        {/* ====================================================================
            HEADER
        ==================================================================== */}

        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

            {/* Brand & Title */}
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-0.5"
                style={{
                  background: "rgba(34,211,238,0.08)",
                  border: "1px solid rgba(34,211,238,0.15)",
                  boxShadow: "0 0 24px rgba(34,211,238,0.06)",
                }}
              >
                <Terminal className="w-6 h-6 text-cyan-400" />
              </div>

              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none"
                  style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.025em" }}
                >
                  Open Banking Intelligence Rail
                </h1>
                <p className="section-label mt-2 text-slate-600">
                  Hybrid Payments Orchestration Platform · Enterprise Edition
                </p>

                {/* Status tags */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <DataSourceBadge mode={dataMode} status={apiStatus} latency={apiLatency} />

                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-help relative group"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="section-label text-slate-500">
                      {sourceMode} SOURCE
                    </span>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-0 w-48 p-2 rounded bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-700 shadow-xl">
                      Original source of truth. Usually the python backend API or fallback state.
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-help relative group"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="section-label text-slate-500">POLL 5s</span>
                     {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-0 w-40 p-2 rounded bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-700 shadow-xl">
                      Fetching new transactions every 5 seconds.
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right side Header */}
            <div className="flex items-center gap-6 lg:flex-shrink-0">
              
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setUnreadNotifications(0); }}
                  className="relative p-2 rounded-lg transition-colors hover:bg-slate-800"
                >
                  <Bell className="w-5 h-5 text-slate-400" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div 
                    className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl z-50 shadow-2xl"
                    style={{
                      background: "rgba(15,23,42,0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-sm font-semibold text-white">Operations Center</span>
                      <span className="text-[10px] text-slate-500 font-mono-data">{notifications.length} EVENTS</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No recent notifications</div>
                    ) : (
                      <div className="divide-y divide-slate-800/50">
                        {notifications.map(n => (
                          <div key={n.id} className="p-3 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${n.severity === 'HIGH' ? 'text-red-400' : 'text-slate-400'}`}>
                                {n.severity}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono-data">{n.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-snug">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <LiveClock />
            </div>
          </div>

          {/* Separator */}
          <div
            className="mt-6 h-px"
            style={{
              background:
                "linear-gradient(to right, rgba(34,211,238,0.15), rgba(255,255,255,0.04) 40%, transparent)",
            }}
          />
        </header>

        {/* ====================================================================
            SYSTEM STATUS BAR
        ==================================================================== */}

        <SystemStatusBar sourceState={sourceState} />

        {/* ====================================================================
            TAB NAVIGATION
        ==================================================================== */}

        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-px overflow-x-auto">
          {(["OVERVIEW", "ANALYTICS", "OPERATIONS", "SIMULATION"] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-semibold tracking-wide transition-all relative whitespace-nowrap"
              style={{
                color: activeTab === tab ? "#fff" : "#64748B",
              }}
            >
              {tab}
              {activeTab === tab && (
                <div 
                  className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full"
                  style={{ background: "#22D3EE", boxShadow: "0 -2px 10px rgba(34,211,238,0.4)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ====================================================================
            MAIN LAYOUT
        ==================================================================== */}

        <div className="flex flex-col gap-12 xl:gap-16">

          {/* TAB: OVERVIEW */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-12 xl:space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* SECTION 1: Executive Summary */}
              <div>
                <SectionHeader label="Executive Summary" />
                
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {/* Row 1 */}
                  <KpiCard
                    title="Connected Institutions"
                    value={connectedBanks.toString()}
                    subValue="Unique Banks linked"
                    icon={CreditCard}
                    accentColor="#22D3EE"
                    trend="neutral"
                  />
                  <KpiCard
                    title="Payments Routed"
                    value={`$${
                      totalAmount >= 1000
                        ? (totalAmount / 1000).toFixed(1) + "K"
                        : totalAmount.toFixed(0)
                    }`}
                    subValue="Total session volume"
                    icon={ArrowRightLeft}
                    accentColor="#22D3EE"
                    trend="neutral"
                  />
                  <KpiCard
                    title="Transactions Processed"
                    value={Math.max(transactions.length, 0).toString()}
                    subValue="Total volume count"
                    icon={Activity}
                    accentColor="#34D399"
                    trend="neutral"
                  />
                  <KpiCard
                    title="Risk Alerts"
                    value={riskAlerts.toString()}
                    subValue={riskAlerts > 0 ? "Detected anomalies" : "No active threats"}
                    icon={AlertTriangle}
                    accentColor={riskAlerts >= 4 ? "#EF4444" : riskAlerts > 0 ? "#F59E0B" : "#10B981"}
                    trend="neutral"
                    alert={riskAlerts >= 4}
                  />
                  {/* Row 2 */}
                  <KpiCard
                    title="Settlement Success"
                    value={`${successRateStr}%`}
                    subValue={`${transactions.filter(t=>t.status==='COMPLETED').length} settled`}
                    icon={Percent}
                    accentColor={Number(successRateStr) >= 70 ? "#34D399" : "#F59E0B"}
                    trend="neutral"
                  />
                  <KpiCard
                    title="Avg Settlement Time"
                    value={avgSettlementLabel}
                    subValue="Weighted average"
                    icon={Timer}
                    accentColor="#A78BFA"
                    trend="neutral"
                  />
                  <KpiCard
                    title="Primary Rail"
                    value={Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                    subValue="Highest volume route"
                    icon={Zap}
                    accentColor="#34D399"
                    trend="neutral"
                  />
                  <KpiCard
                    title="Current Threat Level"
                    value={threatLevel}
                    subValue={Math.max(0, riskAlerts - clearedAnomalies) + " Active Threats"}
                    icon={ShieldAlert}
                    accentColor={threatLevel === "CRITICAL" || threatLevel === "ELEVATED" ? "#EF4444" : threatLevel === "GUARDED" ? "#F59E0B" : "#10B981"}
                    trend="neutral"
                    alert={threatLevel === "CRITICAL" || threatLevel === "ELEVATED"}
                  />
                </div>

                {/* AI Insights Engine */}
                <IntelligenceModule
                  title="AI Insights Engine"
                  label="Executive Briefing"
                  icon={Brain}
                  accentColor="#A78BFA"
                  accentBg="rgba(167,139,250,0.06)"
                  accentBorder="rgba(167,139,250,0.15)"
                >
                  <AIInsightsEngine transactions={transactions} previousTransactions={previousTransactions} />
                </IntelligenceModule>
              </div>

              {/* SECTION 2: Connected Institutions */}
              <div>
                <SectionHeader label="Connected Institutions" />
                <OpenBankingOverview connectedBanksCount={connectedBanks} />
              </div>

              {/* SECTION 3: Payment Orchestration */}
              <div>
                <SectionHeader label="Payment Orchestration" />
                <RailFlowEngine />
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === "ANALYTICS" && (
            <div className="space-y-12 xl:space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AnalyticsGrid transactions={transactions} telemetryHistory={telemetryHistory} />
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Active Rails */}
                <div
                  className="rounded-xl overflow-hidden p-5 flex flex-col h-full"
                  style={{
                    background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="mb-4">
                    <p className="section-label mb-1">Active Rails</p>
                    <h3 className="text-white font-semibold text-base leading-none">
                      Rail Telemetry
                    </h3>
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col justify-between">
                    <RailTelemetryRow
                      name="ACH"
                      status="Optimal"
                      load={railPercentages["ACH"]}
                      latency="24ms"
                    />
                    <RailTelemetryRow
                      name="WIRE"
                      status="Optimal"
                      load={railPercentages["WIRE"]}
                      latency="8ms"
                    />
                    <RailTelemetryRow
                      name="RTP"
                      status={railCounts["RTP"] > 1 ? "Degraded" : "Optimal"}
                      load={railPercentages["RTP"]}
                      latency="94ms"
                      context={railCounts["RTP"] > 1 ? "Latency above target threshold" : undefined}
                    />
                  </div>
                </div>

                {/* Detailed Risk Metrics */}
                <div
                  className="rounded-xl overflow-hidden p-5 flex flex-col h-full"
                  style={{
                    background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="mb-4">
                    <p className="section-label mb-1">Detailed Risk Metrics</p>
                    <h3 className="text-white font-semibold text-base leading-none">
                      Threat Assessment
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="section-label mb-2">Transactions Analyzed</p>
                      <p className="text-3xl font-bold text-white leading-none font-mono-data tracking-tight">
                        {transactions.length}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="section-label mb-2">Detected Anomalies</p>
                      <p className="text-3xl font-bold text-amber-500 leading-none font-mono-data tracking-tight">
                        {riskAlerts}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="section-label mb-2">Cleared Anomalies</p>
                      <p className="text-3xl font-bold text-emerald-500 leading-none font-mono-data tracking-tight">
                        {clearedAnomalies}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="section-label mb-2">Active Threats</p>
                      <p className="text-3xl font-bold text-red-500 leading-none font-mono-data tracking-tight">
                        {Math.max(0, riskAlerts - clearedAnomalies)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OPERATIONS */}
          {activeTab === "OPERATIONS" && (
            <div className="space-y-6 xl:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 flex flex-col h-[320px]">
                  <SectionHeader label="Operational Intelligence Feed" />
                  <div className="flex-1 min-h-0">
                    <LiveOperationsStream 
                      events={operationsLog} 
                      onEventClick={(txnId) => {
                        if (txnId) {
                          setHighlightedTxnId(txnId);
                          const el = document.getElementById(`txn-${txnId}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setTimeout(() => setHighlightedTxnId(null), 3000);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="xl:col-span-1 flex flex-col h-[320px]">
                  <SectionHeader label="System Health" />
                  <div className="flex-1 min-h-0">
                    <IntelligenceModule
                      title="Backend Health Monitor"
                      label="Service Status"
                      icon={Activity}
                      accentColor="#22D3EE"
                      accentBg="rgba(34,211,238,0.04)"
                      accentBorder="rgba(34,211,238,0.12)"
                    >
                      <BackendHealthMonitor apiStatus={apiStatus} apiLatency={apiLatency} transactions={transactions} sourceState={sourceState} />
                    </IntelligenceModule>
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader label="Transaction Ledger" />

                <div
                  className="rounded-xl overflow-hidden flex flex-col h-[400px]"
                  style={{
                    background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Table header bar */}
                  <div
                    className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
                    style={{
                      background: "rgba(8,17,32,0.92)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-cyan-500/70" />
                      <h2 className="text-sm font-semibold text-white tracking-tight">
                        Transaction Ledger
                      </h2>
                      <span
                        className="font-mono-data text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(34,211,238,0.08)",
                          color: "rgba(34,211,238,0.7)",
                          border: "1px solid rgba(34,211,238,0.12)",
                        }}
                      >
                        {transactions.length} Records
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Pagination placeholder banner */}
                      <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
                        Showing 1–{Math.min(transactions.length, 50)} of {transactions.length}
                      </span>
                      {/* Exports */}
                      <div className="flex items-center gap-1.5">
                        <button onClick={exportCSV} className="flex items-center gap-1 text-[10px] uppercase font-mono-data tracking-wider px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-300 border border-white/10">
                          <Download className="w-3 h-3" /> CSV
                        </button>
                        <button onClick={exportJSON} className="flex items-center gap-1 text-[10px] uppercase font-mono-data tracking-wider px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-300 border border-white/10">
                          <Download className="w-3 h-3" /> JSON
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <table className="w-full text-left text-sm table-fixed mb-4">
                      <thead className="sticky top-0 z-10">
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {[
                            { name: "User", width: "16%", pad: "pl-6 pr-3" },
                            { name: "Institution", width: "16%", pad: "px-3" },
                            { name: "Amount", width: "14%", pad: "px-3" },
                            { name: "Rail", width: "10%", pad: "px-3" },
                            { name: "Risk Score", width: "15%", pad: "px-3" },
                            { name: "Status", width: "14%", pad: "px-3" },
                            { name: "Timestamp", width: "15%", pad: "pl-3 pr-8" },
                          ].map(
                            (col) => (
                              <th
                                key={col.name}
                                className={`${col.pad} py-3.5 font-semibold`}
                                style={{
                                  width: col.width,
                                  fontSize: "10px",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  color: "#475569",
                                  background: "rgba(2,6,23,0.95)",
                                  backdropFilter: "blur(8px)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {col.name}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-12 text-center"
                              style={{ color: "var(--text-dim)" }}
                            >
                              <div className="flex flex-col items-center gap-3">
                                <BarChart3 className="w-8 h-8 text-slate-700" />
                                <p className="font-mono-data text-xs text-slate-600">
                                  No transaction data available
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          transactions.slice(0, 50).map((txn, idx) => (
                            <LedgerRow
                              key={txn.id}
                              txn={txn}
                              isLast={idx === Math.min(transactions.length, 50) - 1}
                              onClick={() => setSelectedTxn(txn)}
                              isHighlighted={highlightedTxnId === txn.id}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {transactions.length > 50 && (
                    <div className="px-6 py-3 border-t flex justify-between items-center bg-white/5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest">
                        Click row to drill down
                      </span>
                      <div className="flex gap-2 items-center">
                        <button className="text-[10px] font-mono-data text-slate-400 hover:text-white transition-colors disabled:opacity-50 mr-2" disabled>
                          PREV
                        </button>
                        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono-data bg-cyan-500/20 text-cyan-400">1</span>
                        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono-data text-slate-500">2</span>
                        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono-data text-slate-500">3</span>
                        <button className="text-[10px] font-mono-data text-slate-400 hover:text-white transition-colors ml-2">
                          NEXT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SIMULATION */}
          {activeTab === "SIMULATION" && (
            <div className="space-y-6 xl:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <SectionHeader label="Decision Intelligence" />
                <RoutingSimulator onResultChange={handleSimResultChange} />
              </div>
              {simRouting && (
                <div>
                  <SectionHeader label="Rail Governance &amp; Intelligence" />
                  <RailIntelligenceEngine result={simRouting.result} input={{ amount: simRouting.input.amount, riskScore: simRouting.input.riskScore, priority: simRouting.input.priority, institution: simRouting.input.institution }} />
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ======================================================================
          TRANSACTION DRILLDOWN DRAWER
      ====================================================================== */}

      {selectedTxn && (
        <TransactionDrawer
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}

      {/* TOAST NOTIFICATION */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
      >
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border"
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(8px)",
            borderColor: sourceState === "LIVE_API" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
          }}
        >
          {sourceState === "LIVE_API" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <p className="text-sm font-medium text-slate-200">
            {toastMessage?.split('. ').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && toastMessage.includes('. ') && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>

    </main>
  );
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-px h-4 flex-shrink-0"
        style={{
          background: "linear-gradient(to bottom, var(--cyan-bright), transparent)",
        }}
      />
      <span className="section-label">{label}</span>
    </div>
  );
}

// =============================================================================
// DATA FEED BADGE
// =============================================================================

function DataSourceBadge({
  mode,
  status,
  latency,
}: {
  mode: "LIVE" | "MOCK";
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  latency?: number;
}) {
  let sourceState = "SOURCE: MOCK MODE";
  let color = "#F59E0B"; // Amber
  let bgColor = "rgba(245,158,11,0.08)";
  let borderColor = "rgba(245,158,11,0.2)";
  let isLive = false;

  if (status === "OFFLINE") {
    sourceState = "SOURCE: OFFLINE FALLBACK";
    color = "#EF4444"; // Red
    bgColor = "rgba(239,68,68,0.08)";
    borderColor = "rgba(239,68,68,0.2)";
  } else if (mode === "LIVE") {
    sourceState = "SOURCE: LIVE API";
    color = "#10B981"; // Emerald
    bgColor = "rgba(16,185,129,0.08)";
    borderColor = "rgba(16,185,129,0.2)";
    isLive = true;
  }

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded-md cursor-help relative group"
      style={{ background: bgColor, border: borderColor }}
    >
      <div className="relative flex items-center">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {isLive && (
          <div
            className="absolute w-1.5 h-1.5 rounded-full animate-ping opacity-60"
            style={{ background: color }}
          />
        )}
      </div>
      {status === "OFFLINE" ? (
        <WifiOff className="w-3 h-3" style={{ color }} />
      ) : (
        <Wifi className="w-3 h-3" style={{ color }} />
      )}
      <span
        className="font-mono-data font-semibold"
        style={{
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: color,
        }}
      >
        {sourceState}
      </span>

      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-0 w-64 p-3 rounded-lg bg-slate-800 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-700 shadow-xl space-y-1.5">
        <div className="flex justify-between">
          <span>Current Source</span>
          <span style={{ color }}>{sourceState.replace("SOURCE: ", "")}</span>
        </div>
        <div className="flex justify-between">
          <span>Backend Status</span>
          <span className="text-white">{status}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Refresh</span>
          <span className="font-mono-data text-white">
            {new Date().toLocaleTimeString([], { hour12: false })} UTC
          </span>
        </div>
        <div className="flex justify-between">
          <span>Refresh Interval</span>
          <span className="text-white">5 seconds</span>
        </div>
        <div className="flex justify-between">
          <span>Polling</span>
          <span className="text-emerald-400">ACTIVE</span>
        </div>
        {latency !== undefined && status !== "OFFLINE" && (
          <div className="flex justify-between pt-1 mt-1 border-t border-slate-700">
            <span>Latency</span>
            <span className="font-mono-data text-white">{latency}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// KPI CARD
// =============================================================================

function KpiCard({
  title,
  value,
  subValue,
  icon: Icon,
  accentColor,
  trend,
  alert = false,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: any;
  accentColor: string;
  trend: "up" | "down" | "neutral";
  alert?: boolean;
}) {
  const borderColor = alert
    ? "rgba(239,68,68,0.25)"
    : "rgba(255,255,255,0.05)";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  const trendColor =
    trend === "up" ? "#34D399" : trend === "down" ? "#F87171" : "#64748B";

  return (
    <div
      className="kpi-card rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: alert
          ? "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, #081120 100%)"
          : "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: `1px solid ${borderColor}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top: title + icon */}
      <div className="flex items-start justify-between">
        <p className="section-label">{title}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p
          className="tabular-nums font-bold leading-none tracking-tight"
          style={{
            fontSize: "28px",
            color: alert ? "#F87171" : "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </p>
      </div>

      {/* Footer: subvalue + trend */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="font-mono-data text-[10px] text-slate-500">
          {subValue}
        </span>
        {TrendIcon && (
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LEDGER ROW
// =============================================================================

function LedgerRow({
  txn,
  isLast,
  onClick,
  isHighlighted = false,
}: {
  txn: Transaction;
  isLast: boolean;
  onClick: () => void;
  isHighlighted?: boolean;
}) {
  const railColors: Record<string, { color: string; bg: string; border: string }> = {
    ACH:  { color: "#22D3EE", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)" },
    WIRE: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
    RTP:  { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)" },
  };

  const riskColors: Record<string, { color: string; bg: string; border: string }> = {
    LOW:    { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.15)" },
    MEDIUM: { color: "#FCD34D", bg: "rgba(252,211,77,0.08)",  border: "rgba(252,211,77,0.15)" },
    HIGH:   { color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  };

  const rail = railColors[txn.rail] || railColors.ACH;
  const risk = riskColors[txn.risk_level] || riskColors.LOW;

  const isCompleted = txn.status === "COMPLETED";
  const isPending   = txn.status === "PENDING";

  const statusColor = isCompleted
    ? "#34D399"
    : isPending
    ? "#F59E0B"
    : "#22D3EE";

  return (
    <tr
      id={`txn-${txn.id}`}
      className={`ledger-row transition-all duration-300 ${isHighlighted ? 'bg-cyan-900/40' : 'hover:bg-white/[0.02]'}`}
      onClick={onClick}
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
        cursor: "pointer",
      }}
    >
      {/* User */}
      <td className="pl-6 pr-3 py-4 overflow-hidden text-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
            style={{
              background: "rgba(34,211,238,0.08)",
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.12)",
            }}
          >
            {txn.user[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-200">{txn.user}</span>
        </div>
      </td>

      {/* Bank */}
      <td className="px-3 py-4 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="text-sm text-slate-400 truncate">{txn.bank}</span>
      </td>

      {/* Amount */}
      <td className="px-3 py-4 whitespace-nowrap text-right">
        <span className="font-mono-data tabular-nums font-semibold text-white text-sm">
          ${txn.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </td>

      {/* Rail */}
      <td className="px-3 py-4 whitespace-nowrap">
        <span
          className="font-mono-data font-semibold px-2.5 py-1 rounded text-xs"
          style={{
            color: rail.color,
            background: rail.bg,
            border: `1px solid ${rail.border}`,
          }}
        >
          {txn.rail}
        </span>
      </td>

      {/* Risk */}
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1.5">
          <span
            className="font-mono-data font-semibold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1.5 w-fit"
            style={{
              color: risk.color,
              background: risk.bg,
              border: `1px solid ${risk.border}`,
            }}
          >
            <span className="tabular-nums">{txn.risk_score}</span>
            <span className="opacity-60">·</span>
            <span>{txn.risk_level}</span>
          </span>
          <div
            className="w-16 h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${txn.risk_score}%`,
                background: risk.color,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor }}
            />
            {!isCompleted && (
              <div
                className="absolute w-1.5 h-1.5 rounded-full animate-gentle-pulse opacity-60"
                style={{ background: statusColor }}
              />
            )}
          </div>
          <span
            className="font-mono-data font-semibold uppercase tracking-widest"
            style={{ fontSize: "10px", color: statusColor }}
          >
            {txn.status}
          </span>
        </div>
      </td>

      {/* Timestamp */}
      <td className="pl-3 pr-8 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-700 flex-shrink-0" />
          <span className="font-mono-data text-[11px] text-slate-600">
            {new Date(txn.timestamp).toLocaleString(undefined, {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// INTELLIGENCE MODULE  (sidebar panel wrapper)
// =============================================================================

function IntelligenceModule({
  title,
  label,
  icon: Icon,
  accentColor,
  accentBg,
  accentBorder,
  children,
}: {
  title: string;
  label: string;
  icon: any;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="premium-card rounded-xl overflow-hidden h-full flex flex-col"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background: accentBg,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
        <div className="flex-1 min-w-0">
          <p className="section-label">{label}</p>
          <p className="text-white font-semibold text-sm leading-none mt-0.5">
            {title}
          </p>
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: accentColor, opacity: 0.7 }}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  );
}

// =============================================================================
// RAIL TELEMETRY ROW
// =============================================================================

function RailTelemetryRow({
  name,
  status,
  load,
  latency,
  context,
}: {
  name: string;
  status: string;
  load: number;
  latency: string;
  context?: string;
}) {
  const loadInt = Math.round(load);
  const isOptimal   = status === "Optimal";
  const statusColor = isOptimal ? "#34D399" : "#F59E0B";
  const barColor    = loadInt > 70 ? "#F59E0B" : loadInt > 50 ? "#22D3EE" : "#34D399";

  return (
    <div
      className="p-3 rounded-lg transition-colors duration-150 hover:brightness-110 flex flex-col justify-center"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: statusColor,
              animation: !isOptimal ? "status-pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span className="text-sm font-semibold text-slate-300 font-mono-data">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-data text-[10px] text-slate-600">
            {latency}
          </span>
          <span
            className="font-mono-data text-[10px] font-semibold"
            style={{ color: statusColor }}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${loadInt}%`, background: barColor }}
          />
        </div>
        <span className="font-mono-data text-[10px] text-slate-600 w-8 text-right tabular-nums">
          {loadInt}%
        </span>
      </div>
      {context && (
        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{context}</p>
      )}
    </div>
  );
}

// =============================================================================
// RISK STAT ROW
// =============================================================================

function RiskStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="section-label">{label}</span>
      <span
        className="font-mono-data text-xs font-semibold tabular-nums"
        style={{ color: highlight ? "#F87171" : "#CBD5E1" }}
      >
        {value}
      </span>
    </div>
  );
}