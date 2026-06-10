const events = [
  {
    severity: "HIGH",
    code: "ALERT-0x2F",
    message: "RTP congestion detected across payment rail. Throughput degraded by 34%.",
    time: "2 min ago",
    accent: "var(--red-mid)",
    accentBg: "rgba(239,68,68,0.06)",
    accentBorder: "rgba(239,68,68,0.15)",
    textColor: "#F87171",
  },
  {
    severity: "MEDIUM",
    code: "WARN-0x11",
    message: "Wire transfer anomaly flagged for compliance review. Pattern deviation observed.",
    time: "5 min ago",
    accent: "var(--amber-mid)",
    accentBg: "rgba(245,158,11,0.06)",
    accentBorder: "rgba(245,158,11,0.15)",
    textColor: "#FCD34D",
  },
  {
    severity: "LOW",
    code: "INFO-0x07",
    message: "ACH settlement latency normalized. Batch processing resumed at nominal throughput.",
    time: "12 min ago",
    accent: "var(--emerald-mid)",
    accentBg: "rgba(16,185,129,0.05)",
    accentBorder: "rgba(16,185,129,0.12)",
    textColor: "#34D399",
  },
];

export default function EventFeed() {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-label mb-1.5">Intelligence Event Stream</p>
          <h3 className="text-white font-semibold text-base leading-none">
            Operational Incidents
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="font-mono-data text-[10px] text-slate-500 uppercase tracking-widest">
            Monitoring
          </span>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-3">
        {events.map((event, index) => (
          <div
            key={index}
            className="rounded-lg p-4 transition-all duration-150 hover:brightness-110"
            style={{
              background: event.accentBg,
              border: `1px solid ${event.accentBorder}`,
              borderLeft: `3px solid ${event.accent}`,
            }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                {/* Severity pill */}
                <span
                  className="font-mono-data text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                  style={{
                    color: event.textColor,
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  {event.severity}
                </span>
                {/* Code */}
                <span className="font-mono-data text-[10px] text-slate-600 uppercase">
                  {event.code}
                </span>
              </div>
              {/* Time */}
              <span className="font-mono-data text-[10px] text-slate-600">
                {event.time}
              </span>
            </div>

            {/* Message */}
            <p className="text-slate-300 text-sm leading-relaxed">
              {event.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
