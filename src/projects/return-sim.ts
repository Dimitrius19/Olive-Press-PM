// ── Return simulation bridge ─────────────────────────────────────────────────
// Turns each project's deterministic model into a *distribution* of returns by
// driving the Monte-Carlo core (../lib/simulate) with per-project 3-point driver
// bands and a Gaussian copula, then measuring the result against a strategy-
// specific hurdle (../lib/hurdle). This is the production home of the logic the
// throwaway demo harness prototyped.
//
// Three project shapes, three driver sets:
//   · development case — exit €/m², build cost, debt cost (correlated: inflation
//     lifts value and cost together; rates lift cost and compress value).
//   · income case      — NOI level, exit cap rate (inverted), debt cost.
//   · Olive Press      — the real Pessimistic/Base/Optimistic hotel scenario
//     bands (ADR, occupancy, ADR growth, GOP margin, terminal cap).
//   · Ellinikon        — villa €/m², cost escalation, Euribor.
//
// Every result is memoised: the case bands key off the stable ModelAssumptions
// object identity, and the two flagships compute once at module load — so a
// scorecard re-render never re-runs 8,000 trials.

import { simulate, type Driver, type SimStats } from "../lib/simulate";
import { computeHurdle, type Strategy } from "../lib/hurdle";
import { computeModel, type ModelAssumptions } from "./cases/model";
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

// Trials and seed. 8k correlated draws is ample for stable P10/P50/P90 and a
// clean P(≥hurdle); the fixed seed keeps every grade reproducible.
export const SIM_TRIALS = 8_000;
export const SIM_SEED = 1;

// Which required-return bar each model mode answers to.
export const CASE_STRATEGY: Record<ModelAssumptions["mode"], Strategy> = {
  development: "development",
  income: "income",
};

// Correlation blocks, one per project shape. Kept modest and positive-definite.
const DEV_CORR = [
  [1, 0.3, -0.3], // price · cost · rate
  [0.3, 1, 0.4],
  [-0.3, 0.4, 1],
];
const INC_CORR = [
  [1, -0.3, -0.2], // noi · cap · rate
  [-0.3, 1, 0.4],
  [-0.2, 0.4, 1],
];

// Run simulate(), degrading gracefully to independent sampling if a correlation
// matrix is ever non-PSD (it never is for the matrices above, but a future edit
// shouldn't be able to throw a grade).
function run(
  drivers: Driver[],
  correlation: number[][] | undefined,
  fn: (s: Record<string, number>) => number,
  strategy: Strategy,
): SimStats {
  const hurdle = computeHurdle({ strategy });
  try {
    return simulate({ drivers, correlation, run: fn, hurdle, n: SIM_TRIALS, seed: SIM_SEED }).stats;
  } catch {
    return simulate({ drivers, run: fn, hurdle, n: SIM_TRIALS, seed: SIM_SEED }).stats;
  }
}

// ── Opportunity cases ─────────────────────────────────────────────────────────

function simulateDevelopmentCase(m: ModelAssumptions): SimStats {
  const price0 = m.sale!.pricePerSqm;
  const cost0 = m.construction!.hardCost;
  const rate0 = m.finance.interestRate;
  const drivers: Driver[] = [
    { key: "price", min: price0 * 0.85, mode: price0, max: price0 * 1.12 },
    { key: "cost", min: cost0 * 0.92, mode: cost0, max: cost0 * 1.15 },
    { key: "rate", min: Math.max(0, rate0 - 0.015), mode: rate0, max: rate0 + 0.02 },
  ];
  return run(
    drivers,
    DEV_CORR,
    (s) =>
      computeModel({
        ...m,
        construction: { ...m.construction!, hardCost: s.cost },
        sale: { ...m.sale!, pricePerSqm: s.price },
        finance: { ...m.finance, interestRate: s.rate },
      }).equityIrr,
    "development",
  );
}

function simulateIncomeCase(m: ModelAssumptions): SimStats {
  const inc = m.income!;
  const rate0 = m.finance.interestRate;
  const drivers: Driver[] = [
    { key: "noiMult", min: 0.9, mode: 1, max: 1.08 },
    { key: "cap", min: 0.06, mode: inc.exitCapRate, max: 0.09 },
    { key: "rate", min: Math.max(0, rate0 - 0.015), mode: rate0, max: rate0 + 0.02 },
  ];
  return run(
    drivers,
    INC_CORR,
    (s) =>
      computeModel({
        ...m,
        income: {
          ...inc,
          noi: inc.noi.map((v) => v * s.noiMult),
          exitNoi: inc.exitNoi * s.noiMult,
          exitCapRate: s.cap,
        },
        finance: { ...m.finance, interestRate: s.rate },
      }).equityIrr,
    "income",
  );
}

const caseCache = new WeakMap<ModelAssumptions, SimStats>();

// Distribution of equity IRR for an opportunity case, dispatched by mode and
// memoised on the (stable) assumptions object.
export function simulateCaseReturn(m: ModelAssumptions): SimStats {
  const hit = caseCache.get(m);
  if (hit) return hit;
  const stats = m.mode === "income" ? simulateIncomeCase(m) : simulateDevelopmentCase(m);
  caseCache.set(m, stats);
  return stats;
}

// ── Olive Press Hotel — stabilised net IRR from the real P/B/O bands ──────────

function computeHotelReturn(): SimStats {
  const [pess, base, opt] = SCENARIOS;
  const drivers: Driver[] = [
    { key: "adr", min: pess.adrYear1, mode: base.adrYear1, max: opt.adrYear1 },
    { key: "occ", min: pess.occupancyMature, mode: base.occupancyMature, max: opt.occupancyMature },
    { key: "adrG", min: pess.adrGrowth, mode: base.adrGrowth, max: opt.adrGrowth },
    { key: "gop", min: pess.gopMargin, mode: base.gopMargin, max: opt.gopMargin },
    // Terminal cap inverts (pessimistic = high cap); order as min < mode < max.
    { key: "cap", min: opt.terminalCapRate, mode: base.terminalCapRate, max: pess.terminalCapRate },
  ];
  const d = 0.35; // demand-block correlation
  const c = -0.25; // cap rate vs demand
  const corr = [
    [1, d, d, d, c],
    [d, 1, d, d, c],
    [d, d, 1, d, c],
    [d, d, d, 1, c],
    [c, c, c, c, 1],
  ];
  return run(
    drivers,
    corr,
    (s) =>
      runScenario(
        {
          ...base,
          adrYear1: s.adr,
          occupancyMature: s.occ,
          occupancyYear1: s.occ * 0.85,
          adrGrowth: s.adrG,
          gopMargin: s.gop,
          terminalCapRate: s.cap,
        },
        INVESTMENT,
        ROOMS,
        OPERATING_DAYS_FULL,
        MODEL_YEARS,
        STATE_SUBSIDY_DEFAULT,
      ).netIrr,
    "income",
  );
}

let hotelCache: SimStats | null = null;
export function simulateHotelReturn(): SimStats {
  return (hotelCache ??= computeHotelReturn());
}

// ── Ellinikon Villa — annualised short-hold merchant IRR ──────────────────────

function computeVillaReturn(): SimStats {
  const p0 = BUILD_SELL_DEFAULTS.mainPricePerSqm;
  const drivers: Driver[] = [
    { key: "price", min: p0 * 0.85, mode: p0, max: p0 * 1.1 },
    { key: "esc", min: 0, mode: 0.03, max: 0.12 },
    { key: "eur", min: 0.01, mode: BUILD_SELL_DEFAULTS.euribor, max: 0.045 },
  ];
  const corr = [
    [1, 0, -0.3], // price · escalation · euribor
    [0, 1, 0.3],
    [-0.3, 0.3, 1],
  ];
  return run(
    drivers,
    corr,
    (s) =>
      runBuildSellScenario(
        { ...BUILD_SELL_DEFAULTS, mainPricePerSqm: s.price, costEscalationPct: s.esc, euribor: s.eur },
        BUILD_SELL_SCENARIOS[0],
      ).annualisedIrr,
    "merchant",
  );
}

let villaCache: SimStats | null = null;
export function simulateVillaReturn(): SimStats {
  return (villaCache ??= computeVillaReturn());
}
