"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Transaction } from "@/types/transaction";

interface TransactionTimelineProps {
  transactions: Transaction[];
}

export default function TransactionTimeline({
  transactions,
}: TransactionTimelineProps) {

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );

  const data = sortedTransactions.map((transaction) => {

    const time = new Date(
      transaction.timestamp
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      time,
      amount: transaction.amount,
    };
  });

  return (
    <div className="bg-[#0B1117] border border-slate-800 rounded-2xl p-6">

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Transaction Timeline
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Real-time operational payment telemetry.
        </p>
      </div>

      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
            />

            <XAxis
              dataKey="time"
              stroke="#94a3b8"
            />

            <YAxis
              stroke="#94a3b8"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="amount"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{
                fill: "#06b6d4",
                r: 5,
              }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}