export default function RailFlowEngine() {
  return (
    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl p-6 mb-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Hybrid Rail Orchestration
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Intelligent routing pipeline for open banking payment settlement.
        </p>
      </div>

      {/* Flow */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto">

        {/* Bank */}
        <div className="min-w-[160px] bg-[#111827] border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Connected Bank
          </p>

          <h3 className="text-white font-semibold">
            Chase
          </h3>
        </div>

        <div className="text-cyan-500 text-2xl">→</div>

        {/* Consent */}
        <div className="min-w-[160px] bg-[#111827] border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Consent Layer
          </p>

          <h3 className="text-green-400 font-semibold">
            Approved
          </h3>
        </div>

        <div className="text-cyan-500 text-2xl">→</div>

        {/* Risk */}
        <div className="min-w-[160px] bg-[#111827] border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Risk Engine
          </p>

          <h3 className="text-yellow-400 font-semibold">
            Score: 12
          </h3>
        </div>

        <div className="text-cyan-500 text-2xl">→</div>

        {/* Rail */}
        <div className="min-w-[160px] bg-[#111827] border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Rail Selected
          </p>

          <h3 className="text-cyan-400 font-semibold">
            ACH
          </h3>
        </div>

        <div className="text-cyan-500 text-2xl">→</div>

        {/* Settlement */}
        <div className="min-w-[160px] bg-[#111827] border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Settlement
          </p>

          <h3 className="text-green-400 font-semibold">
            Complete
          </h3>
        </div>

      </div>
    </div>
  );
}