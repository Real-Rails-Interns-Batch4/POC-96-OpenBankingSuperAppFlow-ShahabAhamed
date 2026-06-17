"use client";

import { useEffect, useMemo } from "react";
import { Transaction } from "@/types/transaction";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Activity,
  FileCheck,
  Server,
} from "lucide-react";

interface TransactionDrawerProps {
  txn: Transaction | null;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCostEstimate(rail: string): string {
  if (rail === "RTP") return "$1.00 flat";
  if (rail === "WIRE") return "$15.00 – $35.00";
  return "$0.20 – $0.50";
}

function getAlternativeRail(rail: string): string {
  if (rail === "RTP") return "WIRE (Failover)";
  if (rail === "WIRE") return "RTP (If eligible)";
  return "RTP (Expedited)";
}

function getRiskCategory(score: number): string {
  if (score >= 80) return "Velocity & AML Anomaly";
  if (score >= 60) return "Behavioral Deviation";
  if (score >= 40) return "Unusual Location";
  return "Standard Profile";
}

function getRoutingExplanation(txn: Transaction): string {
  if (txn.rail === "WIRE" && txn.amount >= 10000) return "Wire transfer selected for high-value institutional routing. Transactions above $10,000 require WIRE for regulatory compliance, same-day finality, and enhanced audit trail required by BSA/AML frameworks.";
  if (txn.rail === "WIRE" && txn.risk_level === "HIGH") return "HIGH-risk profile triggered risk-mitigation escalation to WIRE. Provides full correspondent bank audit trail, manual review capability, and compliance monitoring.";
  if (txn.rail === "RTP" && txn.risk_level === "LOW") return "Real-Time Payment (RTP) rail selected for low-risk, time-sensitive settlement. FedNow infrastructure guarantees sub-30 second finality with 24/7 availability.";
  if (txn.rail === "RTP") return "RTP selected due to urgency priority flag. Despite elevated risk score, real-time settlement reduces exposure window. Enhanced behavioral monitoring applied.";
  if (txn.risk_level === "LOW") return "ACH selected as the optimal cost-efficiency rail for low-risk consumer transactions. NACHA-compliant T+1 settlement with batch processing guarantees.";
  return "ACH selected as the standard routing path for moderate-risk transactions. Cost-efficient, highly reliable, with proven stability across domestic payment infrastructure.";
}

function getSettlementTime(rail: string): string {
  if (rail === "RTP") return "< 30 seconds";
  if (rail === "WIRE") return "Same Business Day";
  return "T+1 Business Day";
}

function getSettlementNetwork(rail: string): string {
  if (rail === "RTP") return "FedNow / TCH";
  if (rail === "WIRE") return "FedWire / CHIPS";
  return "NACHA";
}

// ─── Rail / Risk color maps ──────────────────────────────────────────────────

const RAIL_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  ACH:  { color: "#22D3EE", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)" },
  WIRE: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
  RTP:  { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)" },
};

const RISK_COLORS: Record<string, { color: string }> = {
  LOW:    { color: "#34D399" },
  MEDIUM: { color: "#FCD34D" },
  HIGH:   { color: "#F87171" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TransactionDrawer({
  txn,
  onClose,
}: TransactionDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Derived state that persists while drawer animates out
  const cachedTxn = useMemo(() => txn, [txn]);

  if (!cachedTxn) return null;

  const rail = RAIL_COLORS[cachedTxn.rail] || RAIL_COLORS.ACH;
  const risk = RISK_COLORS[cachedTxn.risk_level] || RISK_COLORS.LOW;
  const isCompleted = cachedTxn.status === "COMPLETED";
  const statusColor = isCompleted
    ? "#34D399"
    : cachedTxn.status === "PENDING"
    ? "#F59E0B"
    : "#22D3EE";

  // Derive fraud probability from score
  const fraudProb = Math.min(99.9, Math.max(0.1, (cachedTxn.risk_score / 100) * 85 + (cachedTxn.amount > 5000 ? 10 : 0)));

  // Derive compliance statuses deterministically from ID
  const idHash = cachedTxn.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const amlPass = cachedTxn.risk_score < 80;
  const kycPass = idHash % 100 !== 0; // 99% pass rate
  const sanctionsPass = cachedTxn.risk_score < 90;

  // Timeline events
  const timeline = [
    { label: "Created", desc: "Payment initiated by user", time: new Date(new Date(cachedTxn.timestamp).getTime() - 4000).toLocaleTimeString(), done: true },
    { label: "Risk Scored", desc: `Score: ${cachedTxn.risk_score} (${cachedTxn.risk_level})`, time: new Date(new Date(cachedTxn.timestamp).getTime() - 3000).toLocaleTimeString(), done: true },
    { label: "Compliance Checked", desc: amlPass && kycPass && sanctionsPass ? "All clear" : "Review required", time: new Date(new Date(cachedTxn.timestamp).getTime() - 2000).toLocaleTimeString(), done: true },
    { label: "Route Selected", desc: `Rail: ${cachedTxn.rail}`, time: new Date(new Date(cachedTxn.timestamp).getTime() - 1000).toLocaleTimeString(), done: true },
    { label: "Settled", desc: isCompleted ? "Funds cleared" : "Awaiting finality", time: new Date(cachedTxn.timestamp).toLocaleTimeString(), done: isCompleted },
  ];

  return (
    <AnimatePresence>
      {txn && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full z-50 overflow-y-auto"
            style={{
              maxWidth: "540px",
              background: "linear-gradient(180deg, #0B1220 0%, #081120 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "-32px 0 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Sticky header */}
            <div
              className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
              style={{
                background: "rgba(8,17,32,0.95)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div>
                <p className="section-label mb-0.5">Transaction Drilldown</p>
                <p className="font-mono-data text-xs text-slate-600">{cachedTxn.id}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                }
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 1. AMOUNT HERO & SUMMARY */}
              <div
                className="p-5 rounded-xl"
                style={{
                  background: "rgba(34,211,238,0.04)",
                  border: "1px solid rgba(34,211,238,0.1)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="section-label mb-2">Payment Amount</p>
                    <p
                      className="font-mono-data tabular-nums font-bold leading-none mb-3"
                      style={{
                        fontSize: "36px",
                        color: "#FFFFFF",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      $
                      {cachedTxn.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="font-mono-data font-semibold px-2.5 py-1 rounded text-xs"
                        style={{
                          color: rail.color,
                          background: rail.bg,
                          border: `1px solid ${rail.border}`,
                        }}
                      >
                        {cachedTxn.rail === "RTP" ? "FEDNOW" : cachedTxn.rail}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: statusColor }}
                        />
                        <span
                          className="font-mono-data text-[10px] uppercase tracking-widest"
                          style={{ color: statusColor }}
                        >
                          {cachedTxn.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="section-label mb-1">Initiating User</p>
                    <p className="text-sm font-semibold text-slate-200 mb-2">{cachedTxn.user}</p>
                    <p className="section-label mb-1">Institution</p>
                    <p className="text-sm font-semibold text-slate-300">{cachedTxn.bank}</p>
                  </div>
                </div>
              </div>

              {/* 2. RISK ANALYSIS & COMPLIANCE */}
              <div>
                <p className="section-label mb-3">Risk & Compliance Assessment</p>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Risk Meter */}
                  <div className="p-4 rounded-lg flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-semibold text-white">Risk Profile</span>
                        </div>
                        <span className="font-mono-data text-xs font-bold" style={{ color: risk.color }}>{cachedTxn.risk_level}</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Category</p>
                        <p className="text-xs font-medium text-slate-300">{getRiskCategory(cachedTxn.risk_score)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-slate-400">Model Score</span>
                          <span className="font-mono-data text-xs" style={{ color: risk.color }}>{cachedTxn.risk_score}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cachedTxn.risk_score}%`, background: risk.color }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-slate-400">Fraud Probability</span>
                          <span className="font-mono-data text-xs text-slate-300">{fraudProb.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${fraudProb}%`, background: fraudProb > 50 ? "#F87171" : "#A78BFA" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compliance List */}
                  <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <FileCheck className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-white">Compliance</span>
                    </div>
                    <div className="space-y-3">
                      <ComplianceRow label="AML Review" pass={amlPass} />
                      <ComplianceRow label="KYC Status" pass={kycPass} />
                      <ComplianceRow label="Sanctions Check" pass={sanctionsPass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SETTLEMENT DETAILS */}
              <div>
                <p className="section-label mb-3">Settlement & Routing</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs text-slate-500 mb-1">ETA</p>
                    <p className="font-mono-data text-xs font-semibold text-white">{getSettlementTime(cachedTxn.rail)}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs text-slate-500 mb-1">Est. Cost</p>
                    <p className="font-mono-data text-xs font-semibold text-emerald-400">{getCostEstimate(cachedTxn.rail)}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs text-slate-500 mb-1">Routing Path</p>
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="font-mono-data text-xs font-semibold text-white">{cachedTxn.rail === "RTP" ? "FEDNOW" : cachedTxn.rail}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs text-slate-500 mb-1">Alternative Rail</p>
                    <p className="font-mono-data text-xs font-semibold text-slate-400">{getAlternativeRail(cachedTxn.rail)}</p>
                  </div>
                  <div className="p-3 rounded-lg col-span-2 sm:col-span-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs text-slate-500 mb-1">Network</p>
                    <p className="font-mono-data text-xs font-semibold text-white">{getSettlementNetwork(cachedTxn.rail)}</p>
                  </div>
                </div>
              </div>

              {/* 4. EVENT TIMELINE */}
              <div>
                <p className="section-label mb-4">Event Timeline</p>
                <div className="relative pl-3">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800" />
                  
                  {timeline.map((event, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.3 }}
                      className="relative flex items-start gap-4 mb-6 last:mb-0"
                    >
                      <div 
                        className="relative z-10 w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0"
                        style={{ 
                          background: event.done ? "#34D399" : "#1E293B",
                          border: event.done ? "2px solid rgba(52,211,153,0.3)" : "2px solid #334155" 
                        }}
                      />
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-white">{event.label}</span>
                          <span className="font-mono-data text-[10px] text-slate-500">{event.time}</span>
                        </div>
                        <p className="text-xs text-slate-400">{event.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Routing explanation (from previous) */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(167,139,250,0.04)",
                  border: "1px solid rgba(167,139,250,0.12)",
                  borderLeft: "3px solid rgba(167,139,250,0.4)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-purple-400/60" />
                  <p className="section-label text-purple-400/70">
                    Routing Explanation
                  </p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {getRoutingExplanation(cachedTxn)}
                </p>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ComplianceRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-300">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono-data text-[10px] uppercase" style={{ color: pass ? "#34D399" : "#F87171" }}>
          {pass ? "Cleared" : "Flagged"}
        </span>
        {pass ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-red-400" />
        )}
      </div>
    </div>
  );
}
