function getServiceStatus(sourceState: "LIVE_API" | "MOCK_MODE" | "OFFLINE_FALLBACK", name: string) {
  if (sourceState === "LIVE_API") {
    switch (name) {
      case "Connected Banks":     return { status: "Operational", desc: "12ms", uptime: "99.98%", color: "dot-emerald", textColor: "text-emerald-400" };
      case "Consent Layer":       return { status: "Healthy",     desc: "34ms", uptime: "99.94%", color: "dot-cyan",    textColor: "text-cyan-400" };
      case "Risk Screening":      return { status: "Active",      desc: "8ms",  uptime: "100%",   color: "dot-emerald", textColor: "text-emerald-400" };
      case "Rail Routing":        return { status: "Stable",      desc: "47ms", uptime: "99.91%", color: "dot-amber",   textColor: "text-amber-400" };
      case "Settlement Status":   return { status: "Connected",   desc: "5ms",  uptime: "99.99%", color: "dot-emerald", textColor: "text-emerald-400" };
    }
  }

  // MOCK or OFFLINE fallback
  switch (name) {
    case "Connected Banks":     return { status: "OFFLINE",         desc: "Simulated institutional links", uptime: null, color: "dot-red",   textColor: "text-red-400" };
    case "Consent Layer":       return { status: "DISCONNECTED",    desc: "Mock OAuth 2.0 flow",           uptime: null, color: "dot-red",   textColor: "text-red-400" };
    case "Risk Screening":      return { status: "SIMULATED",       desc: "Synthetic anomaly detection",   uptime: null, color: "dot-amber", textColor: "text-amber-400" };
    case "Rail Routing":        return { status: "SIMULATION MODE", desc: "Simulated routing logic",       uptime: null, color: "dot-amber", textColor: "text-amber-400" };
    case "Settlement Status":   return { status: "PAUSED",          desc: "Simulated T+1 clearance",       uptime: null, color: "dot-amber", textColor: "text-amber-400" };
  }
  return { status: "UNKNOWN", desc: "Unknown state", uptime: null, color: "dot-red", textColor: "text-red-400" };
}

interface SystemStatusBarProps {
  sourceState: "LIVE_API" | "MOCK_MODE" | "OFFLINE_FALLBACK";
}

export default function SystemStatusBar({ sourceState }: SystemStatusBarProps) {
  const systemNames = ["Connected Banks", "Consent Layer", "Risk Screening", "Rail Routing", "Settlement Status"];
  
  const systems = systemNames.map(name => ({
    name,
    ...getServiceStatus(sourceState, name)
  }));

  const isLive = sourceState === "LIVE_API";
  const headerText = isLive 
    ? "ALL SYSTEMS NOMINAL" 
    : sourceState === "MOCK_MODE" 
      ? "SIMULATION MODE ACTIVE" 
      : "SYSTEM DEGRADED";
      
  const headerDotColor = isLive 
    ? "bg-emerald-400" 
    : sourceState === "MOCK_MODE" 
      ? "bg-amber-400" 
      : "bg-red-400";
      
  const headerTextColor = isLive 
    ? "text-emerald-500/70" 
    : sourceState === "MOCK_MODE" 
      ? "text-amber-500/70" 
      : "text-red-500/70";

  return (
    <div
      className="rounded-xl overflow-hidden mb-8"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top bar label */}
      <div
        className="px-5 py-2 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="section-label">System Telemetry</span>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${headerDotColor} animate-pulse`} />
          <span className={`section-label ${headerTextColor}`}>
            {headerText}
          </span>
        </div>
      </div>

      {/* System cells */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {systems.map((system, index) => (
          <div
            key={index}
            className="px-5 py-4 flex items-start gap-3 group"
            style={{
              borderRight:
                index < systems.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
            }}
          >
            {/* Status indicator */}
            <div className="mt-0.5 flex-shrink-0">
              <span className={`status-dot ${system.color}`} />
            </div>

            {/* Content */}
            <div className="min-w-0">
              <p className="section-label truncate mb-1">{system.name}</p>
              <p className={`text-sm font-semibold ${system.textColor} leading-none`}>
                {system.status}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {system.uptime && (
                  <span className="font-mono-data text-[10px] text-slate-600">
                    ↑ {system.uptime}
                  </span>
                )}
                <span className={`font-mono-data text-[10px] ${system.uptime ? 'text-slate-600' : system.textColor}`}>
                  {system.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}