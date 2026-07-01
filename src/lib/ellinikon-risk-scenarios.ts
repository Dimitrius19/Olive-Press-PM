// Risk → financial-model bridge for the Ellinikon Villa (build-to-sell).
// Each major item in the EllinikonRisks register is expressed here as a *default scenario*:
// a named, pre-defined perturbation of the Build-Sell inputs that is run through the same
// runBuildSellScenario() engine as the headline model. The point is to show, in euros and
// IRR, how each risk actually translates into the financial outcome — rather than leaving the
// register as qualitative prose. The base case is Scenario 1 (sell at completion) of whatever
// live assumptions are in force (so edits on the Construction CAPEX page flow through here too).
//
// Each transform is guarded (Math.min for downside prices, Math.max for downside costs/rates)
// so a scenario is always a *stress relative to the live base* — if the user has already dialled
// an assumption past the stress level, the scenario simply holds at the worse of the two.

import {
  BUILD_SELL_SCENARIOS,
  runBuildSellScenario,
  type BuildSellInputs,
  type BuildSellResult,
} from "./build-sell-model";

// Which exit path the stressed case is run under.
//  - "completion": Scenario 1, sell at end of build (2-yr hold)
//  - "ops":        Scenario 2, operate one year then sell (3-yr hold) — the natural home for
//                  timing/liquidity risks, where the exit slips past completion.
type ExitPath = "completion" | "ops";

export interface RiskScenarioDef {
  id: string;
  /** Title of the matching item in the EllinikonRisks register. */
  risk: string;
  /** Short label for charts/axes. */
  label: string;
  category: string;
  severity: "high" | "medium" | "low";
  /** Human description of the lever(s) pulled, shown under the row. */
  driver: string;
  exit: ExitPath;
  /** Pure transform applied to the live base inputs. */
  apply: (i: BuildSellInputs) => BuildSellInputs;
}

export const ELLINIKON_RISK_SCENARIOS: RiskScenarioDef[] = [
  {
    id: "price",
    risk: "Sale-price compression",
    label: "Price −€5k/m²",
    category: "Market / Sales",
    severity: "high",
    driver:
      "Headline €30k/m² re-based to the underwriting case — main €25,000/m², secondary €12,500/m² (mid Athens-Riviera range).",
    exit: "completion",
    apply: (i) => ({
      ...i,
      mainPricePerSqm: Math.min(i.mainPricePerSqm, 25_000),
      secondaryPricePerSqm: Math.min(i.secondaryPricePerSqm, 12_500),
    }),
  },
  {
    id: "absorption",
    risk: "Single-asset, thin buyer pool",
    label: "Slow sale −5%",
    category: "Market / Liquidity",
    severity: "high",
    driver:
      "No qualified buyer at completion: operate the villa for a year, then clear it at a 5% discount (extra carry + a price chip).",
    exit: "ops",
    apply: (i) => ({
      ...i,
      mainPricePerSqm: i.mainPricePerSqm * 0.95,
      secondaryPricePerSqm: i.secondaryPricePerSqm * 0.95,
    }),
  },
  {
    id: "cost",
    risk: "Construction cost escalation",
    label: "Cost +escalation",
    category: "Cost",
    severity: "medium",
    driver:
      "Build inflation runs hot: escalation 9%/yr to the spend midpoint and contingency lifted to 12.5% on the CAPEX base.",
    exit: "completion",
    apply: (i) => ({
      ...i,
      costEscalationPct: Math.max(i.costEscalationPct, 0.09),
      contingencyPct: Math.max(i.contingencyPct, 0.125),
    }),
  },
  {
    id: "slippage",
    risk: "Programme slippage",
    label: "6–9 mo overrun",
    category: "Schedule",
    severity: "medium",
    driver:
      "Build runs 6–9 months long: escalation window stretches to 3.0 yr and the sale lands in a softer market window (−3% on price).",
    exit: "completion",
    apply: (i) => ({
      ...i,
      escalationYears: Math.max(i.escalationYears, 3.0),
      mainPricePerSqm: i.mainPricePerSqm * 0.97,
      secondaryPricePerSqm: i.secondaryPricePerSqm * 0.97,
    }),
  },
  {
    id: "debt",
    risk: "Debt cost beyond grace",
    label: "Rate shock + grace",
    category: "Finance",
    severity: "medium",
    driver:
      "Sale slips past the 3-yr interest-free grace and rates rise: all-in debt cost ≈ 6% (Euribor 3.5% + spread 2.5%), interest turns cash-paying.",
    exit: "ops",
    apply: (i) => ({
      ...i,
      euribor: Math.max(i.euribor, 0.035),
      spread: Math.max(i.spread, 0.025),
    }),
  },
  {
    id: "tax",
    risk: "Tax on development gain",
    label: "Tax 22%→29%",
    category: "Finance",
    severity: "low",
    driver:
      "Development-gain structuring relief is lost / the corporate rate rises — tax on the sale gain steps from 22% to 29%.",
    exit: "completion",
    apply: (i) => ({
      ...i,
      saleTaxRate: Math.max(i.saleTaxRate, 0.29),
    }),
  },
  {
    id: "combined",
    risk: "Combined downside (stress test)",
    label: "Combined downside",
    category: "Stress test",
    severity: "high",
    driver:
      "Several risks land together: price −10%, escalation 8%/yr with 12.5% contingency, +150 bps on the rate, and a one-year operate-to-exit.",
    exit: "ops",
    apply: (i) => ({
      ...i,
      mainPricePerSqm: i.mainPricePerSqm * 0.9,
      secondaryPricePerSqm: i.secondaryPricePerSqm * 0.9,
      costEscalationPct: Math.max(i.costEscalationPct, 0.08),
      contingencyPct: Math.max(i.contingencyPct, 0.125),
      euribor: i.euribor + 0.0075,
      spread: i.spread + 0.0075,
    }),
  },
];

export interface RiskScenarioOutcome {
  def: RiskScenarioDef;
  result: BuildSellResult;
  /** Deltas vs the base case (sell-at-completion on the live assumptions). */
  dIrr: number; // annualised IRR, decimal (e.g. -0.06 = −6pp)
  dProfit: number; // total profit to equity, €
  dNetCash: number; // net cash to equity at exit, €
  dMultiple: number; // equity multiple, x
}

const COMPLETION = BUILD_SELL_SCENARIOS[0]; // "Sell at Completion"
const OPS = BUILD_SELL_SCENARIOS[1]; // "1 Yr Ops + Sale"

/**
 * Run every risk scenario against the supplied live base inputs and return the base result
 * (Scenario 1) plus each stressed outcome with its deltas. Pure: no React, fully testable.
 */
export function runEllinikonRiskScenarios(inputs: BuildSellInputs): {
  base: BuildSellResult;
  outcomes: RiskScenarioOutcome[];
} {
  const base = runBuildSellScenario(inputs, COMPLETION);
  const outcomes = ELLINIKON_RISK_SCENARIOS.map((def) => {
    const scenario = def.exit === "ops" ? OPS : COMPLETION;
    const result = runBuildSellScenario(def.apply(inputs), scenario);
    return {
      def,
      result,
      dIrr: result.annualisedIrr - base.annualisedIrr,
      dProfit: result.totalProfitToEquity - base.totalProfitToEquity,
      dNetCash: result.netCashToEquityAtExit - base.netCashToEquityAtExit,
      dMultiple: result.equityMultiple - base.equityMultiple,
    };
  });
  return { base, outcomes };
}
