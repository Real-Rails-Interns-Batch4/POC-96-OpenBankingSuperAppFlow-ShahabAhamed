// ─── Rail Configuration — Single Source of Truth ──────────────────────────────
// All rail metadata, style tokens, and pure business-logic functions live here.
// Neither RoutingSimulator nor RailIntelligenceEngine should hardcode rail data.

// ─── Types ────────────────────────────────────────────────────────────────────

export type Rail     = "ACH" | "WIRE" | "RTP";
export type Priority = "STANDARD" | "URGENT" | "BATCH";
export type RiskLevel  = "LOW" | "MEDIUM" | "HIGH";
export type LevelLabel = "Low" | "Medium" | "High";

export interface RailConfig {
  rail:             Rail;
  operator:         string;   // full legal name
  operatorShort:    string;   // abbreviated name
  settlementTime:   string;   // canonical settlement label
  settlementWindow: string;   // compact duration display
  availability:     string;   // operating window description
  maxTxLimit:       string;   // per-transaction ceiling
  flatFee:          number;   // base fee in USD
  flatFeeDisplay:   string;   // "$0.10"
  flatFeeRange:     string;   // "$0.10 – $0.50" for simulator
  feeNote:          string;   // fee explanation
  reviewBaseProbability: number;   // baseline % before risk modifiers
  successRate:      number;   // network-level success %
  operationalUptime: string;  // e.g. "99.99%"
  cost:             LevelLabel;
  riskLevel:        LevelLabel;
  complianceImpact: LevelLabel;
  regulations:      string[];
  useCases:         string[];
  notSuitedFor:     string[];
}

// ─── Canonical Rail Metadata ──────────────────────────────────────────────────

export const RAIL_CONFIG: Record<Rail, RailConfig> = {
  ACH: {
    rail:             "ACH",
    operator:         "NACHA — National Automated Clearing House Association",
    operatorShort:    "NACHA",
    settlementTime:   "T+1 Business Day",
    settlementWindow: "1–3 Business Days",
    availability:     "Business Days Only",
    maxTxLimit:       "$25,000,000 per batch",
    flatFee:          0.10,
    flatFeeDisplay:   "$0.10",
    flatFeeRange:     "$0.10 – $0.50",
    feeNote:          "Per-item NACHA fee. Batch returns may incur additional charges.",
    reviewBaseProbability: 5,
    successRate:      99.2,
    operationalUptime: "99.9%",
    cost:             "Low",
    riskLevel:        "Low",
    complianceImpact: "Low",
    regulations: [
      "NACHA Operating Rules & Guidelines",
      "Federal Reserve Regulation E",
      "UCC Article 4A — Funds Transfers",
      "FDX API Standard Mapping",
    ],
    useCases: ["Payroll", "Subscriptions", "Bulk Payments", "Recurring Transfers"],
    notSuitedFor: ["Urgent settlements", "High-value institutional transfers", "24/7 availability"],
  },

  WIRE: {
    rail:             "WIRE",
    operator:         "Federal Reserve Wire Network (Fedwire Funds Service)",
    operatorShort:    "Federal Reserve",
    settlementTime:   "Same Business Day (RTGS)",
    settlementWindow: "< 2 Hours",
    availability:     "Mon–Fri, 09:00–18:00 ET",
    maxTxLimit:       "No per-item limit (Fedwire)",
    flatFee:          15.00,
    flatFeeDisplay:   "$15.00",
    flatFeeRange:     "$15.00 – $35.00",
    feeNote:          "Originating bank fee. Correspondent bank may add $10–$25.",
    reviewBaseProbability: 20,
    successRate:      99.95,
    operationalUptime: "99.99%",
    cost:             "High",
    riskLevel:        "Medium",
    complianceImpact: "Medium",
    regulations: [
      "Federal Reserve Regulation J",
      "UCC Article 4A — Funds Transfers",
      "BSA/AML — Bank Secrecy Act",
      "OFAC Sanctions Screening",
    ],
    useCases: ["Large Transfers", "Institutional Settlements", "Corporate Payments", "Urgent High-Value"],
    notSuitedFor: ["Micro-payments", "Consumer retail", "After-hours transfers"],
  },

  RTP: {
    rail:             "RTP",
    operator:         "The Clearing House Real-Time Payments Network",
    operatorShort:    "The Clearing House",
    settlementTime:   "Instant (< 30 seconds)",
    settlementWindow: "< 30 Seconds",
    availability:     "24 / 7 / 365",
    maxTxLimit:       "$1,000,000 per transaction",
    flatFee:          0.75,
    flatFeeDisplay:   "$0.75",
    flatFeeRange:     "$0.75 flat",
    feeNote:          "Flat per-transaction fee. No correspondent charges.",
    reviewBaseProbability: 3,
    successRate:      99.8,
    operationalUptime: "99.99%",
    cost:             "Medium",
    riskLevel:        "Low",
    complianceImpact: "Low",
    regulations: [
      "TCH RTP Network Rules",
      "Federal Reserve Regulation E",
      "FDX API Standard Mapping",
      "NACHA Same-Day ACH Guidance",
    ],
    useCases: ["Consumer Payments", "Instant Transfers", "Retail Settlements", "Urgent Low-Risk"],
    notSuitedFor: ["Transactions > $1M", "Batch / bulk processing", "High-risk accounts"],
  },
};

// ─── Open Banking Consent Data (per institution) ──────────────────────────────

export interface ConsentInfo {
  provider:    string;
  status:      string;
  scope:       string;
  tokenStatus: string;
  lastRefresh: string;
  apiVersion:  string;
}

export const CONSENT_DATA: Record<string, ConsentInfo> = {
  "Chase": {
    provider: "Plaid", status: "Verified", scope: "Accounts + Transactions",
    tokenStatus: "Active", lastRefresh: "2 min ago", apiVersion: "FDX 5.0",
  },
  "Wells Fargo": {
    provider: "Plaid", status: "Active", scope: "Accounts Only",
    tokenStatus: "Active", lastRefresh: "8 min ago", apiVersion: "FDX 4.1",
  },
  "Bank of America": {
    provider: "Plaid", status: "Verified", scope: "Accounts + Transactions",
    tokenStatus: "Active", lastRefresh: "5 min ago", apiVersion: "OBP 3.1",
  },
  "Citibank": {
    provider: "Finicity", status: "Active", scope: "Accounts + Payments",
    tokenStatus: "Refreshing", lastRefresh: "15 min ago", apiVersion: "OBP 3.0",
  },
  "Goldman Sachs": {
    provider: "Plaid", status: "Verified", scope: "Institutional API",
    tokenStatus: "Active", lastRefresh: "1 min ago", apiVersion: "FDX 5.0",
  },
};

const DEFAULT_CONSENT: ConsentInfo = {
  provider: "Plaid", status: "Active", scope: "Accounts + Transactions",
  tokenStatus: "Active", lastRefresh: "< 5 min ago", apiVersion: "FDX 5.0",
};

export function getConsentInfo(institution: string): ConsentInfo {
  return CONSENT_DATA[institution] ?? DEFAULT_CONSENT;
}

// ─── Style Tokens ─────────────────────────────────────────────────────────────

export const RAIL_STYLES: Record<Rail, { color: string; bg: string; border: string; dimBg: string }> = {
  ACH:  { color: "#22D3EE", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)",  dimBg: "rgba(34,211,238,0.04)"  },
  WIRE: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", dimBg: "rgba(167,139,250,0.04)" },
  RTP:  { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  dimBg: "rgba(52,211,153,0.04)"  },
};

export const LEVEL_STYLES: Record<LevelLabel, { color: string; bg: string }> = {
  Low:    { color: "#34D399", bg: "rgba(52,211,153,0.06)"  },
  Medium: { color: "#FCD34D", bg: "rgba(252,211,77,0.06)"  },
  High:   { color: "#F87171", bg: "rgba(248,113,113,0.06)" },
};

// ─── Routing Score Engine ─────────────────────────────────────────────────────
// Scores represent fitness of each rail for the given transaction parameters.
// Range: 0–99. The recommended rail should score highest.

export function computeRailScores(
  input: { amount: number; riskScore: number; priority: Priority }
): Record<Rail, number> {
  const { amount, riskScore, priority } = input;

  // ── ACH: optimal for low-value, low-risk, batch/standard
  let ach = 72;
  if (amount < 2000)       ach += 14;
  else if (amount < 5000)  ach += 8;
  else if (amount < 10000) ach += 2;
  else if (amount >= 10000) ach -= 22;
  if (riskScore < 35)      ach += 10;
  else if (riskScore > 65) ach -= 25;
  if (priority === "BATCH")    ach += 16;
  else if (priority === "URGENT") ach -= 22;

  // ── WIRE: optimal for high-value, compliance-heavy, institutional
  let wire = 42;
  if (amount >= 50000)      wire += 44;
  else if (amount >= 10000) wire += 28;
  else if (amount >= 5000)  wire += 10;
  else if (amount < 5000)   wire -= 18;
  if (riskScore >= 70)      wire += 14;
  else if (riskScore < 35)  wire -= 8;
  if (priority === "URGENT" && amount >= 5000) wire += 8;
  if (priority === "BATCH")  wire -= 12;

  // ── RTP: optimal for urgent, low-risk, medium-value
  let rtp = 58;
  if (priority === "URGENT")   rtp += 28;
  else if (priority === "BATCH") rtp -= 22;
  if (riskScore < 35)          rtp += 16;
  else if (riskScore < 55)     rtp += 6;
  else if (riskScore >= 70)    rtp -= 20;
  if (amount > 1_000_000)      rtp -= 35;
  else if (amount < 1000)      rtp += 5;
  else if (amount > 50000)     rtp -= 10;

  return {
    ACH:  Math.max(10, Math.min(99, Math.round(ach))),
    WIRE: Math.max(10, Math.min(99, Math.round(wire))),
    RTP:  Math.max(10, Math.min(99, Math.round(rtp))),
  };
}

// ─── Business Impact Computation ─────────────────────────────────────────────

export interface BusinessImpact {
  fee:              number;
  feeDisplay:       string;
  settlementWindow: string;
  reviewProb:       number;
  reviewLabel:      string;
  successRate:      number;
  availability:     string;
  complianceBurden: LevelLabel;
}

export function computeBusinessImpact(
  rail: Rail,
  input: { amount: number; riskScore: number; priority: Priority }
): BusinessImpact {
  const { amount, riskScore } = input;
  const cfg = RAIL_CONFIG[rail];

  // Fee: institutional wire surcharge at scale
  let fee = cfg.flatFee;
  if (rail === "WIRE" && amount >= 100_000) fee = 25.00;

  // Review probability
  let reviewProb = cfg.reviewBaseProbability;
  if (riskScore > 70)      reviewProb += 30;
  else if (riskScore > 50) reviewProb += 12;
  if (amount > 50_000)     reviewProb += 15;
  else if (amount > 10_000) reviewProb += 10;
  reviewProb = Math.min(99, reviewProb);

  const reviewLabel =
    reviewProb >= 40 ? "Manual review required" :
    reviewProb >= 20 ? "Enhanced screening active" :
    reviewProb >= 10 ? "Automated compliance check" :
    "Auto-clear eligible";

  return {
    fee,
    feeDisplay: `$${fee.toFixed(2)}`,
    settlementWindow: cfg.settlementWindow,
    reviewProb,
    reviewLabel,
    successRate: cfg.successRate,
    availability: cfg.availability,
    complianceBurden: cfg.complianceImpact,
  };
}

// ─── Alternative Rail Logic ───────────────────────────────────────────────────

export interface AlternativeRec {
  rail:      Rail;
  tradeoff:  string;
  viable:    boolean;
  costDelta: string;   // e.g. "-$14.25 vs WIRE"
}

export function getAlternativeRail(
  primary: Rail,
  input: { amount: number; priority: Priority }
): AlternativeRec {
  const { amount, priority } = input;
  const primaryFee = RAIL_CONFIG[primary].flatFee;

  if (primary === "WIRE") {
    if (amount <= 1_000_000 && priority === "URGENT") {
      const delta = primaryFee - RAIL_CONFIG["RTP"].flatFee;
      return {
        rail: "RTP", viable: true,
        costDelta: `-$${delta.toFixed(2)} vs WIRE`,
        tradeoff: `RTP delivers identical settlement speed at ${RAIL_CONFIG["RTP"].flatFeeDisplay} vs ${RAIL_CONFIG["WIRE"].flatFeeDisplay}. Viable if amount ≤ $1M and risk score < 70.`,
      };
    }
    const delta = primaryFee - RAIL_CONFIG["ACH"].flatFee;
    return {
      rail: "ACH", viable: amount < 10_000,
      costDelta: `-$${delta.toFixed(2)} vs WIRE`,
      tradeoff: `ACH costs ${RAIL_CONFIG["ACH"].flatFeeDisplay} vs ${RAIL_CONFIG["WIRE"].flatFeeDisplay} but requires T+1 settlement. Only viable if same-day finality is not mandatory.`,
    };
  }

  if (primary === "RTP") {
    const delta = RAIL_CONFIG["RTP"].flatFee - RAIL_CONFIG["ACH"].flatFee;
    return {
      rail: "ACH", viable: priority !== "URGENT",
      costDelta: `-$${delta.toFixed(2)} vs RTP`,
      tradeoff: `ACH costs ${RAIL_CONFIG["ACH"].flatFeeDisplay} vs ${RAIL_CONFIG["RTP"].flatFeeDisplay} but defers settlement to T+1. Viable if urgency requirement can be relaxed.`,
    };
  }

  // ACH → RTP
  const delta = RAIL_CONFIG["RTP"].flatFee - RAIL_CONFIG["ACH"].flatFee;
  return {
    rail: "RTP", viable: amount <= 1_000_000,
    costDelta: `+$${delta.toFixed(2)} vs ACH`,
    tradeoff: `RTP upgrades to instant settlement for ${RAIL_CONFIG["RTP"].flatFeeDisplay} vs ${RAIL_CONFIG["ACH"].flatFeeDisplay}. Justified when time-sensitive delivery is a business requirement.`,
  };
}

// ─── Dynamic Narrative Engine ─────────────────────────────────────────────────

export function generateNarrative(
  rail: Rail,
  input: { amount: number; riskScore: number; priority: Priority }
): { primary: string; secondary: string } {
  const { amount, riskScore, priority } = input;
  const amtFmt = `$${amount.toLocaleString()}`;

  if (rail === "WIRE") {
    if (amount >= 50_000) return {
      primary: `WIRE selected because the transaction value of ${amtFmt} exceeds the institutional settlement threshold. Federal Regulation J mandates Fedwire for same-day finality on high-value transfers.`,
      secondary: `Federal Reserve Fedwire provides Real-Time Gross Settlement (RTGS) — each transaction settles individually and irrevocably within business hours, eliminating counterparty risk.`,
    };
    if (amount >= 10_000) return {
      primary: `WIRE selected because the ${amtFmt} transaction crosses the $10K BSA reporting threshold, requiring enhanced monitoring and a full correspondent bank audit trail.`,
      secondary: `Fedwire's SWIFT-compatible messaging provides the traceability required for Bank Secrecy Act compliance and FinCEN transaction monitoring obligations.`,
    };
    return {
      primary: `WIRE selected because the elevated risk score (${riskScore}/100) triggered risk-mitigation escalation. A complete correspondent bank audit trail and pre-settlement review window are required.`,
      secondary: `Fedwire's irrevocable gross settlement protects the institution from credit risk while giving compliance teams a pre-settlement review window before funds clear.`,
    };
  }

  if (rail === "RTP") {
    if (priority === "URGENT" && riskScore < 55) return {
      primary: `RTP selected because the transaction requires instant settlement and the risk profile (score: ${riskScore}/100) is within the Real-Time Payments acceptance policy threshold.`,
      secondary: `The Clearing House RTP network provides sub-30-second irrevocable fund availability, operating continuously across all TCH member institutions with no cutoff windows.`,
    };
    return {
      primary: `RTP selected to minimize settlement exposure window for this URGENT transaction. Despite an elevated risk score (${riskScore}/100), instant finality reduces counterparty credit risk versus deferred rails.`,
      secondary: `Enhanced behavioral monitoring is applied throughout the real-time settlement cycle. TCH RTP's Request for Payment capability supports full transaction lifecycle audit tracing.`,
    };
  }

  // ACH
  if (priority === "BATCH") return {
    primary: `ACH selected because BATCH processing mode is active. NACHA-compliant batch settlement provides the lowest per-transaction cost for non-urgent bulk payment files.`,
    secondary: `NACHA Operating Rules govern ACH batch submission windows. T+1 settlement is appropriate for payroll, recurring billing, and bulk disbursements where immediate finality is not required.`,
  };
  return {
    primary: `ACH selected because the ${amtFmt} transaction is below the WIRE escalation threshold and does not require immediate settlement. A risk score of ${riskScore}/100 qualifies for cost-optimal ACH routing.`,
    secondary: `NACHA's Automated Clearing House processes transactions in batch windows with proven domestic reliability. At ${RAIL_CONFIG["ACH"].flatFeeDisplay} per item, ACH is the lowest cost path for standard-priority payments.`,
  };
}

// ─── Decision Factors Generator ───────────────────────────────────────────────

export function generateDecisionFactors(
  rail: Rail,
  input: { amount: number; riskScore: number; priority: Priority }
): string[] {
  const { amount, riskScore, priority } = input;
  const factors: string[] = [];

  // Amount context
  if (amount < 10_000) factors.push(`Amount ${amount < 1000 ? "well " : ""}below WIRE threshold ($${amount.toLocaleString()} < $10,000)`);
  else if (amount >= 50_000) factors.push(`Amount exceeds institutional threshold ($${amount.toLocaleString()} ≥ $50,000)`);
  else factors.push(`Amount crosses BSA monitoring threshold ($${amount.toLocaleString()} ≥ $10,000)`);

  // Risk context
  if (riskScore < 35) factors.push(`Risk score within low-risk band (${riskScore}/100)`);
  else if (riskScore < 65) factors.push(`Risk score within medium-risk band (${riskScore}/100)`);
  else factors.push(`Elevated risk score triggers escalation (${riskScore}/100)`);

  // Priority context
  if (priority === "URGENT") factors.push("URGENT priority flag — settlement speed required");
  else if (priority === "BATCH") factors.push("BATCH mode active — cost-optimal routing selected");
  else factors.push("Standard priority — batch routing eligible");

  // Rail-specific
  if (rail === "ACH") {
    factors.push("Domestic payment — no SWIFT correspondent routing needed");
    factors.push("Cost optimization mode active — lowest per-item fee");
  } else if (rail === "WIRE") {
    factors.push("RTGS settlement required — irrevocable finality mandated");
    factors.push("BSA/AML compliance monitoring — full audit trail enabled");
  } else {
    factors.push("24/7 availability required — no cutoff window constraint");
    factors.push("Instant settlement reduces counterparty exposure window");
  }

  return factors;
}
