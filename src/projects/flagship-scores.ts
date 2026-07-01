// Flagship scorecards — the risk-adjusted grade for the two bespoke projects,
// computed on the same 0–100 scale as the opportunity cases so the hub cards and
// the in-project scorecards read consistently. Each flagship derives its numbers
// from its own base-case model, then the shared composeGrade() blends the three
// axes (IRR 50% / development risk 30% / operational 20%).
//
// Two flagship-specific caveats are spelled out in the axis details, because each
// project headlines a return convention the cases' IRR axis isn't calibrated for
// (the axis maps a levered *development* equity IRR: 6% → 0, 30% → 100):
//  · Olive Press headlines a stabilised, post-subsidy *net* yield (~6.5%), which
//    sits on the floor of that band and so caps the composite whatever the risk
//    axes say. Its live risk register is Supabase-backed and unavailable at build
//    time, so the development-risk axis is a hand-set assessment, not a computed
//    register score.
//  · Ellinikon headlines an *annualised* short-hold sale IRR (~57%), which pins
//    the same axis to 100 and effectively carries the grade; its development-risk
//    axis is scored from the real, rated Ellinikon register.

import {
  runScenario,
  SCENARIOS,
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  STATE_SUBSIDY_DEFAULT,
} from "../lib/financial-model";
import {
  runBuildSellScenario,
  BUILD_SELL_DEFAULTS,
  BUILD_SELL_SCENARIOS,
} from "../lib/build-sell-model";
import {
  fmtMoney,
  fmtPct,
  scoreIrr,
  scoreRisk,
  composeGrade,
  type RiskLike,
  type Scorecard,
} from "./cases/model";
import { RISKS as ELLINIKON_RISKS } from "../views/EllinikonRisks";
import type { ProjectEconomics, ProjectScore } from "./types";

// Derive a hub-card ProjectScore (rounded composite + grade + verdict) from a
// full Scorecard, so the two representations never drift apart.
function toProjectScore(sc: Scorecard): ProjectScore {
  return { composite: Math.round(sc.composite), grade: sc.grade, verdict: sc.verdict };
}

// ── Olive Press Hotel ────────────────────────────────────────────────────────
// The base scenario of the hotel model. Total cost is the all-in investment; the
// headline IRR is the net (post-subsidy) IRR the model leads with.
const olivePressBase = runScenario(
  SCENARIOS[1],
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  STATE_SUBSIDY_DEFAULT,
);

export const olivePressEconomics: ProjectEconomics = {
  totalCost: fmtMoney(INVESTMENT),
  irr: fmtPct(olivePressBase.netIrr),
};

export const olivePressScorecard: Scorecard = (() => {
  const irrScore = scoreIrr(olivePressBase.netIrr);
  const devRisk = 55; // active build, historic conversion; permits + €3M subsidy secured
  const opRisk = 45; // 48-key operating hotel — seasonal, staff- and F&B-intensive
  const { composite, grade, verdict } = composeGrade(irrScore, devRisk, opRisk);
  return {
    irr: {
      label: "IRR",
      score: irrScore,
      detail: `Net IRR ≈ ${fmtPct(
        olivePressBase.netIrr,
      )} is a stabilised, post-subsidy yield — below the levered development-return band this axis measures (6% → 0, 30% → 100), so it sits near the floor.`,
    },
    risk: {
      label: "Development risk",
      score: devRisk,
      detail:
        "Active build of a historic olive-press conversion; building permit and €3M state subsidy secured. Assessed mid-range — the live register is Supabase-backed, so this axis is a hand-set read rather than a computed register score.",
    },
    operational: {
      label: "Operational risk",
      score: opRisk,
      detail:
        "A 48-key operating hotel — seasonal occupancy, staff- and F&B-intensive to run once open.",
    },
    composite,
    grade,
    verdict,
  };
})();

export const olivePressScore: ProjectScore = toProjectScore(olivePressScorecard);

// ── Ellinikon Villa ──────────────────────────────────────────────────────────
// The "Sell at Completion" base case of the build-sell model.
const ellinikonBase = runBuildSellScenario(BUILD_SELL_DEFAULTS, BUILD_SELL_SCENARIOS[0]);
const ellinikonRegister: RiskLike[] = ELLINIKON_RISKS;

export const ellinikonEconomics: ProjectEconomics = {
  totalCost: fmtMoney(ellinikonBase.totalProjectCost),
  irr: fmtPct(ellinikonBase.annualisedIrr),
};

export const ellinikonScorecard: Scorecard = (() => {
  const irrScore = scoreIrr(ellinikonBase.annualisedIrr);
  const riskScore = scoreRisk(ellinikonRegister);
  const opRisk = 82; // build-to-sell: no operating business retained after the sale
  const { composite, grade, verdict } = composeGrade(irrScore, riskScore, opRisk);
  const highs = ellinikonRegister.filter((r) => r.severity === "high").length;
  const open = ellinikonRegister.filter((r) => r.status === "open").length;
  return {
    irr: {
      label: "IRR",
      score: irrScore,
      detail: `Annualised sell-at-completion IRR ≈ ${fmtPct(
        ellinikonBase.annualisedIrr,
      )} — a short-hold merchant return that pins this axis to the top of its range.`,
    },
    risk: {
      label: "Development risk",
      score: riskScore,
      detail: `${ellinikonRegister.length} rated risks — ${highs} high-severity, ${open} still open — scored as likelihood × impact. Its two heaviest are market and liquidity risks (sale-price, buyer depth), which weigh less on this build-delivery axis than a permitting or construction risk would, since the IRR axis already prices the exit.`,
    },
    operational: {
      label: "Operational risk",
      score: opRisk,
      detail:
        "Build-to-sell: the villa is sold at completion, leaving no operating business to run.",
    },
    composite,
    grade,
    verdict,
  };
})();

export const ellinikonScore: ProjectScore = toProjectScore(ellinikonScorecard);
