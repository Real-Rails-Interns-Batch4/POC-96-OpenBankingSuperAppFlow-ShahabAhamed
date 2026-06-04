import RailUsageChart from "@/components/RailUsageChart";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import TransactionTimeline from "@/components/TransactionTimeline";

import { Transaction } from "@/types/transaction";

interface AnalyticsGridProps {
  transactions: Transaction[];
}

export default function AnalyticsGrid({
  transactions,
}: AnalyticsGridProps) {

  return (

    <div className="space-y-6">

      {/* Top Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <RailUsageChart
          transactions={transactions}
        />

        <RiskDistributionChart
          transactions={transactions}
        />

      </div>

      {/* Bottom Timeline */}
      <TransactionTimeline
        transactions={transactions}
      />

    </div>
  );
}