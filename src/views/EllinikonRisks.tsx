import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";

// ---------- Self-contained risk register (Ellinikon Villa, build-to-sell) ----------
// A rated register for the single-asset luxury villa development. Severities and
// likelihoods use the shared high/medium/low scale; status is open / mitigating /
// resolved so items can be prioritised against the Build-Sell model.

interface RiskItem {
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  probability: "high" | "medium" | "low";
  status: "open" | "mitigating" | "resolved";
  mitigation: string;
}

export const RISKS: RiskItem[] = [
  {
    title: "Sale-price compression",
    category: "Market / Sales",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "GDV assumes €30,000/m² (top of the Athens Riviera range). Underwrite a base case at €24–26k/m² and pre-market off-plan to lock demand before completion.",
  },
  {
    title: "Single-asset, thin buyer pool",
    category: "Market / Liquidity",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "One ultra-prime villa depends on one or two qualified buyers. Appoint international branded brokerage and keep the 1-yr operate-then-sell fallback (Scenario 2) live.",
  },
  {
    title: "Construction cost escalation",
    category: "Cost",
    severity: "medium",
    probability: "medium",
    status: "mitigating",
    mitigation:
      "Effective build ≈ €6,500/m² is at the top of the prime benchmark. Lock a fixed-price / GMP contract and carry contingency; the Construction CAPEX page stress-tests escalation.",
  },
  {
    title: "Programme slippage",
    category: "Schedule",
    severity: "medium",
    probability: "medium",
    status: "open",
    mitigation:
      "A Sep 2027 start leaves little float; delay pushes the sale into a different market window and adds interest. Hold a milestone schedule with liquidated damages.",
  },
  {
    title: "Permitting & design controls",
    category: "Permit",
    severity: "medium",
    probability: "low",
    status: "mitigating",
    mitigation:
      "Building permit plus Ellinikon master-plan design review and coastal setback rules apply. Engage in pre-application and retain planning counsel before mobilising.",
  },
  {
    title: "Debt cost beyond grace",
    category: "Finance",
    severity: "medium",
    probability: "medium",
    status: "open",
    mitigation:
      "The €13M facility has a 3-yr interest-free grace; if the sale slips past it, interest turns cash-paying. Target a sale within grace and stress Euribor + spread.",
  },
  {
    title: "Tax on development gain",
    category: "Finance",
    severity: "low",
    probability: "high",
    status: "mitigating",
    mitigation:
      "22% corporate tax on the gain is modelled; changes to property tax or new-build VAT could move net proceeds. Take tax-structuring advice and monitor legislation.",
  },
  {
    title: "Foreign-buyer / Golden-Visa dependency",
    category: "Macro",
    severity: "medium",
    probability: "low",
    status: "open",
    mitigation:
      "Prime demand skews to non-EU buyers sensitive to Golden-Visa thresholds and geopolitics. Diversify into EU and domestic UHNW channels.",
  },
  {
    title: "Title & land",
    category: "Legal / Title",
    severity: "low",
    probability: "low",
    status: "resolved",
    mitigation:
      "Land (€13.0M) is committed; clean title and absence of encumbrances on the Ellinikon parcel confirmed in legal DD before construction.",
  },
];

export function EllinikonRisks() {
  const high = RISKS.filter((r) => r.severity === "high").length;
  const open = RISKS.filter((r) => r.status === "open").length;
  const mitigating = RISKS.filter((r) => r.status === "mitigating").length;

  const tiles = [
    { value: String(RISKS.length), label: "Tracked risks" },
    { value: String(high), label: "High severity" },
    { value: String(open), label: "Open" },
    { value: String(mitigating), label: "Mitigating" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-sky-600" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">Risks</h2>
        </div>
        <p className="text-stone-500 mt-1 ml-10">
          Ellinikon Villa &middot; rated risk register for the build-to-sell programme
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-2xl font-bold text-stone-800 tabular-nums">{t.value}</p>
            <p className="text-sm font-medium text-stone-600 mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Register */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {RISKS.map((r, i) => (
          <div key={r.title} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl font-bold text-sky-600/30 tabular-nums leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-stone-800 leading-snug">{r.title}</h3>
                  <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                    {r.category}
                  </span>
                </div>
              </div>
              <StatusBadge value={r.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] text-stone-400 font-medium">Severity</span>
              <StatusBadge value={r.severity} />
              <span className="text-[11px] text-stone-400 font-medium ml-2">Likelihood</span>
              <StatusBadge value={r.probability} />
            </div>

            <p className="text-[13px] text-stone-500 leading-relaxed mt-3">
              <span className="font-semibold text-stone-600">Mitigation: </span>
              {r.mitigation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
