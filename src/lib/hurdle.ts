// ── Hurdle rate (required return) ─────────────────────────────────────────────
// The bar an equity IRR must clear to create value. Built bottom-up so it moves
// with the world instead of sitting at an arbitrary fixed number:
//
//     hurdle = risk-free  +  country risk premium  +  strategy equity premium
//
//   · risk-free — the EUR base rate (ECB / German Bund proxy). Wire the live ECB
//     yield curve into `riskFreeRate` to let the whole book re-price with rates.
//   · country risk premium — the extra return demanded for Greek exposure
//     (Damodaran's country-risk dataset is the standard source).
//   · strategy equity premium — how much more equity holders want for the *kind*
//     of risk taken: a stabilised income asset is not a ground-up development is
//     not a short-hold merchant trade.
//
// The three flagship/​case return conventions each get their own hurdle, so a
// 6.5% stabilised yield and a 57% merchant IRR are finally judged against
// *different* bars — which is the whole point.

export type Strategy = "income" | "development" | "merchant";

// EUR risk-free proxy. Replace at call-sites with the live ECB curve (e.g. the
// 5-to-10y Bund yield matching the hold). ~2.8% reflects the 2026 EUR base.
export const DEFAULT_RISK_FREE_EUR = 0.028;

// Greece equity country-risk premium (Damodaran, 2025-26 vintage). Replace via
// the published country-risk dataset as it updates.
export const GREECE_COUNTRY_RISK_PREMIUM = 0.035;

// Extra return equity demands for the strategy's risk profile. Income is closest
// to a bond; development carries entitlement + build + absorption risk; a
// merchant (build-to-sell) trade adds timing/exit concentration on top.
export const STRATEGY_EQUITY_PREMIUM: Record<Strategy, number> = {
  income: 0.045,
  development: 0.08,
  merchant: 0.1,
};

export interface HurdleInputs {
  strategy: Strategy;
  riskFreeRate?: number; // default DEFAULT_RISK_FREE_EUR — wire the ECB curve here
  countryRiskPremium?: number; // default GREECE_COUNTRY_RISK_PREMIUM
  extraPremium?: number; // deal-specific add-on (illiquidity, single-tenant, etc.)
}

// Compose the required return from its parts. Every component is annualised and
// additive, matching how a build-up discount rate is quoted.
export function computeHurdle(inp: HurdleInputs): number {
  const rf = inp.riskFreeRate ?? DEFAULT_RISK_FREE_EUR;
  const crp = inp.countryRiskPremium ?? GREECE_COUNTRY_RISK_PREMIUM;
  const eq = STRATEGY_EQUITY_PREMIUM[inp.strategy];
  return rf + crp + eq + (inp.extraPremium ?? 0);
}
