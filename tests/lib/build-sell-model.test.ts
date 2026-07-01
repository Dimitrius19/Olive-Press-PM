import { describe, it, expect } from "vitest";
import {
  BUILD_SELL_DEFAULTS,
  BUILD_SELL_SCENARIOS,
  buildDrawdownSchedule,
  runBuildSellScenario,
} from "../../src/lib/build-sell-model";

// Canonical figures from the "Scenario Comparison" sheet of
// Supernatural_Build&Sell_Final Family.xlsx (T-Life Capital, June 2026).
const [scenario1, scenario2] = BUILD_SELL_SCENARIOS;

describe("Build-and-Sell — Scenario 1 (Sell at Completion)", () => {
  const r = runBuildSellScenario(BUILD_SELL_DEFAULTS, scenario1);

  it("derives project cost and structure", () => {
    expect(r.totalProjectCost).toBe(26_000_000);
    expect(r.equityCostGap).toBe(13_000_000);
    expect(r.ltc).toBeCloseTo(0.5, 6);
  });

  it("accrues €504,270 construction-period interest", () => {
    expect(r.allInRate).toBeCloseTo(0.03448, 6);
    expect(r.constructionInterest).toBeCloseTo(504_270, 0);
    expect(r.totalInterest).toBeCloseTo(504_270, 0);
  });

  it("computes the sale waterfall", () => {
    expect(r.grossSalePrice).toBe(52_500_000);
    expect(r.sellingCosts).toBeCloseTo(1_260_000, 0);
    expect(r.netSaleProceeds).toBeCloseTo(51_240_000, 0);
    expect(r.operating).toBeNull();
  });

  it("taxes the development gain at 22%", () => {
    expect(r.grossProfitOnSale).toBeCloseTo(24_735_730, 0);
    expect(r.developmentMargin).toBeCloseTo(0.47116, 4);
    expect(r.saleGainTax).toBeCloseTo(5_441_860.6, 1);
    expect(r.netProfitOnSale).toBeCloseTo(19_293_869.4, 1);
  });

  it("matches profit and equity returns (after tax)", () => {
    expect(r.totalEquityDeployed).toBeCloseTo(13_504_270, 0);
    expect(r.totalProfitToEquity).toBeCloseTo(19_293_869.4, 1);
    expect(r.netCashToEquityAtExit).toBeCloseTo(32_798_139.4, 1);
    expect(r.roe).toBeCloseTo(1.4287, 3);
    expect(r.equityMultiple).toBeCloseTo(2.4287, 3);
  });

  it("reports both a proxy and a dated-cash-flow IRR", () => {
    expect(r.simpleAnnualisedIrr).toBeCloseTo(0.5584, 3);
    expect(r.annualisedIrr).toBeCloseTo(0.5673, 3);
    // Dated flows: 8 construction quarters of outflow, then the sale inflow at exit (Q8).
    expect(r.equityCashFlows).toHaveLength(9);
    expect(r.equityCashFlows[0]).toBeLessThan(0);
    expect(r.equityCashFlows[8]).toBeCloseTo(32_798_139.4, 1);
    const sum = r.equityCashFlows.reduce((s, cf) => s + cf, 0);
    expect(sum).toBeCloseTo(r.totalProfitToEquity, 0);
  });
});

describe("Build-and-Sell — Scenario 2 (1 Yr Ops + Sale)", () => {
  const r = runBuildSellScenario(BUILD_SELL_DEFAULTS, scenario2);

  it("accrues an extra year of interest (€952,510 total)", () => {
    expect(r.operatingYearInterest).toBeCloseTo(448_240, 0);
    expect(r.totalInterest).toBeCloseTo(952_510, 0);
  });

  it("computes the operating year", () => {
    expect(r.operating).not.toBeNull();
    expect(r.operating!.revenue).toBeCloseTo(3_120_000, 0);
    expect(r.operating!.totalOpex).toBeCloseTo(652_000, 0);
    expect(r.operating!.ebitda).toBeCloseTo(2_468_000, 0);
    expect(r.operating!.pbt).toBeCloseTo(2_019_760, 0);
    expect(r.operating!.tax).toBeCloseTo(444_347.2, 1);
    expect(r.operating!.cashFlowAfterTax).toBeCloseTo(1_481_812.8, 1);
  });

  it("taxes the development gain at 22%", () => {
    expect(r.grossProfitOnSale).toBeCloseTo(24_287_490, 0);
    expect(r.saleGainTax).toBeCloseTo(5_343_247.8, 1);
    expect(r.netProfitOnSale).toBeCloseTo(18_944_242.2, 1);
  });

  it("matches profit and equity returns (after tax)", () => {
    expect(r.totalEquityDeployed).toBeCloseTo(13_952_510, 0);
    expect(r.totalProfitToEquity).toBeCloseTo(20_426_055, 0);
    expect(r.netCashToEquityAtExit).toBeCloseTo(34_378_565, 0);
    expect(r.roe).toBeCloseTo(1.4640, 3);
    expect(r.equityMultiple).toBeCloseTo(2.4640, 3);
  });

  it("reports both a proxy and a dated-cash-flow IRR", () => {
    expect(r.simpleAnnualisedIrr).toBeCloseTo(0.3507, 3);
    expect(r.annualisedIrr).toBeCloseTo(0.3601, 3);
    // Dated flows: 8 construction quarters, a gap quarter, then 4 operating quarters
    // (the last of which also carries the sale), out to exit at Q12.
    expect(r.equityCashFlows).toHaveLength(13);
    expect(r.equityCashFlows[0]).toBeLessThan(0);
    expect(r.equityCashFlows[8]).toBeCloseTo(0, 6);
    expect(r.equityCashFlows[12]).toBeGreaterThan(0);
    const sum = r.equityCashFlows.reduce((s, cf) => s + cf, 0);
    expect(sum).toBeCloseTo(r.totalProfitToEquity, 0);
  });
});

describe("Build-and-Sell — drawdown schedule", () => {
  const schedule = buildDrawdownSchedule(BUILD_SELL_DEFAULTS);

  it("has one row per construction quarter", () => {
    expect(schedule).toHaveLength(8);
  });

  it("draws €1.625m per quarter to a €13m balance", () => {
    expect(schedule[0].drawdown).toBeCloseTo(1_625_000, 0);
    expect(schedule[0].interest).toBeCloseTo(14_007.5, 1);
    expect(schedule[7].cumulativeLoan).toBeCloseTo(13_000_000, 0);
    expect(schedule[7].interest).toBeCloseTo(112_060, 0);
  });

  it("sums to the construction-period interest", () => {
    const total = schedule.reduce((s, q) => s + q.interest, 0);
    expect(total).toBeCloseTo(504_270, 0);
  });
});

describe("Build-and-Sell — zero sale-gain tax reproduces the source model", () => {
  // With the gain untaxed (saleTaxRate = 0) the model must collapse back to the original
  // pre-tax figures from the spreadsheet, proving tax is the only behavioural change.
  const r = runBuildSellScenario(
    { ...BUILD_SELL_DEFAULTS, saleTaxRate: 0 },
    scenario1,
  );

  it("leaves the gain untaxed", () => {
    expect(r.saleGainTax).toBe(0);
    expect(r.netProfitOnSale).toBeCloseTo(24_735_730, 0);
  });

  it("returns the original profit, equity and proxy IRR", () => {
    expect(r.totalProfitToEquity).toBeCloseTo(24_735_730, 0);
    expect(r.netCashToEquityAtExit).toBeCloseTo(38_240_000, 0);
    expect(r.equityMultiple).toBeCloseTo(2.8317, 3);
    expect(r.simpleAnnualisedIrr).toBeCloseTo(0.6828, 3);
  });
});

describe("Build-and-Sell — construction cost build-up (escalation, contingency, VAT)", () => {
  it("neutral defaults leave construction unchanged (effective = base)", () => {
    const r = runBuildSellScenario(BUILD_SELL_DEFAULTS, scenario1);
    expect(r.baseConstructionCost).toBe(13_000_000);
    expect(r.escalatedConstructionCost).toBe(13_000_000);
    expect(r.contingencyAmount).toBe(0);
    expect(r.constructionVat).toBe(0);
    expect(r.effectiveConstructionCost).toBe(13_000_000);
    expect(r.totalProjectCost).toBe(26_000_000);
  });

  it("escalates, adds contingency and irrecoverable VAT", () => {
    const r = runBuildSellScenario(
      {
        ...BUILD_SELL_DEFAULTS,
        costEscalationPct: 0.05,
        escalationYears: 2.25,
        contingencyPct: 0.1,
        constructionVatRate: 0.24,
        vatRecoverable: false,
      },
      scenario1,
    );
    // €13.0m base escalated at 5%/yr over 2.25yr → €14.508m
    expect(r.escalatedConstructionCost).toBeCloseTo(14_508_391.8, 0);
    // 10% contingency on the escalated cost
    expect(r.contingencyAmount).toBeCloseTo(1_450_839.18, 0);
    // 24% VAT on (escalated + contingency), irrecoverable → added to cost
    expect(r.constructionVat).toBeCloseTo(3_830_215.44, 0);
    expect(r.effectiveConstructionCost).toBeCloseTo(19_789_446.42, 0);
    // Debt is fixed, so the entire uplift widens cost and the equity gap.
    expect(r.totalProjectCost).toBeCloseTo(32_789_446.42, 0);
    expect(r.equityCostGap).toBeCloseTo(19_789_446.42, 0);
    expect(r.ltc).toBeCloseTo(0.39647, 4);
  });

  it("nets VAT out when flagged recoverable", () => {
    const r = runBuildSellScenario(
      {
        ...BUILD_SELL_DEFAULTS,
        costEscalationPct: 0.05,
        escalationYears: 2.25,
        contingencyPct: 0.1,
        constructionVatRate: 0.24,
        vatRecoverable: true,
      },
      scenario1,
    );
    expect(r.constructionVat).toBe(0);
    expect(r.effectiveConstructionCost).toBeCloseTo(15_959_230.98, 0);
  });

  it("flows the cost uplift through to weaker equity returns", () => {
    const base = runBuildSellScenario(BUILD_SELL_DEFAULTS, scenario1);
    const stressed = runBuildSellScenario(
      {
        ...BUILD_SELL_DEFAULTS,
        costEscalationPct: 0.05,
        escalationYears: 2.25,
        contingencyPct: 0.1,
        constructionVatRate: 0.24,
        vatRecoverable: false,
      },
      scenario1,
    );
    expect(stressed.effectiveConstructionCost).toBeGreaterThan(
      base.effectiveConstructionCost,
    );
    expect(stressed.netProfitOnSale).toBeLessThan(base.netProfitOnSale);
    expect(stressed.equityMultiple).toBeLessThan(base.equityMultiple);
    expect(stressed.annualisedIrr).toBeLessThan(base.annualisedIrr);
    // Concrete checkpoints for the stressed case.
    expect(stressed.equityMultiple).toBeCloseTo(1.6898, 3);
    expect(stressed.annualisedIrr).toBeCloseTo(0.3550, 3);
  });
});
