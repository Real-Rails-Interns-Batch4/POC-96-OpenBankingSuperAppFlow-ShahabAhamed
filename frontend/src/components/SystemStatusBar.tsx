const systems = [
  {
    name: "API Gateway",
    status: "Operational",
    color: "bg-green-400",
  },
  {
    name: "Plaid Session",
    status: "Healthy",
    color: "bg-cyan-400",
  },
  {
    name: "FedNow Rail",
    status: "Active",
    color: "bg-green-400",
  },
  {
    name: "Risk Engine",
    status: "Stable",
    color: "bg-yellow-400",
  },
  {
    name: "Settlement Sync",
    status: "Connected",
    color: "bg-cyan-400",
  },
];

export default function SystemStatusBar() {

  return (

    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl px-6 py-4">

      <div className="flex flex-wrap items-center gap-6">

        {systems.map((system, index) => (

          <div
            key={index}
            className="flex items-center gap-3"
          >

            <div className={`w-2 h-2 rounded-full animate-pulse ${system.color}`}></div>

            <div>

              <p className="text-xs text-slate-400 uppercase tracking-wider">
                {system.name}
              </p>

              <p className="text-sm text-white font-medium">
                {system.status}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}