"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Transaction } from "@/types/transaction";

// ─── Existing components ──────────────────────────────────────────────────────
import RailFlowEngine      from "@/components/RailFlowEngine";
import RailUsageChart      from "@/components/RailUsageChart";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import TransactionTimeline from "@/components/TransactionTimeline";

// ─── New Phase-2 & 3 components ───────────────────────────────────────────────
import AIInsightsEngine      from "@/components/AIInsightsEngine";
import TransactionDrawer     from "@/components/TransactionDrawer";
import LiveOperationsStream  from "@/components/LiveOperationsStream";
import RoutingSimulator      from "@/components/RoutingSimulator";
import RailIntelligenceEngine from "@/components/RailIntelligenceEngine";
import OpenBankingOverview   from "@/components/OpenBankingOverview";
import type { SimResult, SimInput } from "@/lib/routingEngine";
import { computeRouting } from "@/lib/routingEngine";
import { calculateMetrics } from "@/lib/metrics";

// ─── APIs ─────────────────────────────────────────────────────────────────────
import { fetchTransactions, fetchSourceStatus, checkBackendHealth } from "@/lib/api";

import { motion, AnimatePresence } from "framer-motion";
import SidebarContent, { SidebarContextData } from "@/components/SidebarContent";
import IntelligenceModule from "@/components/IntelligenceModule";

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Brain,
  Clock,
  CreditCard,
  Download,
  Info,
  Percent,
  Server,
  ShieldAlert,
  Terminal,
  Timer,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";

// =============================================================================
// MOCK FALLBACK DATA
// =============================================================================

const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 50 }).map((_, i) => {
  const banks = ["Chase", "Wells Fargo", "Bank of America", "Citibank", "Goldman Sachs"];
  const names = ["Olivia Carter", "James Wilson", "Michael Reed", "Emma Parker", "Daniel Brooks"];
  const amount = 100 + (i * 43) % 60000;
  const riskScore = i === 7 || i === 23 ? 85 : i % 5 === 0 ? 45 : 12 + (i % 20);
  const priority = i % 4 === 0 ? "URGENT" : i % 10 === 0 ? "BATCH" : "STANDARD";
  
  const routing = computeRouting({ amount, riskScore, priority, institution: banks[i % banks.length] });

  const status = routing.riskAssessment === "HIGH" && i % 2 === 0 ? "PENDING" : "COMPLETED";

  return {
    id: `mock-${100 + i}`,
    user: names[i % names.length],
    bank: banks[i % banks.length],
    amount,
    rail: routing.rail,
    risk_score: riskScore,
    risk_level: routing.riskAssessment,
    status,
    timestamp: new Date(Date.now() - i * 600000).toISOString(),
  };
});

const POLL_INTERVAL_MS = 5000;

type TabId = "OVERVIEW" | "ANALYTICS" | "OPERATIONS" | "SIMULATION";

interface Notification {
  id: string;
  timestamp: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "INFO";
  rail?: string;
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
  severity: string;
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
  const [dataMode, setDataMode]         = useState<"LIVE" | "MOCK">("MOCK");
  const [apiLatency, setApiLatency]     = useState<number>(0);
  const [apiStatus, setApiStatus]       = useState<"ONLINE" | "OFFLINE" | "DEGRADED">("ONLINE");
  const [loading, setLoading]           = useState(true);
  const [selectedTxn, setSelectedTxn]   = useState<Transaction | null>(null);
  
  // Phase 4 States
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySnapshot[]>([]);

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

  // Cinematic Interface State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<SidebarContextData | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const openSidebarWithContext = useCallback((context: SidebarContextData) => {
    setSidebarContext(context);
    setIsSidebarOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
        setIsInfoModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derived Source State
  let sourceState: "LIVE_API" | "MOCK_MODE" | "OFFLINE_FALLBACK" = "MOCK_MODE";
  if (apiStatus === "OFFLINE") sourceState = "OFFLINE_FALLBACK";
  else if (dataMode === "LIVE") sourceState = "LIVE_API";

  const prevSourceStateRef = useRef(sourceState);

  useEffect(() => {
    if (prevSourceStateRef.current !== sourceState && !loading) {
      prevSourceStateRef.current = sourceState;
    }
  }, [sourceState, loading]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventCycleRef = useRef(0);
  const hasNotifiedOutageRef = useRef(false);
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
      await checkBackendHealth();
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
            const cycleIdx = eventCycleRef.current % 6;
            eventCycleRef.current += 1;
            
            const eventIdNum = Math.floor(Math.random() * 900) + 100;
            
            if (cycleIdx === 0) {
              newEvents.push({
                id: Math.random().toString(36).slice(2, 10),
                timestamp: ts,
                eventId: `ROUTE-${eventIdNum}`,
                severity: "ROUTED",
                type: "ROUTE",
                message: `Payment Initiation Approved via Open Banking Protocol for ${t.user}.`,
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
                message: `Routing Decision Generated for immediate liquidity transfer.`,
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
                message: `FedNow Settlement Confirmed for ${t.bank}.`,
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
                message: `Open Banking Consent Verified via Plaid for ${t.user}.`,
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
                message: `Plaid Account Sync Completed for ${t.bank}.`,
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
                message: `NACHA Settlement Processed successfully.`,
                isNew: true,
                txnId: t.id
              });
            }
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
        if (hasNotifiedOutageRef.current) {
          addNotification("Backend API connection restored. Operating in LIVE mode.", "INFO");
          hasNotifiedOutageRef.current = false;
        }
        return;
      }
      // Fallback
      setRawTransactions(prev => {
        setPreviousTransactions(prev);
        return MOCK_TRANSACTIONS;
      });
      setDataMode("MOCK");
    } catch {
      if (!hasNotifiedOutageRef.current) {
        addNotification("Backend API offline. Operating in resilient synthetic mode.", "HIGH");
        hasNotifiedOutageRef.current = true;
      }
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
        await fetchSourceStatus();
      } catch {
        // fallback
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
    totalTxns,
    connectedBanks,
    totalAmount,
    riskAlerts,
    clearedAnomalies,
    successRateStr,
    avgSettlementLabel,
    threatLevel,
    railCounts,
    railPercentages,
    riskPercentages,
    riskExposureScore,
    completedCount,
    pendingCount,
    generatedOperationsLog
  } = useMemo(() => {
    const metrics = calculateMetrics(transactions);
    
    // Operations Feed calculation
    const messages = [
      (t: Transaction) => `Settlement Confirmed | ${t.rail === "RTP" ? "FEDNOW" : t.rail} | $${t.amount} | ${t.bank}`,
      (t: Transaction) => `Risk Assessment Complete | Score ${t.risk_score} | ${t.rail === "RTP" ? "FEDNOW" : t.rail} Eligible`,
      (t: Transaction) => `OAuth Consent Verified | ${t.bank}`,
      (t: Transaction) => `Rail Selection Complete | ${t.rail === "RTP" ? "FEDNOW" : t.rail} Recommended`,
      (t: Transaction) => `Transaction Approved | ${t.rail === "RTP" ? "FEDNOW" : t.rail} Route`,
      (t: Transaction) => `Settlement Confirmed | ${t.rail === "RTP" ? "FEDNOW" : t.rail} | $${t.amount} | ${t.bank}`
    ];
    const severities = ["SETTLED", "RISK", "SYNC", "ROUTED", "INFO", "SETTLED"];
    
    const generatedOperationsLog = [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map((t, i) => {
        const msgIdx = i % messages.length;
        return {
          id: `ev-${t.id}`,
          timestamp: new Date(t.timestamp).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          eventId: `EVT-${1000 + i}`,
          severity: severities[msgIdx],
          type: "SYSTEM",
          message: messages[msgIdx](t),
          txnId: t.id
        };
      });

    return {
      ...metrics,
      generatedOperationsLog
    };
  }, [transactions]);



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
      className="h-screen relative flex flex-col overflow-hidden"
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

      <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col max-w-[1680px] mx-auto px-4 py-4 md:px-8 md:py-6 lg:px-10 lg:py-8">

        {/* ====================================================================
            FULL WIDTH CINEMATIC STAGE - Main Layout
        ==================================================================== */}

        <div className="flex-1 min-h-0 h-full overflow-hidden w-full relative">

          {/* ════════════════════════════════════════════════════════════════
              MAIN COLUMN (100%) - Main Operational Workspace
          ════════════════════════════════════════════════════════════════ */}

          <div className="space-y-12 h-full overflow-y-auto pr-2 pb-12 custom-scrollbar w-full">

            {/* ════════════════════════════════════════════════════════════
                1. PAGE HEADER
            ════════════════════════════════════════════════════════════ */}

            <header>
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
                    <div className="flex items-center gap-3">
                      <h1
                        className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none"
                        style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.025em" }}
                      >
                        Infocreon Internship – Open Banking Intelligence Rail
                      </h1>
                      <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono-data font-bold text-emerald-400 tracking-widest uppercase">Live</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <p className="section-label text-slate-400 m-0">
                        Enterprise Payment Orchestration & Settlement Intelligence Platform
                      </p>
                      <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] text-slate-500 font-mono-data uppercase tracking-widest">
                        ENV: PRODUCTION
                      </span>
                      <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] text-slate-500 font-mono-data uppercase tracking-widest">
                        Refresh: {new Date().toLocaleTimeString([], { hour12: false })} UTC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side Header - Notification Bell & Data Source */}
                <div className="flex items-center gap-4 lg:gap-6 lg:flex-shrink-0">
                  <div className="hidden md:block">
                    <DataSourceBadge mode={dataMode} status={apiStatus} latency={apiLatency} />
                  </div>
                  
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsInfoModalOpen(true); }}
                      className="relative p-2 rounded-lg transition-colors hover:bg-slate-800"
                    >
                      <Info className="w-5 h-5 text-slate-400" />
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
                                    {n.rail === "RTP" ? "FEDNOW" : n.rail} {n.severity}
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

            {/* ════════════════════════════════════════════════════════════
                3. NAVIGATION TABS
            ════════════════════════════════════════════════════════════ */}

            <div className="flex items-center gap-2 border-b border-white/5 pb-px overflow-x-auto">
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

            {/* ════════════════════════════════════════════════════════════
                4. SYSTEM TELEMETRY
            ════════════════════════════════════════════════════════════ */}

            <div>
              <SectionHeader label="System Telemetry" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div
                  className="rounded-lg p-6 transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 100%)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    boxShadow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.12) inset";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset";
                  }}
                >
                  <p className="section-label mb-3">Payments Routed</p>
                  <p className="text-2xl font-bold text-cyan-300 font-mono-data">
                    ${(telemetryHistory[telemetryHistory.length - 1]?.volume || 0) >= 1000 
                      ? ((telemetryHistory[telemetryHistory.length - 1]?.volume || 0) / 1000).toFixed(1) + "K"
                      : (telemetryHistory[telemetryHistory.length - 1]?.volume || 0).toFixed(0)}
                  </p>
                </div>
                <div
                  className="rounded-lg p-6 transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 100%)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    boxShadow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.12) inset";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset";
                  }}
                >
                  <p className="section-label mb-3">Transaction Count</p>
                  <p className="text-2xl font-bold text-emerald-300 font-mono-data">
                    {telemetryHistory[telemetryHistory.length - 1]?.count || 0}
                  </p>
                </div>
                <div
                  className="rounded-lg p-6 transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 100%)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    boxShadow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.12) inset";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset";
                  }}
                >
                  <p className="section-label mb-3">Average Risk Score</p>
                  <p className="text-2xl font-bold text-amber-300 font-mono-data">
                    {telemetryHistory[telemetryHistory.length - 1]?.risk || 0}
                  </p>
                </div>
                <div
                  className="rounded-lg p-6 transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 100%)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    boxShadow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.12) inset";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08) inset";
                  }}
                >
                  <p className="section-label mb-3">System Health</p>
                  <p className="text-2xl font-bold text-emerald-300 font-mono-data">Active</p>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                TAB CONTENT - Shown based on activeTab
            ════════════════════════════════════════════════════════════ */}

            {/* TAB: OVERVIEW */}
            {activeTab === "OVERVIEW" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* 1. Executive Summary */}
                <div>
                  <SectionHeader label="Executive Summary" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-4">
                    <KpiCard
                      title="Connected Financial Institutions"
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
                    <KpiCard
                      title="Settlement Completion"
                      value={`${successRateStr}%`}
                      subValue={`${completedCount} finalized • ${pendingCount} pending`}
                      icon={Percent}
                      accentColor={Number(successRateStr) >= 70 ? "#34D399" : "#F59E0B"}
                      trend="neutral"
                    />
                    <KpiCard
                      title="Avg Settlement Time"
                      value={avgSettlementLabel}
                      subValue="Across settled transactions"
                      icon={Timer}
                      accentColor="#A78BFA"
                      trend="neutral"
                    />
                    <KpiCard
                      title="Primary Rail"
                      value={(() => {
                        const topRail = Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
                        return topRail === "RTP" ? "FEDNOW" : topRail;
                      })()}
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
                      accentColor={threatLevel === "CRITICAL" || threatLevel === "ELEVATED" ? "#EF4444" : threatLevel === "MODERATE" ? "#F59E0B" : "#10B981"}
                      trend="neutral"
                      alert={threatLevel === "CRITICAL" || threatLevel === "ELEVATED"}
                      onClick={() => openSidebarWithContext({ type: "KPI", id: "Threat Level" })}
                    />
                  </div>
                </div>

                {/* 2. AI Insights Engine */}
                <div>
                  <SectionHeader label="AI Insights Engine" />
                  <div
                    className="premium-card rounded-xl overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <AIInsightsEngine transactions={transactions} previousTransactions={previousTransactions} onSidebarTrigger={openSidebarWithContext} />
                  </div>
                </div>

                {/* 3. Connected Institutions */}
                <div>
                  <SectionHeader label="Connected Institutions" />
                  <OpenBankingOverview connectedBanksCount={connectedBanks} onSidebarTrigger={openSidebarWithContext} />
                </div>

                {/* 4. Payment Flow Intelligence */}
                <div>
                  <SectionHeader label="Payment Flow Intelligence" />
                  <RailFlowEngine activeRail={Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ACH"} onSidebarTrigger={openSidebarWithContext} />
                </div>



              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === "ANALYTICS" && (
              <div className="space-y-12 xl:space-y-14 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* SECTION 1: Operational Analytics */}
                <div>
                  <SectionHeader label="Operational Analytics" />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="min-w-0">
                      <RailUsageChart 
                        railCounts={railCounts}
                        railPercentages={railPercentages}
                        totalTxns={totalTxns}
                      />
                    </div>
                    <div className="min-w-0">
                      <RiskDistributionChart transactions={transactions} />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Transaction Volume Trend */}
                <div>
                  <SectionHeader label="Transaction Volume Trend" />
                  <div className="min-w-0">
                    <TransactionTimeline transactions={transactions} />
                  </div>
                </div>

                {/* SECTION 3: Rail Telemetry + Threat Assessment */}
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
                        successRate="99.2%"
                        settlementTime="T+1"
                      />
                      <RailTelemetryRow
                        name="WIRE"
                        status="Optimal"
                        load={railPercentages["WIRE"]}
                        latency="8ms"
                        successRate="99.8%"
                        settlementTime="Same Day"
                      />
                      <RailTelemetryRow
                        name="RTP"
                        status="Monitoring"
                        load={railPercentages["RTP"]}
                        latency="94ms"
                        successRate="98.7%"
                        settlementTime="Instant"
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
                    <div className="flex-1 flex flex-col gap-3">
                      {/* Risk Exposure Score */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                         <div>
                           <p className="section-label mb-1">Risk Exposure Score</p>
                           <div className="flex items-baseline gap-1 mt-1">
                             <p className="text-3xl font-bold leading-none font-mono-data tracking-tight" style={{ color: riskExposureScore <= 39 ? "#10B981" : riskExposureScore <= 69 ? "#F59E0B" : "#EF4444" }}>
                               {riskExposureScore}
                             </p>
                             <p className="text-sm font-bold text-slate-500 leading-none font-mono-data tracking-tight">/100</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <span 
                             className="font-mono-data text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border"
                             style={{ 
                               color: riskExposureScore <= 39 ? "#34D399" : riskExposureScore <= 69 ? "#FCD34D" : "#F87171",
                               background: riskExposureScore <= 39 ? "rgba(16,185,129,0.1)" : riskExposureScore <= 69 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                               borderColor: riskExposureScore <= 39 ? "rgba(16,185,129,0.2)" : riskExposureScore <= 69 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"
                             }}
                           >
                             {riskExposureScore <= 39 ? "LOW" : riskExposureScore <= 69 ? "MEDIUM" : "HIGH"}
                           </span>
                         </div>
                      </div>
                      {/* Grid */}
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="section-label mb-2">Investigations</p>
                          <p className="text-2xl font-bold text-amber-500 leading-none font-mono-data tracking-tight">
                            {Math.max(0, riskAlerts - clearedAnomalies)}
                          </p>
                        </div>
                        <div className="flex flex-col justify-center p-4 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="section-label mb-2">Resolved Alerts</p>
                          <p className="text-2xl font-bold text-emerald-500 leading-none font-mono-data tracking-tight">
                            {clearedAnomalies}
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="section-label">Compliance Status</p>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest font-mono-data">
                              Compliant
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Analytics Findings */}
                <div>
                  <SectionHeader label="Analytics Findings" />
                  <div
                    className="rounded-xl p-6"
                    style={{
                      background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            {(() => {
                              const r = Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ACH";
                              return r === "RTP" ? "FEDNOW" : r;
                            })()} processed {railPercentages[Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ACH"] || 0}% of routed volume and remained the dominant settlement rail.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            {riskPercentages["LOW"] || 0}% of transactions remained within the Low Risk category, indicating strong compliance posture.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            FedNow usage increased for priority settlement scenarios, with {railCounts["RTP"] || 0} transactions leveraging instant settlement rails.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            High-risk exposure remained below operational thresholds at {riskExposureScore}/100, with {Math.max(0, riskAlerts - clearedAnomalies)} active investigations.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            Settlement success rate maintained at {Number(successRateStr).toFixed(1)}%, reflecting optimal network conditions across all active corridors.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-relaxed">
                            Routing distribution indicates balanced rail utilization with {Object.keys(railCounts).length} active corridors operating efficiently.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest">
                        Data Source: Synthetic Open Banking Dataset
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono-data text-[10px] text-emerald-500/80 uppercase tracking-widest">
                          Confidence: 99.4%
                        </span>
                        <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest">
                          Generated: {new Date().toLocaleTimeString([], { hour12: false })} UTC
                        </span>
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
                  <div className="xl:col-span-2 flex flex-col h-full">
                    <SectionHeader label="Operational Intelligence Feed" />
                    <div className="flex-1 min-h-0">
                      <LiveOperationsStream 
                        events={generatedOperationsLog.slice(0, 6)}
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
                  <div className="xl:col-span-1 flex flex-col h-full">
                    <SectionHeader label="System Health" />
                    <div className="flex-1 min-h-0">
                      <IntelligenceModule
                        title="Infrastructure Health Monitor"
                        label="All Systems Operational"
                        icon={Activity}
                        accentColor="#22D3EE"
                        accentBg="rgba(34,211,238,0.04)"
                      >
                        <div className="flex flex-col space-y-2">
                          {[
                            { name: "Plaid Connectivity", status: "ACTIVE", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                            { name: "Risk Engine", status: "OPERATIONAL", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                            { name: "Database Layer", status: "HEALTHY", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                            { name: "OAuth Layer", status: "ACTIVE", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                            { name: "Settlement Layer", status: "HEALTHY", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
                          ].map((srv, i) => (
                             <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                               <span className="text-sm text-slate-300 font-medium truncate mr-2">{srv.name}</span>
                               <span className={`text-[10px] font-bold font-mono-data px-2.5 py-1.5 rounded tracking-widest whitespace-nowrap border ${srv.color} ${srv.bg} ${srv.border}`}>{srv.status}</span>
                             </div>
                          ))}
                          <div className="mt-2 pt-5 pb-2 flex flex-col items-start border-t border-white/10 gap-1.5 text-left w-full">
                             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono-data">Summary</span>
                             <span className="text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono-data">5/5 CONNECTED SERVICES HEALTHY</span>
                          </div>
                        </div>
                      </IntelligenceModule>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader label="Transaction Ledger" />

                  <div
                    className="rounded-xl overflow-hidden flex flex-col"
                    style={{
                      background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      boxShadow:
                        "0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Table header bar */}
                    <div
                      className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-10"
                      style={{
                        background: "rgba(8,17,32,0.92)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        <Server className="w-4 h-4 text-cyan-500/70" />
                        <h2 className="text-sm font-semibold text-white tracking-tight mr-4">
                          OPEN BANKING DATASET
                        </h2>
                        <span
                          className="font-mono-data text-[10px] px-2 py-0.5 rounded uppercase tracking-widest"
                          style={{
                            background: "rgba(34,211,238,0.08)",
                            color: "rgba(34,211,238,0.7)",
                            border: "1px solid rgba(34,211,238,0.12)",
                          }}
                        >
                          8 SYNTHETIC RECORDS
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-2 sm:mt-0">
                        {/* Pagination placeholder banner */}
                        <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block mr-2">
                          Showing 1–{Math.min(transactions.length, 8)} of {transactions.length}
                        </span>
                        {/* Exports */}
                        <div className="flex items-center gap-1.5" title="Generated Synthetic Dataset">
                          <button onClick={exportCSV} className="flex items-center gap-1 text-[10px] uppercase font-mono-data tracking-wider px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-300 border border-white/10">
                            <Download className="w-3 h-3" /> EXPORT CSV
                          </button>
                          <button onClick={exportJSON} className="flex items-center gap-1 text-[10px] uppercase font-mono-data tracking-wider px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-300 border border-white/10">
                            <Download className="w-3 h-3" /> EXPORT JSON
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-sm table-fixed mb-4 min-w-[800px]">
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
                            transactions.slice(0, 8).map((txn, idx) => (
                              <LedgerRow
                                key={txn.id}
                                txn={txn}
                                isLast={idx === Math.min(transactions.length, 8) - 1}
                                onClick={() => { setSelectedTxn(txn); openSidebarWithContext({ type: "TRANSACTION", id: txn.id, data: txn }); }}
                                isHighlighted={highlightedTxnId === txn.id}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination footer */}
                    {transactions.length > 8 && (
                      <div className="px-6 py-3 border-t flex justify-between items-center bg-white/5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest">
                          SELECT A TRANSACTION TO VIEW DETAILS
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

          {/* ════════════════════════════════════════════════════════════════
              RIGHT COLUMN (30%) - Intelligence Sidebar
          ════════════════════════════════════════════════════════════════ */}

          <div className="space-y-4 h-full overflow-y-auto pr-2 pb-12 custom-scrollbar">
            
            {/* 0. Ingested Intelligence Sources */}
            <IntelligenceModule
              title="Ingested Intelligence Sources"
              label="Data Sources Consumed"
              icon={Brain}
              accentColor="#8B5CF6"
              accentBg="rgba(139,92,246,0.06)"
            >
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-slate-400 mb-1 leading-relaxed">
                  These authoritative sources actively power the intelligence engine and dynamic routing decisions.
                </p>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-medium text-slate-300">Open Banking UK Standards</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-medium text-slate-300">Plaid Documentation</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-medium text-slate-300">FedNow Service Documentation</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-medium text-slate-300">Internal Risk Engine</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
              </div>
            </IntelligenceModule>

            {/* 1. System Status */}
                <IntelligenceModule
                  title="System Status"
                  label="Infrastructure Diagnostics"
                  icon={Terminal}
                  accentColor="#22D3EE"
                  accentBg="rgba(34,211,238,0.06)"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">Plaid Connectivity</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">OAuth Consent Status</span>
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Verified</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">FedNow Availability</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Operational</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">Current UTC Time</span>
                      <span className="text-xs font-mono-data text-white">{new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">Poll Interval</span>
                      <span className="text-xs font-mono-data text-white">5s</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-slate-400">Source Reliability</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">High</span>
                    </div>
                  </div>
                </IntelligenceModule>

                {/* 2. Intelligence Brief */}
                <div
                  className="rounded-xl px-6 py-5 flex flex-col w-full overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.03) 100%)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    borderLeft: "3px solid #A78BFA",
                    boxShadow: "0 0 20px rgba(167,139,250,0.05) inset"
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4" style={{ color: "#A78BFA" }} />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Intelligence Brief</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Executive Summary</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed break-words w-full pb-5">
                    <p>
                      <strong className="text-white text-xs uppercase tracking-wider mb-1 block">Operational Assessment</strong>
                      ACH settlement activity remains within NACHA processing thresholds. Open Banking consent verification continues to operate normally across connected institutions.
                    </p>
                    <p>
                      <strong className="text-white text-xs uppercase tracking-wider mb-1 block">Threat Overview</strong>
                      Several elevated-risk transactions remain under review. No active fraud events detected.
                    </p>
                    <p>
                      <strong className="text-white text-xs uppercase tracking-wider mb-1 block">Settlement Summary</strong>
                      Primary ACH corridors are processing successfully. FedNow available for real-time settlement.
                    </p>
                  </div>
                </div>

                {/* Why This Matters */}
                <IntelligenceModule
                  title="Why This Matters"
                  label="Strategic Context"
                  icon={Activity}
                  accentColor="#34D399"
                  accentBg="rgba(52,211,153,0.06)"
                >
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed break-words w-full">
                    <div className="flex flex-col bg-white/5 border border-white/10 p-3 rounded-lg border-l-2 border-l-emerald-400">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Observation</span>
                      <span className="text-xs text-slate-300">Sustained high-volume traffic on ACH. No latency anomalies detected.</span>
                    </div>
                    <div className="flex flex-col bg-white/5 border border-white/10 p-3 rounded-lg border-l-2 border-l-cyan-400">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Routing Recommendation</span>
                      <span className="text-xs text-slate-300">Maintain current orchestration rules. Load balanced efficiently.</span>
                    </div>
                    <div className="flex flex-col bg-white/5 border border-white/10 p-3 rounded-lg border-l-2 border-l-purple-400">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Infrastructure Insight</span>
                      <span className="text-xs text-slate-300">API Gateway latency within 99th percentile bounds (24ms).</span>
                    </div>
                  </div>
                </IntelligenceModule>

              </div>

            </div>

        </div>

        {/* ======================================================================
            ANIMATED SLIDE-OVER INTELLIGENCE SIDEBAR
        ====================================================================== */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[450px] z-[60]"
                style={{
                  background: "rgba(8, 17, 32, 0.97)",
                  backdropFilter: "blur(16px)",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.6)"
                }}
              >
                <div className="flex items-center justify-between p-5 border-b border-white/10" style={{ background: "rgba(34,211,238,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Intelligence Sidebar</h2>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="h-[calc(100%-73px)] overflow-y-auto p-5 custom-scrollbar">
                  <SidebarContent context={sidebarContext} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ======================================================================
            ARCHITECT INFORMATION MODAL
        ====================================================================== */}
        <AnimatePresence>
          {isInfoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setIsInfoModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-md p-6 rounded-2xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(8,17,32,0.97) 0%, rgba(11,18,32,0.97) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  boxShadow: "0 0 40px rgba(34,211,238,0.1) inset, 0 32px 64px rgba(0,0,0,0.8)"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />
                <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors z-10">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
                <div className="flex items-center gap-4 mb-6 mt-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <Terminal className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Architect Information</h3>
                    <p className="text-xs text-cyan-400/80 font-mono-data uppercase tracking-widest mt-0.5">Infocreon Internship</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="block text-[10px] uppercase text-slate-500 tracking-wider mb-1">Architect</span>
                    <span className="font-semibold text-white">Shahab Ahamed</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider">Project / POC</span>
                    <span className="font-mono-data text-xs text-slate-300">POC-96</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider">Batch Info</span>
                    <span className="font-semibold text-white">Batch 4</span>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[10px] uppercase text-slate-500 tracking-wider mb-2">Technology Stack</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-black text-white border border-white/20 px-2.5 py-1 rounded text-xs font-medium">Next.js</span>
                      <span className="bg-[#059669]/20 text-[#34D399] border border-[#34D399]/30 px-2.5 py-1 rounded text-xs font-medium">FastAPI</span>
                      <span className="bg-[#06B6D4]/20 text-[#22D3EE] border border-[#22D3EE]/30 px-2.5 py-1 rounded text-xs font-medium">Tailwind CSS</span>
                      <span className="bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#A78BFA]/30 px-2.5 py-1 rounded text-xs font-medium">Recharts</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* ======================================================================
          TRANSACTION DRILLDOWN DRAWER
      ====================================================================== */}

      {selectedTxn && (
        <TransactionDrawer
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}

      {/* TOAST NOTIFICATION REMOVED */}

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

  if (status === "OFFLINE" || mode === "MOCK") {
    sourceState = "SIMULATION MODE ACTIVE";
    color = "#F59E0B"; // Amber for simulation
    bgColor = "rgba(245,158,11,0.08)";
    borderColor = "rgba(245,158,11,0.2)";
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
  onClick,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  accentColor: string;
  trend: "up" | "down" | "neutral";
  alert?: boolean;
  onClick?: () => void;
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
      className={`kpi-card rounded-xl p-5 flex flex-col gap-4 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      onClick={onClick}
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
      className={`ledger-row group transition-all duration-300 ${isHighlighted ? 'bg-cyan-900/20' : 'hover:bg-white/[0.03] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'}`}
      onClick={onClick}
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
        cursor: "pointer",
      }}
    >
      {/* User */}
      <td className={`pl-6 pr-3 py-4 overflow-hidden text-ellipsis whitespace-nowrap border-l-2 ${isHighlighted ? 'border-cyan-500/35 shadow-[inset_2px_0_10px_rgba(34,211,238,0.05)]' : 'border-transparent group-hover:border-cyan-500/30'}`}>
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
          <span className="text-sm font-medium text-slate-200 truncate min-w-0">{txn.user}</span>
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
          {txn.rail === "RTP" ? "FEDNOW" : txn.rail}
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
            className="w-full max-w-[80px] h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, txn.risk_score))}%`,
                background: risk.color,
                opacity: 0.9,
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
            {new Date(txn.timestamp).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'}
          </span>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// INTELLIGENCE MODULE  (sidebar panel wrapper)
// =============================================================================

// =============================================================================
// RAIL TELEMETRY ROW
// =============================================================================

function RailTelemetryRow({
  name,
  status,
  load,
  latency,
  successRate,
  settlementTime,
  context,
}: {
  name: string;
  status: string;
  load: number;
  latency: string;
  successRate?: string;
  settlementTime?: string;
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
          {successRate && (
            <span className="text-[10px] text-slate-500 font-mono-data ml-1">{successRate} success</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {settlementTime && (
            <>
              <span className="font-mono-data text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                {settlementTime}
              </span>
              <span className="text-slate-600 text-[10px]">•</span>
            </>
          )}
          <span className="font-mono-data text-[10px] text-slate-600">
            {latency}
          </span>
          <span className="text-slate-600 text-[10px]">•</span>
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
        <span className="font-mono-data text-[10px] text-slate-600 text-right tabular-nums whitespace-nowrap">
          Volume Share: {loadInt}%
        </span>
      </div>
      {context && (
        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{context}</p>
      )}
    </div>
  );
}
