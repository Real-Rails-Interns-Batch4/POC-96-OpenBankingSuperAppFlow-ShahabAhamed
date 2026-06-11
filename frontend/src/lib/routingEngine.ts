import { RAIL_CONFIG, Rail, Priority, RiskLevel } from "./railConfig";

export type { Rail, Priority, RiskLevel };

export interface SimInput {
  amount: number;
  institution?: string;
  riskScore: number;
  priority: Priority;
}

export interface SimResult {
  rail: Rail;
  confidence: number;
  reasoning: string;
  settlementTime: string;
  riskAssessment: RiskLevel;
  costEstimate: string;
  reviewProbability: string;
  complianceRisk: string;
  factors: string[];
}

// ─── Routing engine (pure deterministic function) ────────────────────────────

export function computeRouting(input: SimInput): SimResult {
  const { amount, riskScore, priority } = input;
  let rail: Rail;
  let rawConfidence: number;
  let reasoning: string;
  let factors: string[];

  if (amount <= 0) {
    rail = "ACH";
    rawConfidence = 0.1;
    reasoning = `Zero or negative transaction value ($${amount.toLocaleString()}) is invalid for standard routing logic. Automatic rejection or manual intervention required.`;
    factors = ["Amount ≤ $0 — Invalid", "Automatic rejection protocol", "Manual review required"];
  } else if (amount >= 50000) {
    rail = "WIRE";
    rawConfidence = 98.5 + (riskScore > 50 ? 1.2 : 0) - (amount % 100 === 0 ? 0 : 0.4);
    reasoning = `High-value wire mandatory for transactions ≥$50K. Federal Regulation J and UCC Article 4A require WIRE for institutional-grade settlement. Same-day finality with full SWIFT audit trail.`;
    factors = ["Amount ≥$50K — WIRE mandatory", "Federal Reg J compliance", "SWIFT correspondent routing"];
  } else if (amount >= 10000) {
    rail = "WIRE";
    rawConfidence = 92.4 + (riskScore / 10) - (priority === "URGENT" ? 1.5 : 0);
    reasoning = `Transaction value $${amount.toLocaleString()} exceeds $10K threshold, triggering WIRE routing for institutional settlement guarantees, BSA compliance monitoring, and same-day finality.`;
    factors = ["Amount >$10K threshold crossed", "BSA/AML monitoring required", "Same-day institutional settlement"];
  } else if (priority === "URGENT" && riskScore < 55) {
    rail = "RTP";
    rawConfidence = 95.8 - (riskScore / 15) + (amount < 1000 ? 2.1 : 0);
    reasoning = `URGENT priority with acceptable risk score (${riskScore}) qualifies for Real-Time Payment rail. FedNow guarantees sub-30 second settlement finality with 24/7 availability.`;
    factors = [`URGENT priority flag`, `Risk score ${riskScore} — within RTP policy`, "FedNow sub-30s finality"];
  } else if (riskScore >= 70) {
    rail = "WIRE";
    rawConfidence = 85.0 + (riskScore / 5) - (amount < 500 ? 3.2 : 0);
    reasoning = `Elevated risk score (${riskScore}) triggers risk-mitigation escalation to WIRE. Full correspondent bank audit trail enables compliance review and manual intervention before settlement.`;
    factors = [`Risk score ${riskScore} exceeds threshold`, "WIRE provides complete audit trail", "Compliance review window available"];
  } else if (priority === "BATCH") {
    rail = "ACH";
    rawConfidence = 98.9 + (amount % 2 === 0 ? 0.3 : -0.2);
    reasoning = `BATCH processing mode optimally routes via ACH. NACHA-compliant batch settlement at sub-$0.50 per-transaction cost. T+1 finality suitable for non-urgent bulk processing.`;
    factors = ["BATCH mode — ACH optimal", "NACHA T+1 settlement", "Lowest per-transaction cost"];
  } else if (priority === "URGENT" && riskScore >= 55) {
    rail = "RTP";
    rawConfidence = 72.4 - ((riskScore - 55) / 3) + (amount < 1000 ? 1.5 : -1.5);
    reasoning = `URGENT priority overrides elevated risk (${riskScore}). RTP selected to minimize exposure window. Enhanced behavioral monitoring applied throughout the real-time settlement cycle.`;
    factors = ["URGENT priority override", `Risk score ${riskScore} — monitoring active`, "Short exposure window via RTP"];
  } else {
    rail = "ACH";
    rawConfidence = 91.2 + (50 - riskScore) / 10 + (amount < 2000 ? 2.3 : -1.1);
    reasoning = `Standard transaction with low-moderate risk (${riskScore}) routes optimally via ACH. Cost-efficient NACHA batch settlement with proven reliability across domestic payment infrastructure.`;
    factors = ["Standard priority — ACH default", `Risk score ${riskScore} — within ACH policy`, "Cost-optimal routing"];
  }

  const confidence = Math.min(99.9, Math.max(0.1, rawConfidence));

  const riskAssessment: RiskLevel =
    riskScore < 35 ? "LOW" : riskScore < 65 ? "MEDIUM" : "HIGH";

  const settlementTime =
    rail === "RTP" ? "< 30 seconds" : rail === "WIRE" ? "Same Business Day" : "T+1 Business Day";

  const costEstimate = RAIL_CONFIG[rail].flatFeeRange;

  const reviewProbability = riskScore > 80 ? "High (Manual Review)" : riskScore > 50 ? "Moderate" : "Low (Auto-Clear)";
  const complianceRisk = amount > 10000 ? "Elevated (BSA/AML)" : "Standard";

  return {
    rail,
    confidence,
    reasoning,
    settlementTime,
    riskAssessment,
    costEstimate,
    reviewProbability,
    complianceRisk,
    factors,
  };
}
