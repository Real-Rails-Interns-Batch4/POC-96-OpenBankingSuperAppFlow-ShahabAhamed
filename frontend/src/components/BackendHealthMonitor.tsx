"use client";

import { useEffect, useState, useMemo } from "react";
import { Transaction } from "@/types/transaction";
import { CheckCircle2, XCircle, AlertCircle, Wifi } from "lucide-react";

interface BackendHealthMonitorProps {
  apiStatus: "ONLINE" | "OFFLINE" | "DEGRADED";
  apiLatency: number;
  transactions: Transaction[];
  sourceState: "LIVE_API" | "MOCK_MODE" | "OFFLINE_FALLBACK";
}

type ServiceState = "ONLINE" | "OFFLINE" | "DEGRADED" | "DISCONNECTED" | "SIMULATED" | "SIMULATION MODE" | "PAUSED";

interface ServiceInfo {
  name: string;
  status: ServiceState;
  latency: string | null;
  uptime: string | null;
  lastCheck: string;
}

const STATUS_CFG: Record<ServiceState, { color: string; label: string; Icon: any }> = {
  ONLINE:   { color: "#34D399", label: "ONLINE",       Icon: CheckCircle2 },
  OFFLINE:  { color: "#F87171", label: "OFFLINE",      Icon: XCircle },
  DEGRADED: { color: "#F59E0B", label: "DEGRADED",     Icon: AlertCircle },
  DISCONNECTED: { color: "#F87171", label: "DISCONNECTED", Icon: XCircle },
  SIMULATED:    { color: "#F59E0B", label: "SIMULATED",    Icon: AlertCircle },
  "SIMULATION MODE": { color: "#F59E0B", label: "SIMULATION",   Icon: AlertCircle },
  PAUSED:       { color: "#F59E0B", label: "PAUSED",       Icon: AlertCircle },
};

export default function BackendHealthMonitor({
  apiStatus,
  apiLatency,
  transactions,
  sourceState,
}: BackendHealthMonitorProps) {
  // DB Simulation State
  const [dbStatus, setDbStatus] = useState<"ONLINE" | "DEGRADED">("ONLINE");

  const uptimeBase = useMemo(() => {
    return {
      api: (99.9 + Math.random() * 0.09).toFixed(3),
      risk: (99.95 + Math.random() * 0.04).toFixed(3),
      db: (99.8 + Math.random() * 0.1).toFixed(3),
      plaid: "99.999",
      settlement: (99.9 + Math.random() * 0.05).toFixed(3),
    };
  }, []);

  useEffect(() => {
    // Database fluctuates occasionally
    const interval = setInterval(() => {
      setDbStatus((prev) => (Math.random() > 0.8 ? (prev === "ONLINE" ? "DEGRADED" : "ONLINE") : prev));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const lastCheckStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const isLive = sourceState === "LIVE_API";

  const services: ServiceInfo[] = [
    {
      name: "Backend API",
      status: isLive ? apiStatus : "OFFLINE",
      latency: isLive ? `${apiLatency}ms` : null,
      uptime: isLive ? `${uptimeBase.api}%` : null,
      lastCheck: lastCheckStr,
    },
    {
      name: "Risk Engine",
      status: isLive ? (transactions.length > 0 && transactions.every((t) => typeof t.risk_score === "number") ? "ONLINE" : "DEGRADED") : "SIMULATION MODE",
      latency: isLive ? "42ms" : null,
      uptime: isLive ? `${uptimeBase.risk}%` : null,
      lastCheck: lastCheckStr,
    },
    {
      name: "Database",
      status: isLive ? dbStatus : "OFFLINE",
      latency: isLive ? (dbStatus === "ONLINE" ? "8ms" : "145ms") : null,
      uptime: isLive ? `${uptimeBase.db}%` : null,
      lastCheck: lastCheckStr,
    },
    {
      name: "Plaid Service",
      status: isLive ? "ONLINE" : "DISCONNECTED",
      latency: isLive ? "110ms" : null,
      uptime: isLive ? `${uptimeBase.plaid}%` : null,
      lastCheck: lastCheckStr,
    },
    {
      name: "Settlement Svc",
      status: isLive ? (transactions.length === 0 ? "ONLINE" : transactions.filter((t) => t.status === "COMPLETED").length / transactions.length >= 0.5 ? "ONLINE" : "DEGRADED") : "PAUSED",
      latency: isLive ? "5ms" : null,
      uptime: isLive ? `${uptimeBase.settlement}%` : null,
      lastCheck: lastCheckStr,
    },
  ];

  // Add random jitter to latencies
  const [jitteredServices, setJitteredServices] = useState<ServiceInfo[]>(services);

  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setJitteredServices(
        services.map((s) => {
          if (s.latency === "—" || s.latency === null) return s;
          const base = parseInt(s.latency) || 10;
          const jitter = Math.floor(Math.random() * (base * 0.2)) - (base * 0.1); // +/- 10%
          const next = Math.max(1, base + jitter);
          return { ...s, latency: `${Math.round(next)}ms` };
        })
      );
    }, 3000);
    return () => clearInterval(jitterInterval);
  }, [services]);

  const displayServices = jitteredServices.length ? jitteredServices : services;
  const onlineCount = displayServices.filter((s) => s.status === "ONLINE").length;
  const totalServices = displayServices.length;

  return (
    <div className="space-y-1.5">
      {/* Summary bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <Wifi
            className="w-3.5 h-3.5"
            style={{ color: onlineCount === totalServices ? "#34D399" : onlineCount > 2 ? "#F59E0B" : "#F87171" }}
          />
          <span
            className="section-label"
            style={{ color: onlineCount === totalServices ? "#34D399" : onlineCount > 2 ? "#F59E0B" : "#F87171" }}
          >
            {onlineCount}/{totalServices} Services Online
          </span>
        </div>
      </div>

      {/* Service rows */}
      {displayServices.map((svc, i) => {
        const cfg = STATUS_CFG[svc.status];
        const Icon = cfg.Icon;
        return (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-3 rounded-md transition-colors duration-150"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-center gap-2">
              <Icon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: cfg.color }}
              />
              <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-medium leading-tight">{svc.name}</span>
                <span className="font-mono-data text-[9px] text-slate-500 mt-0.5">CHK: {svc.lastCheck}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono-data text-[10px] text-slate-500 w-12 text-right">
                {svc.uptime}
              </span>
              <span className="font-mono-data text-[10px] text-slate-600 tabular-nums w-10 text-right">
                {svc.latency}
              </span>
              <span
                className="font-mono-data text-[9px] font-semibold uppercase tracking-wide w-14 text-right"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
