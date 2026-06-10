import RailUsageChart from "@/components/RailUsageChart";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import TransactionTimeline from "@/components/TransactionTimeline";

import { Transaction } from "@/types/transaction";
import { TelemetrySnapshot } from "../../app/page";

interface AnalyticsGridProps {
  transactions: Transaction[];
  telemetryHistory: TelemetrySnapshot[];
}

export default function AnalyticsGrid({
  transactions,
  telemetryHistory,
}: AnalyticsGridProps) {
  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-px h-4"
            style={{ background: "linear-gradient(to bottom, var(--cyan-bright), transparent)" }}
          />
          <span className="section-label">Operational Analytics</span>
        </div>
        <span className="font-mono-data text-[10px] text-slate-600 uppercase tracking-widest">
          Real-time · {transactions.length} records
        </span>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="min-w-0">
          <RailUsageChart transactions={transactions} />
        </div>
        <div className="min-w-0">
          <RiskDistributionChart transactions={transactions} />
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="min-w-0">
        <TransactionTimeline telemetryHistory={telemetryHistory} />
      </div>

    </div>
  );
}