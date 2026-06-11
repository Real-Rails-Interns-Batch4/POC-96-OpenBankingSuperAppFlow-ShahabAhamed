import { Transaction } from "@/types/transaction";

export function calculateMetrics(transactions: Transaction[]) {
  const totalTxns = Math.max(transactions.length, 1);
  const connectedBanks = new Set(transactions.map(t => t.bank)).size;
  const totalAmount = transactions.reduce((acc, t) => acc + t.amount, 0);

  const completedCount = transactions.filter(t => t.status === "COMPLETED").length;
  const pendingCount = transactions.length === 0 ? 0 : transactions.length - completedCount;
  const successRateStr = ((completedCount / totalTxns) * 100).toFixed(1);

  let totalHours = 0;
  const rc: Record<string, number> = {};
  const riskMap: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };

  transactions.forEach(t => {
    rc[t.rail] = (rc[t.rail] || 0) + 1;
    riskMap[t.risk_level] = (riskMap[t.risk_level] || 0) + 1;
    
    if (t.rail === "ACH") totalHours += 24;
    else if (t.rail === "WIRE") totalHours += 2;
  });

  // Exact rail percentages summing to 100%
  let railSum = 0;
  const railPercentages: Record<string, number> = {};
  if (transactions.length > 0) {
    ["ACH", "WIRE"].forEach(rail => {
      const pct = Math.round(((rc[rail] || 0) / transactions.length) * 100);
      railPercentages[rail] = pct;
      railSum += pct;
    });
    railPercentages["RTP"] = Math.max(0, 100 - railSum);
  } else {
    railPercentages["ACH"] = 0;
    railPercentages["WIRE"] = 0;
    railPercentages["RTP"] = 0;
  }

  // Exact risk percentages summing to 100%
  let riskSum = 0;
  const riskPercentages: Record<string, number> = {};
  if (transactions.length > 0) {
    ["LOW", "MEDIUM"].forEach(level => {
      const pct = Math.round(((riskMap[level] || 0) / transactions.length) * 100);
      riskPercentages[level] = pct;
      riskSum += pct;
    });
    riskPercentages["HIGH"] = Math.max(0, 100 - riskSum);
  } else {
    riskPercentages["LOW"] = 0;
    riskPercentages["MEDIUM"] = 0;
    riskPercentages["HIGH"] = 0;
  }

  const avgHrs = totalHours / totalTxns;
  const avgSettlementLabel = avgHrs < 1 ? "< 1 hr" : `${avgHrs.toFixed(1)} hrs`;

  // Threat Level
  const riskAlerts = riskMap["HIGH"] || 0;
  const clearedAnomalies = transactions.filter(t => t.risk_level === "HIGH" && t.status === "COMPLETED").length;
  const activeThreats = Math.max(0, riskAlerts - clearedAnomalies);

  let threatLevel: "LOW" | "MODERATE" | "ELEVATED" | "CRITICAL" = "LOW";
  if (activeThreats >= 10) threatLevel = "CRITICAL";
  else if (activeThreats >= 6) threatLevel = "ELEVATED";
  else if (activeThreats >= 3) threatLevel = "MODERATE";

  // Exposure score calculation (0-100) based on actual distributions
  const riskExposureScore = Math.min(100, Math.round(((riskMap["HIGH"] * 100) + (riskMap["MEDIUM"] * 50) + (riskMap["LOW"] * 10)) / totalTxns));

  return {
    totalTxns,
    connectedBanks,
    totalAmount,
    successRateStr,
    railCounts: rc,
    railPercentages,
    riskMap,
    riskPercentages,
    avgSettlementLabel,
    riskAlerts,
    clearedAnomalies,
    activeThreats,
    threatLevel,
    riskExposureScore,
    completedCount,
    pendingCount
  };
}
