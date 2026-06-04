"use client";

import { useEffect, useState } from "react";
import { fetchTransactions } from "@/lib/api";
import { Transaction } from "@/types/transaction";
import RailFlowEngine from "@/components/RailFlowEngine";
import RailUsageChart from "@/components/RailUsageChart";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  CreditCard,
  ShieldAlert,
  Terminal,
  Server,
  Zap
} from "lucide-react";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sourceMode, setSourceMode] = useState("LOADING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchTransactions();
        setTransactions(data.transactions || []);
        setSourceMode(data.source_mode || "MOCK");
      } catch (error) {
        console.error(error);
        setSourceMode("ERROR");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
          Initializing Financial Intelligence Rail...
        </p>
      </div>
    );
  }

  // Calculate KPIs
  const totalAmount = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const riskAlerts = transactions.filter((t) => t.risk_level === "HIGH" || t.risk_score > 50).length;

  return (
    <main className="min-h-screen bg-[#030712] text-slate-300 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        
        {/* HERO HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Terminal className="text-cyan-500 w-8 h-8" />
              Open Banking Intelligence Rail
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base font-medium">
              Hybrid Payments Orchestration Platform
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-[#0B1117] shadow-lg shadow-black/50">
              <div className={`w-2 h-2 rounded-full ${sourceMode === 'LIVE' ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                {sourceMode} DATA FEED
              </span>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT: 70/30 */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* MAIN STAGE (70%) */}
          <div className="w-full lg:w-[70%] space-y-8">
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard title="Connected Accounts" value={transactions.length > 0 ? "3" : "0"} icon={CreditCard} />
              <KpiCard title="Payments Routed" value={`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={ArrowRightLeft} />
              <KpiCard title="Active Rails" value="ACH, WIRE, RTP" icon={Activity} />
              <KpiCard title="Risk Alerts" value={riskAlerts.toString()} icon={AlertCircle} alert={riskAlerts > 0} />
            </div>

            {/* HYBRID RAIL FLOW */}
            <RailFlowEngine />
            <RailUsageChart transactions={transactions} />

            {/* TRANSACTION TABLE */}
            <div className="bg-[#0B1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="p-5 border-b border-slate-800 bg-[#0B1117]/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-500" />
                  Transaction Ledger
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#030712] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Bank</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold">Rail</th>
                      <th className="px-6 py-4 font-semibold">Risk</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors group cursor-default">
                          <td className="px-6 py-4 font-medium text-slate-200">{txn.user}</td>
                          <td className="px-6 py-4 text-slate-400">{txn.bank}</td>
                          <td className="px-6 py-4 font-mono text-right text-white">${txn.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                              {txn.rail}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                              txn.risk_level === 'HIGH' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                : txn.risk_level === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {txn.risk_score} - {txn.risk_level}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${txn.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{txn.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                            {new Date(txn.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* INTELLIGENCE SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-6">
            
            <SidebarPanel title="Intelligence Brief" icon={Zap}>
              <p className="text-sm text-slate-400 leading-relaxed">
                System is actively monitoring hybrid payment orchestrations across 3 major endpoints. Risk anomaly detection is nominal. Latency is within acceptable enterprise thresholds.
              </p>
            </SidebarPanel>
            
            <SidebarPanel title="Active Rails" icon={ArrowRightLeft}>
              <div className="space-y-3">
                <RailStatus name="ACH" status="Optimal" load="34%" />
                <RailStatus name="WIRE" status="Optimal" load="12%" />
                <RailStatus name="RTP" status="Degraded" load="89%" />
              </div>
            </SidebarPanel>

            <SidebarPanel title="Risk Engine" icon={ShieldAlert}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="text-sm text-slate-400">Current Threat Level</span>
                <span className="text-sm font-bold text-emerald-400">LOW</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Anomaly Detection</span>
                  <span className="text-slate-300">Active</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Fraud Models</span>
                  <span className="text-slate-300">v2.4.1 (Stable)</span>
                </div>
              </div>
            </SidebarPanel>

            <SidebarPanel title="Transaction Health" icon={Activity}>
              <div className="h-24 w-full flex items-end justify-between gap-1 mt-4">
                {[40, 65, 30, 85, 55, 90, 45, 70, 50, 100].map((h, i) => (
                  <div key={i} className="w-full bg-cyan-500/20 rounded-t-sm hover:bg-cyan-500/40 transition-colors" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                <span>T-60m</span>
                <span>NOW</span>
              </div>
            </SidebarPanel>

          </div>
        </div>
      </div>
    </main>
  );
}

// Subcomponents

function KpiCard({ title, value, icon: Icon, alert = false }: { title: string, value: string, icon: any, alert?: boolean }) {
  return (
    <div className={`p-5 rounded-xl border ${alert ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800 bg-[#0B1117]'} backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${alert ? 'text-red-500' : 'text-cyan-500'}`}>
        <Icon className="w-16 h-16 transform rotate-12 scale-110" />
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold tracking-tight ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function SidebarPanel({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-[#0B1117] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/30">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-500" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function RailStatus({ name, status, load }: { name: string, status: string, load: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-colors cursor-default">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
        <span className="text-sm font-semibold text-slate-300">{name}</span>
      </div>
      <div className="text-right">
        <span className="text-xs text-slate-500 mr-3">Load: {load}</span>
        <span className={`text-xs font-medium ${status === 'Optimal' ? 'text-emerald-400' : 'text-amber-400'}`}>{status}</span>
      </div>
    </div>
  );
}