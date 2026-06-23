"use client";

import React from "react";
import {
  Building2,
  ShieldAlert,
  Activity,
  ArrowRightLeft,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  Shield,
  BarChart3,
  Cpu,
  Lock,
  Banknote,
  AlertCircle,
} from "lucide-react";
import IntelligenceModule from "./IntelligenceModule";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarContextData {
  type: "INSTITUTION" | "INSIGHT" | "NODE" | "KPI" | "TRANSACTION" | "DEFAULT";
  id: string;
  data?: any;
}

interface SidebarContentProps {
  context: SidebarContextData | null;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function BriefingRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className="text-xs font-semibold text-right"
        style={{ color: accent || "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  );
}

function NarrativeBlock({
  label,
  children,
  accentLeft,
}: {
  label: string;
  children: React.ReactNode;
  accentLeft?: string;
}) {
  return (
    <div
      className="flex flex-col bg-white/[0.03] border border-white/[0.07] p-3.5 rounded-lg"
      style={
        accentLeft ? { borderLeft: `2px solid ${accentLeft}` } : undefined
      }
    >
      <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">
        {label}
      </span>
      <span className="text-[11px] text-slate-300 leading-relaxed">{children}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" }) {
  const cfg = {
    LOW: { color: "#34D399", bg: "rgba(52,211,153,0.12)", label: "LOW RISK" },
    MODERATE: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "MODERATE RISK" },
    ELEVATED: { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "ELEVATED RISK" },
    HIGH: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "HIGH RISK" },
  }[level];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function ComplianceBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      style={
        passed
          ? { color: "#34D399", background: "rgba(52,211,153,0.12)" }
          : { color: "#EF4444", background: "rgba(239,68,68,0.12)" }
      }
    >
      {passed ? "✓ PASSED" : "✗ FAILED"}
    </span>
  );
}

function Timestamp() {
  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Clock className="w-3 h-3 text-slate-600" />
      <span className="text-[10px] text-slate-600 font-mono">
        Last Updated · {now} UTC
      </span>
    </div>
  );
}

// =============================================================================
// INSTITUTION INTELLIGENCE
// =============================================================================

const INSTITUTION_INTEL: Record<
  string,
  {
    role: string;
    volumeShare: string;
    whyItMatters: string;
    operationalImpact: string;
    recommendation: string;
    risk: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
    railEligibility: string[];
    notes: string;
  }
> = {
  Chase: {
    role: "Primary Connected Institution",
    volumeShare: "34%",
    whyItMatters:
      "Chase processes the largest share of routed payment volume across the network. Disruption to this connection would materially impact throughput and settlement timelines.",
    operationalImpact:
      "Institution connectivity is stable. ACH corridors are operating within NACHA thresholds. No latency degradation detected.",
    recommendation:
      "Maintain preferred routing through ACH. Monitor consent expiry (Dec 2025) and initiate renewal 30 days prior.",
    risk: "LOW",
    railEligibility: ["ACH", "RTP", "WIRE"],
    notes: "FDX 5.0 API — highest protocol compliance rating across all connected institutions.",
  },
  "Bank of America": {
    role: "Secondary Institution — Consent Renewal Pending",
    volumeShare: "21%",
    whyItMatters:
      "Bank of America contributes significant secondary volume. The pending consent renewal introduces a time-sensitive compliance window that could interrupt data flow.",
    operationalImpact:
      "API sync health is Degraded. Consent token expired July 2024. Continued degraded state may trigger automatic de-prioritization in the routing engine.",
    recommendation:
      "Initiate OAuth 2.0 consent re-authorization immediately via Open Banking portal. Re-validate API connection post-renewal.",
    risk: "ELEVATED",
    railEligibility: ["ACH", "WIRE"],
    notes: "OBP 3.1 API — consent renewal required. Routing engine has applied a degraded-status penalty flag.",
  },
  "Wells Fargo": {
    role: "High-Capacity Institution",
    volumeShare: "28%",
    whyItMatters:
      "Wells Fargo offers the broadest account product coverage across connected institutions, supporting Checking, Savings, Credit, and Investment account types.",
    operationalImpact:
      "Connectivity is healthy. Full product surface accessible. Investment account data feeds are enriching risk scoring with broader portfolio signals.",
    recommendation:
      "Consider expanding routing allocation to Wells Fargo for investment-linked transactions to leverage enhanced data fidelity.",
    risk: "LOW",
    railEligibility: ["ACH", "RTP", "WIRE"],
    notes: "FDX 4.1 API — all four account products active. Highest product breadth across the connected institution network.",
  },
};

function InstitutionSidebar({ data }: { data: any }) {
  const name: string = data?.name || "Unknown Institution";
  const intel = INSTITUTION_INTEL[name] || {
    role: "Connected Institution",
    volumeShare: "N/A",
    whyItMatters: "This institution is participating in the open banking payment flow.",
    operationalImpact: "Connectivity is active.",
    recommendation: "Continue standard monitoring.",
    risk: "LOW" as const,
    railEligibility: ["ACH"],
    notes: "No additional intelligence available.",
  };

  const statusColor =
    data?.consentStatus === "Verified" || data?.consentStatus === "Active"
      ? "#34D399"
      : "#F59E0B";

  return (
    <div className="space-y-3">
      <IntelligenceModule
        title="Institution Intelligence"
        label={name}
        icon={Building2}
        accentColor="#A78BFA"
        accentBg="rgba(167,139,250,0.06)"
      >
        <div className="space-y-2">
          <BriefingRow label="Role in Network" value={intel.role} />
          <BriefingRow label="Volume Share" value={intel.volumeShare} accent="#A78BFA" />
          <BriefingRow
            label="Verification Status"
            value={data?.consentStatus || "Unknown"}
            accent={statusColor}
          />
          <BriefingRow label="API Protocol" value={data?.apiVersion || "N/A"} accent="#22D3EE" />
          <BriefingRow label="Last Sync" value={data?.lastSync || "N/A"} />
          <BriefingRow
            label="Risk Assessment"
            value={<RiskBadge level={intel.risk} />}
          />
        </div>
      </IntelligenceModule>

      <IntelligenceModule
        title="Intelligence Briefing"
        label="Narrative Analysis"
        icon={Brain}
        accentColor="#22D3EE"
        accentBg="rgba(34,211,238,0.05)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="Why This Institution Matters" accentLeft="#A78BFA">
            {intel.whyItMatters}
          </NarrativeBlock>
          <NarrativeBlock label="Operational Impact" accentLeft="#22D3EE">
            {intel.operationalImpact}
          </NarrativeBlock>
          <NarrativeBlock label="Recommendation" accentLeft="#34D399">
            {intel.recommendation}
          </NarrativeBlock>
        </div>
      </IntelligenceModule>

      <IntelligenceModule
        title="Network Eligibility"
        label="Settlement Rails"
        icon={ArrowRightLeft}
        accentColor="#34D399"
        accentBg="rgba(52,211,153,0.05)"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {intel.railEligibility.map((r) => (
              <span
                key={r}
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border"
                style={{
                  color:
                    r === "ACH" ? "#22D3EE" : r === "RTP" ? "#34D399" : "#A78BFA",
                  borderColor:
                    r === "ACH"
                      ? "rgba(34,211,238,0.25)"
                      : r === "RTP"
                      ? "rgba(52,211,153,0.25)"
                      : "rgba(167,139,250,0.25)",
                  background:
                    r === "ACH"
                      ? "rgba(34,211,238,0.06)"
                      : r === "RTP"
                      ? "rgba(52,211,153,0.06)"
                      : "rgba(167,139,250,0.06)",
                }}
              >
                {r}
              </span>
            ))}
          </div>
          <BriefingRow
            label="Connected Products"
            value={(data?.accounts || []).join(" · ")}
            accent="#e2e8f0"
          />
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{intel.notes}</p>
        </div>
      </IntelligenceModule>

      <Timestamp />
    </div>
  );
}

// =============================================================================
// AI INSIGHT INTELLIGENCE
// =============================================================================

const INSIGHT_BRIEFINGS: Record<
  string,
  {
    title: string;
    accentColor: string;
    observation: (text: string) => string;
    whyItMatters: string;
    operationalImpact: string;
    risk: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
    recommendation: string;
    expectedTrend: string;
  }
> = {
  VOLUME: {
    title: "Volume Intelligence",
    accentColor: "#A78BFA",
    observation: (text) => text,
    whyItMatters:
      "High concentration of payment volume through a single institution increases systemic dependency. Should that institution's API become unavailable, a disproportionate share of transaction throughput would be disrupted.",
    operationalImpact:
      "Current routing efficiency is operating within acceptable thresholds. No volume-related degradation detected across active settlement corridors.",
    risk: "LOW",
    recommendation:
      "Continue monitoring volume distribution. If a single institution exceeds 40% share for two consecutive cycles, initiate a load-balancing review.",
    expectedTrend:
      "Volume distribution is expected to remain stable over the next settlement cycle. No seasonal adjustment signals detected.",
  },
  RISK: {
    title: "Risk Intelligence",
    accentColor: "#F87171",
    observation: (text) => text,
    whyItMatters:
      "Elevated or concentrated risk transactions require heightened oversight. A pattern of high-risk transactions in specific rails may indicate systematic fraud vectors or settlement abuse.",
    operationalImpact:
      "Risk Engine ML Model v4.2 is actively scoring transactions. Flagged transactions are held in a secondary review queue before settlement confirmation.",
    risk: "MODERATE",
    recommendation:
      "Review flagged transactions in the secondary queue. Adjust routing constraints to de-prioritize rails showing elevated risk concentration. Enable secondary verification for counterparties with recent anomaly flags.",
    expectedTrend:
      "Risk posture is expected to normalize as the ML model incorporates additional transaction history from the current cycle.",
  },
  ROUTING: {
    title: "Routing Intelligence",
    accentColor: "#22D3EE",
    observation: (text) => text,
    whyItMatters:
      "Rail selection directly determines settlement speed, transaction cost, and regulatory exposure. Sub-optimal routing decisions compound across high-volume cycles.",
    operationalImpact:
      "The current routing engine is operating at 94%+ confidence for ACH decisions. Wire and RTP allocations are being correctly weighted by the priority engine.",
    risk: "LOW",
    recommendation:
      "Maintain current orchestration rules. No routing adjustments recommended at this time. Review FedNow allocation if RTP volume changes by more than 15% in the next cycle.",
    expectedTrend:
      "ACH will remain the dominant rail for the next 48 hours. RTP demand may increase if any time-sensitive institutional payments are submitted.",
  },
  SETTLEMENT: {
    title: "Settlement Intelligence",
    accentColor: "#34D399",
    observation: (text) => text,
    whyItMatters:
      "Pending settlements represent financial obligations that have not reached legal finality. Elevated pending counts extend counterparty exposure windows and affect liquidity planning.",
    operationalImpact:
      "Settlement completions are tracking within normal processing timelines. No liquidity constraints or reconciliation mismatches detected.",
    risk: "LOW",
    recommendation:
      "No action required. Monitor T+1 ACH batch completion. For time-sensitive unsettled items, consider RTP or WIRE escalation pathways.",
    expectedTrend:
      "All pending items expected to clear within the next settlement window. No end-of-day reconciliation risk identified.",
  },
  OPERATIONS: {
    title: "Operational Intelligence",
    accentColor: "#FCD34D",
    observation: (text) => text,
    whyItMatters:
      "Infrastructure health directly affects payment processing capacity. Any degradation in the API gateway or database layer would propagate across all connected institution connections.",
    operationalImpact:
      "All system components are operating within 99th percentile performance bounds. API Gateway latency is 24ms — well within the 100ms SLA threshold.",
    risk: "LOW",
    recommendation:
      "Maintain current monitoring posture. No escalation required. Schedule next infrastructure capacity review for end of quarter.",
    expectedTrend:
      "System load is expected to remain stable. No scheduled maintenance windows or deployment events identified in the next 24 hours.",
  },
};

function InsightSidebar({ data }: { data: any }) {
  const category: string = data?.category || "VOLUME";
  const briefing = INSIGHT_BRIEFINGS[category] || INSIGHT_BRIEFINGS.VOLUME;
  const Icon = data?.Icon || Activity;

  return (
    <div className="space-y-3">
      <IntelligenceModule
        title={briefing.title}
        label="AI Intelligence Engine"
        icon={Icon}
        accentColor={briefing.accentColor}
        accentBg={`${briefing.accentColor}12`}
      >
        <div className="space-y-2">
          <NarrativeBlock label="Current Observation" accentLeft={briefing.accentColor}>
            {briefing.observation(data?.text || "No observation data available.")}
          </NarrativeBlock>
          <BriefingRow
            label="Risk Assessment"
            value={<RiskBadge level={briefing.risk} />}
          />
        </div>
      </IntelligenceModule>

      <IntelligenceModule
        title="Executive Briefing"
        label="Narrative Analysis"
        icon={Brain}
        accentColor="#64748b"
        accentBg="rgba(100,116,139,0.05)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="Why This Matters" accentLeft={briefing.accentColor}>
            {briefing.whyItMatters}
          </NarrativeBlock>
          <NarrativeBlock label="Operational Impact" accentLeft="#22D3EE">
            {briefing.operationalImpact}
          </NarrativeBlock>
          <NarrativeBlock label="Recommendation" accentLeft="#34D399">
            {briefing.recommendation}
          </NarrativeBlock>
          <NarrativeBlock label="Expected Trend" accentLeft="#A78BFA">
            {briefing.expectedTrend}
          </NarrativeBlock>
        </div>
      </IntelligenceModule>

      <Timestamp />
    </div>
  );
}

// =============================================================================
// PIPELINE NODE INTELLIGENCE
// =============================================================================

type NodeId = "bank" | "consent" | "risk" | "rail" | "settlement";

const NODE_BRIEFINGS: Record<
  NodeId,
  {
    title: string;
    icon: React.ElementType;
    accentColor: string;
    purpose: string;
    whyItMatters: string;
    currentState: (node: any) => string;
    decisionLogic: string;
    risk: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
    compliancePassed: boolean;
    operationalImpact: string;
    recommendation: string;
  }
> = {
  bank: {
    title: "Connected Financial Institution",
    icon: Building2,
    accentColor: "#06B6D4",
    purpose:
      "Establishes the originating institution connection and retrieves account data via the Open Banking API layer.",
    whyItMatters:
      "The institution connection is the first-mile of every payment. All downstream routing and risk decisions depend on a valid, authorized data feed from this node.",
    currentState: (node) =>
      `${node?.value || "Chase"} is active as the primary originating institution. API connection is authenticated via ${node?.sublabel || "FDX 5.0"}.`,
    decisionLogic:
      "Institution selection is determined by the authenticated session context. The system verifies API token validity before admitting the connection to the pipeline.",
    risk: "LOW",
    compliancePassed: true,
    operationalImpact:
      "Institution API latency is within normal bounds. Data retrieval is complete. Pipeline has been cleared to proceed to consent verification.",
    recommendation:
      "No action required. Continue monitoring API token health and consent expiry across all connected institutions.",
  },
  consent: {
    title: "Open Banking Consent Service",
    icon: Lock,
    accentColor: "#10B981",
    purpose:
      "Validates that the payment initiator holds a current, authorized Open Banking consent token before allowing data access and transaction submission.",
    whyItMatters:
      "Consent is the legal and regulatory foundation of open banking data sharing. Without a valid consent token, data access is unauthorized and non-compliant with PSD2 and CFPB guidelines.",
    currentState: (node) =>
      `Consent status: ${node?.value || "Approved"}. Authorization method: ${node?.sublabel || "OAuth 2.0 · Plaid"}. Token is active and within its validity window.`,
    decisionLogic:
      "OAuth 2.0 authorization code flow. Token expiry is validated against the consent registry. Any expired or revoked token halts the pipeline and triggers a re-authorization prompt.",
    risk: "LOW",
    compliancePassed: true,
    operationalImpact:
      "Consent verification completed in under 40ms. No token refresh required for this session. Pipeline has been advanced to the Risk Engine.",
    recommendation:
      "Review consent expiry windows across all institutions monthly. Initiate proactive renewal for tokens within 30 days of expiry.",
  },
  risk: {
    title: "Risk Engine",
    icon: Cpu,
    accentColor: "#F59E0B",
    purpose:
      "Applies a multi-factor ML risk scoring model to the payment payload before routing is determined, flagging anomalies, velocity breaches, and counterparty risk.",
    whyItMatters:
      "Risk scoring is the primary fraud prevention checkpoint. A miscalibrated or bypassed risk score allows high-risk transactions to enter the settlement network unchecked.",
    currentState: (node) =>
      `Risk score: ${node?.value || "Score: 12"} — within the nominal threshold (0–30). Model: ${node?.sublabel || "ML Model v4.2"}. Status: NOMINAL.`,
    decisionLogic:
      "Score 0–30: Nominal (auto-approved). Score 31–60: Review queue. Score 61+: Hold for manual investigation. Current transaction is in the auto-approval band.",
    risk: "LOW",
    compliancePassed: true,
    operationalImpact:
      "Risk Engine processed the payload in 12ms. No anomaly flags raised. Transaction has been cleared and forwarded to the Payment Rail Decision node.",
    recommendation:
      "Current risk posture is acceptable. Monitor for velocity pattern changes in the next 4-hour window. No manual review required.",
  },
  rail: {
    title: "Payment Rail Decision",
    icon: ArrowRightLeft,
    accentColor: "#22D3EE",
    purpose:
      "Determines the most efficient, compliant, and cost-effective payment network for settlement based on transaction amount, priority, risk score, and institution eligibility.",
    whyItMatters:
      "Rail selection directly impacts settlement speed, transaction cost, and regulatory exposure. An incorrect routing decision can delay settlement by up to T+2 or incur unnecessary WIRE fees.",
    currentState: (node) =>
      `Selected Rail: ${node?.value || "ACH"}. Classification: ${node?.sublabel || "Optimal Route"}. Routing engine confidence: 94%+.`,
    decisionLogic:
      "ACH is selected when: amount < $25,000, risk score < 30, no urgent priority flag. RTP is selected for urgent/real-time requirements. WIRE for high-value institutional transfers.",
    risk: "LOW",
    compliancePassed: true,
    operationalImpact:
      "Routing decision completed. Settlement window assigned. Cost optimization achieved — ACH processing fee applied at standard NACHA rate.",
    recommendation:
      "Continue with selected rail. No override warranted. Review routing thresholds quarterly to reflect updated NACHA fee schedules.",
  },
  settlement: {
    title: "Settlement",
    icon: Banknote,
    accentColor: "#10B981",
    purpose:
      "Executes the final transfer of funds between originating and receiving institutions through the selected payment rail, achieving legal finality of the payment obligation.",
    whyItMatters:
      "Settlement is the point at which the payment obligation becomes legally final. Until settlement completes, both counterparties carry exposure. Delays in settlement extend this exposure window.",
    currentState: (node) =>
      `Settlement Status: ${node?.value || "Complete"}. Finality window: ${node?.sublabel || "T+1 Business Day"}. No reconciliation exceptions detected.`,
    decisionLogic:
      "Settlement is initiated upon successful rail assignment. ACH batches are submitted to NACHA at scheduled batch windows. RTP achieves instant finality. WIRE settles via Fedwire in real time during business hours.",
    risk: "LOW",
    compliancePassed: true,
    operationalImpact:
      "Settlement confirmed. Funds have been transferred to the receiving institution. Ledger has been updated. No reconciliation discrepancies detected.",
    recommendation:
      "Settlement cycle complete. Archive transaction record. Initiate next-cycle batch preparation if additional payments are queued.",
  },
};

function NodeSidebar({ data }: { data: any }) {
  const nodeId: NodeId = (data?.id || "bank") as NodeId;
  const briefing = NODE_BRIEFINGS[nodeId] || NODE_BRIEFINGS.bank;
  const BriefingIcon = briefing.icon;

  return (
    <div className="space-y-3">
      <IntelligenceModule
        title={briefing.title}
        label="Pipeline Stage Intelligence"
        icon={BriefingIcon}
        accentColor={briefing.accentColor}
        accentBg={`${briefing.accentColor}12`}
      >
        <div className="space-y-2">
          <NarrativeBlock label="Current State" accentLeft={briefing.accentColor}>
            {briefing.currentState(data)}
          </NarrativeBlock>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-white/[0.03] border border-white/[0.07] p-2.5 rounded-lg">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Risk</span>
              <RiskBadge level={briefing.risk} />
            </div>
            <div className="flex flex-col bg-white/[0.03] border border-white/[0.07] p-2.5 rounded-lg">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Compliance</span>
              <ComplianceBadge passed={briefing.compliancePassed} />
            </div>
          </div>
        </div>
      </IntelligenceModule>

      <IntelligenceModule
        title="Stage Analysis"
        label="Decision Intelligence"
        icon={Brain}
        accentColor="#64748b"
        accentBg="rgba(100,116,139,0.05)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="Purpose" accentLeft={briefing.accentColor}>
            {briefing.purpose}
          </NarrativeBlock>
          <NarrativeBlock label="Why This Matters" accentLeft="#A78BFA">
            {briefing.whyItMatters}
          </NarrativeBlock>

          {/* WHO CONTROLS THIS RAIL — rendered only for the rail decision node */}
          {nodeId === "rail" && (() => {
            const railValue: string = data?.value || "ACH";
            const RAIL_GOVERNANCE: Record<string, {
              network: string;
              authority: string;
              role: string;
              impact: string;
              accentColor: string;
            }> = {
              ACH: {
                network: "ACH Network",
                authority: "NACHA (National Automated Clearing House Association)",
                role: "Defines ACH operating rules, settlement standards, compliance requirements, and network governance for all ACH transactions processed in the United States.",
                impact: "Changes to NACHA rules directly influence routing decisions, settlement timing, return codes, and compliance validation thresholds across the entire ACH corridor.",
                accentColor: "#22D3EE",
              },
              RTP: {
                network: "RTP Network",
                authority: "The Clearing House",
                role: "Operates the RTP® network, the first new core payments infrastructure in the US in decades, enabling instant, 24/7/365 payment settlement.",
                impact: "The Clearing House sets participation rules, messaging standards (ISO 20022), and liquidity requirements. All real-time payment decisions must conform to TCH RTP Rulebook.",
                accentColor: "#34D399",
              },
              WIRE: {
                network: "Fedwire Funds Service",
                authority: "Federal Reserve / Correspondent Banking Network",
                role: "The Federal Reserve operates Fedwire, the primary high-value gross settlement system for same-day wire transfers. Correspondent banks facilitate international WIRE routing.",
                impact: "Fedwire operating hours (6AM–7PM ET, business days) constrain WIRE availability. Regulation J governs Fedwire participation. Large-value transfers are subject to enhanced OFAC screening.",
                accentColor: "#A78BFA",
              },
              FedNow: {
                network: "FedNow® Service",
                authority: "Federal Reserve Bank of the United States",
                role: "The Federal Reserve's instant payment service launched in 2023. FedNow enables financial institutions to offer real-time payment and settlement services around the clock, every day.",
                impact: "Governed directly by the Federal Reserve. Participation requires FedNow enrollment and ISO 20022 compliance. Settlement is final and irrevocable upon confirmation.",
                accentColor: "#34D399",
              },
            };
            const gov = RAIL_GOVERNANCE[railValue] || RAIL_GOVERNANCE.ACH;
            return (
              <div
                className="flex flex-col bg-white/[0.03] border border-white/[0.07] p-3.5 rounded-lg mt-1"
                style={{ borderLeft: `2px solid ${gov.accentColor}` }}
              >
                <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">
                  Who Controls This Rail
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4 py-1.5 border-b border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 flex-shrink-0">Network</span>
                    <span className="text-xs font-semibold text-right" style={{ color: gov.accentColor }}>{gov.network}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 py-1.5 border-b border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 flex-shrink-0">Governing Authority</span>
                    <span className="text-xs font-semibold text-right text-slate-200">{gov.authority}</span>
                  </div>
                  <div className="py-1.5 border-b border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Role</span>
                    <span className="text-[11px] text-slate-300 leading-relaxed">{gov.role}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Operational Impact</span>
                    <span className="text-[11px] text-slate-300 leading-relaxed">{gov.impact}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <NarrativeBlock label="Decision Logic" accentLeft="#22D3EE">
            {briefing.decisionLogic}
          </NarrativeBlock>
          <NarrativeBlock label="Operational Impact" accentLeft="#34D399">
            {briefing.operationalImpact}
          </NarrativeBlock>
          <NarrativeBlock label="Recommendation" accentLeft="#F59E0B">
            {briefing.recommendation}
          </NarrativeBlock>
        </div>
      </IntelligenceModule>

      <Timestamp />
    </div>
  );
}

// =============================================================================
// TRANSACTION INTELLIGENCE
// =============================================================================

function TransactionSidebar({ data, id }: { data: any; id: string }) {
  const riskLevel: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" =
    data?.risk_score >= 61
      ? "HIGH"
      : data?.risk_score >= 31
      ? "ELEVATED"
      : data?.risk_score >= 15
      ? "MODERATE"
      : "LOW";

  const railColor =
    data?.rail === "WIRE" ? "#A78BFA" : data?.rail === "RTP" ? "#34D399" : "#22D3EE";

  return (
    <div className="space-y-3">
      <IntelligenceModule
        title="Transaction Intelligence"
        label={`Ledger Event · ${id}`}
        icon={ArrowRightLeft}
        accentColor="#06B6D4"
        accentBg="rgba(6,182,212,0.06)"
      >
        <div className="space-y-2">
          {data?.amount && (
            <BriefingRow
              label="Amount"
              value={`$${Number(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              accent="#e2e8f0"
            />
          )}
          {data?.bank && <BriefingRow label="Institution" value={data.bank} accent="#22D3EE" />}
          {data?.rail && (
            <BriefingRow label="Settlement Rail" value={data.rail} accent={railColor} />
          )}
          {data?.priority && (
            <BriefingRow
              label="Priority"
              value={data.priority}
              accent={
                data.priority === "URGENT"
                  ? "#EF4444"
                  : data.priority === "BATCH"
                  ? "#F59E0B"
                  : "#94a3b8"
              }
            />
          )}
          {data?.risk_score !== undefined && (
            <BriefingRow
              label="Risk Score"
              value={`${data.risk_score} / 100`}
              accent={riskLevel === "LOW" ? "#34D399" : riskLevel === "MODERATE" ? "#F59E0B" : "#EF4444"}
            />
          )}
          <BriefingRow label="Risk Assessment" value={<RiskBadge level={riskLevel} />} />
          <BriefingRow label="Compliance" value={<ComplianceBadge passed={riskLevel !== "HIGH"} />} />
        </div>
      </IntelligenceModule>

      <IntelligenceModule
        title="Settlement Briefing"
        label="Operational Analysis"
        icon={Brain}
        accentColor="#64748b"
        accentBg="rgba(100,116,139,0.05)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="Ledger Event Summary" accentLeft="#06B6D4">
            {data?.name
              ? `Payment originated by ${data.name} via ${data.bank || "unknown institution"}. Routed through ${data.rail || "ACH"} with ${data.priority || "STANDARD"} priority classification.`
              : `Transaction ${id} has been recorded on the ledger. Awaiting full metadata enrichment.`}
          </NarrativeBlock>
          <NarrativeBlock label="Settlement Finality" accentLeft="#34D399">
            {data?.rail === "RTP"
              ? "Instant settlement via RTP. Legal finality achieved in real time. No pending exposure window."
              : data?.rail === "WIRE"
              ? "Same-day settlement via Fedwire. Finality confirmed within business hours."
              : "Standard T+1 ACH settlement. Funds are in transit and will reach the receiving institution in the next ACH batch window."}
          </NarrativeBlock>
          <NarrativeBlock label="Risk Disposition" accentLeft={riskLevel === "LOW" ? "#34D399" : "#F59E0B"}>
            {riskLevel === "LOW"
              ? "Transaction cleared all risk checks. No anomaly signals detected. Auto-approved by Risk Engine ML Model v4.2."
              : riskLevel === "MODERATE"
              ? "Transaction flagged for review due to moderate risk score. Secondary verification has been applied. Monitor for pattern repetition."
              : "Elevated risk detected. Transaction is under manual review. Routing has been restricted to low-exposure corridors."}
          </NarrativeBlock>
        </div>
      </IntelligenceModule>

      <Timestamp />
    </div>
  );
}

// =============================================================================
// KPI INTELLIGENCE
// =============================================================================

function KpiSidebar({ id }: { id: string }) {
  return (
    <div className="space-y-3">
      <IntelligenceModule
        title="Executive KPI Briefing"
        label={id}
        icon={BarChart3}
        accentColor="#F59E0B"
        accentBg="rgba(245,158,11,0.06)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="Current State" accentLeft="#F59E0B">
            The {id} metric is being actively monitored across all connected institutions and settlement corridors. Current status reflects real-time aggregation of the transaction dataset.
          </NarrativeBlock>
          <NarrativeBlock label="Why This Matters" accentLeft="#A78BFA">
            Executive KPIs provide the single source of truth for operational health. Deviations in key indicators are the primary early-warning signals for systemic risk.
          </NarrativeBlock>
          <NarrativeBlock label="Operational Impact" accentLeft="#22D3EE">
            All KPI thresholds are within acceptable operational bounds. No escalation signals have been triggered in the current monitoring window.
          </NarrativeBlock>
          <NarrativeBlock label="Recommendation" accentLeft="#34D399">
            Continue standard monitoring cadence. Review KPI trends at the end of each settlement cycle to identify emerging patterns.
          </NarrativeBlock>
        </div>
      </IntelligenceModule>
      <Timestamp />
    </div>
  );
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

function DefaultSidebar() {
  return (
    <div className="space-y-3">
      <IntelligenceModule
        title="Intelligence Briefing Panel"
        label="Infocreon Intelligence Rail"
        icon={Brain}
        accentColor="#06B6D4"
        accentBg="rgba(6,182,212,0.06)"
      >
        <div className="space-y-2.5">
          <NarrativeBlock label="How to Use This Panel" accentLeft="#06B6D4">
            Select any entity from the dashboard to receive a contextual intelligence briefing. Click on institution rows, AI insight cards, pipeline nodes, or transaction entries.
          </NarrativeBlock>
          <div className="space-y-1.5 mt-1">
            {[
              { label: "Institution rows", desc: "Consent, risk, and routing analysis" },
              { label: "AI Insight cards", desc: "Volume, risk, and settlement intelligence" },
              { label: "Pipeline nodes", desc: "Stage-by-stage decision briefing" },
              { label: "Transaction rows", desc: "Per-ledger event analysis" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-white font-medium">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </IntelligenceModule>
      <Timestamp />
    </div>
  );
}

// =============================================================================
// ROUTER
// =============================================================================

export default function SidebarContent({ context }: SidebarContentProps) {
  if (!context || context.type === "DEFAULT") {
    return <DefaultSidebar />;
  }

  if (context.type === "INSTITUTION") {
    return <InstitutionSidebar data={context.data} />;
  }

  if (context.type === "INSIGHT") {
    return <InsightSidebar data={context.data} />;
  }

  if (context.type === "NODE") {
    return <NodeSidebar data={context.data} />;
  }

  if (context.type === "TRANSACTION") {
    return <TransactionSidebar data={context.data} id={context.id} />;
  }

  if (context.type === "KPI") {
    return <KpiSidebar id={context.id} />;
  }

  return null;
}
