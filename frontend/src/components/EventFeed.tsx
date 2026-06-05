const events = [
  {
    severity: "HIGH",
    message: "RTP congestion detected across payment rail.",
    time: "2 min ago",
  },
  {
    severity: "MEDIUM",
    message: "Wire transfer anomaly flagged for review.",
    time: "5 min ago",
  },
  {
    severity: "LOW",
    message: "ACH settlement latency normalized.",
    time: "12 min ago",
  },
];

export default function EventFeed() {

  function getSeverityStyles(severity: string) {

    if (severity === "HIGH") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    if (severity === "MEDIUM") {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }

    return "border-green-500/30 bg-green-500/10 text-green-400";
  }

  return (

    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl p-6">

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-white">
          Intelligence Event Stream
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Synthetic operational incidents and fraud telemetry.
        </p>

      </div>

      <div className="space-y-4">

        {events.map((event, index) => (

          <div
            key={index}
            className={`border rounded-xl p-4 ${getSeverityStyles(event.severity)}`}
          >

            <div className="flex items-center justify-between mb-2">

              <span className="font-semibold">
                {event.severity}
              </span>

              <span className="text-xs opacity-70">
                {event.time}
              </span>

            </div>

            <p className="text-sm">
              {event.message}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}
