import { describe, it, expect } from "vitest";
import {
  computeHurdle,
  DEFAULT_RISK_FREE_EUR,
  GREECE_COUNTRY_RISK_PREMIUM,
  STRATEGY_EQUITY_PREMIUM,
} from "./hurdle";

describe("computeHurdle", () => {
  it("sums risk-free + country + strategy premium by default", () => {
    const h = computeHurdle({ strategy: "development" });
    expect(h).toBeCloseTo(
      DEFAULT_RISK_FREE_EUR + GREECE_COUNTRY_RISK_PREMIUM + STRATEGY_EQUITY_PREMIUM.development,
      9,
    );
  });

  it("ranks the strategies income < development < merchant", () => {
    const income = computeHurdle({ strategy: "income" });
    const development = computeHurdle({ strategy: "development" });
    const merchant = computeHurdle({ strategy: "merchant" });
    expect(income).toBeLessThan(development);
    expect(development).toBeLessThan(merchant);
  });

  it("honours an overridden risk-free rate (the ECB-curve wire point)", () => {
    const low = computeHurdle({ strategy: "income", riskFreeRate: 0.02 });
    const high = computeHurdle({ strategy: "income", riskFreeRate: 0.05 });
    expect(high - low).toBeCloseTo(0.03, 9);
  });

  it("honours an overridden country risk premium", () => {
    const h = computeHurdle({ strategy: "income", countryRiskPremium: 0 });
    expect(h).toBeCloseTo(DEFAULT_RISK_FREE_EUR + STRATEGY_EQUITY_PREMIUM.income, 9);
  });

  it("adds a deal-specific extra premium", () => {
    const withExtra = computeHurdle({ strategy: "development", extraPremium: 0.02 });
    const without = computeHurdle({ strategy: "development" });
    expect(withExtra - without).toBeCloseTo(0.02, 9);
  });

  it("produces sane absolute levels for each strategy", () => {
    // income ≈ 2.8 + 3.5 + 4.5 = 10.8%; merchant ≈ 2.8 + 3.5 + 10 = 16.3%
    expect(computeHurdle({ strategy: "income" })).toBeCloseTo(0.108, 6);
    expect(computeHurdle({ strategy: "merchant" })).toBeCloseTo(0.163, 6);
  });
});
