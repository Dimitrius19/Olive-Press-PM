import { describe, it, expect } from "vitest";
import {
  irr,
  npv,
  computeModel,
  scoreCase,
  type ModelAssumptions,
  type OperationalRisk,
} from "./model";

describe("irr", () => {
  it("solves a simple level annuity", () => {
    // -1000 then 500 × 3 → ≈ 23.38%
    const rate = irr([-1000, 500, 500, 500]);
    expect(Math.abs(rate - 0.2338)).toBeLessThan(1e-3);
    // and the NPV at that rate is ~0
    expect(Math.abs(npv(rate, [-1000, 500, 500, 500]))).toBeLessThan(1e-2);
  });

  it("returns the exact rate on a one-period doubling-free case", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
  });

  it("handles a single bullet cash flow", () => {
    // -1000 then 2000 at t=4 → 2^(1/4) − 1
    expect(irr([-1000, 0, 0, 0, 2000])).toBeCloseTo(Math.pow(2, 0.25) - 1, 5);
  });

  it("returns NaN without a sign change", () => {
    expect(Number.isNaN(irr([100, 200, 300]))).toBe(true);
    expect(Number.isNaN(irr([-100, -200]))).toBe(true);
  });

  it("npv at rate 0 equals the sum", () => {
    expect(npv(0, [-100, 50, 80])).toBeCloseTo(30, 9);
  });
});

const op: OperationalRisk = { rating: "low", score: 80, note: "test" };

describe("computeModel — development", () => {
  const dev: ModelAssumptions = {
    mode: "development",
    years: [2026, 2027, 2028, 2029],
    landPrice: 2_000_000,
    acquisitionCostsPct: 0.05,
    construction: {
      hardCost: 5_000_000,
      softCostsPct: 0.1,
      contingencyPct: 0.1,
      schedule: [0, 0.5, 0.5, 0],
    },
    sale: {
      saleableArea: 3_000,
      pricePerSqm: 3_000,
      sellingCostsPct: 0.03,
      schedule: [0, 0, 0.5, 0.5],
    },
    finance: { ltcPct: 0.5, interestRate: 0.07 },
    operationalRisk: op,
  };

  const r = computeModel(dev);

  it("produces one row per year", () => {
    expect(r.rows).toHaveLength(4);
  });

  it("realises the full GDV as revenue", () => {
    expect(r.gdv).toBeCloseTo(9_000_000, 0);
    expect(r.totalRevenue).toBeCloseTo(9_000_000, 0);
  });

  it("construction all-in applies soft + contingency", () => {
    expect(r.constructionAllIn).toBeCloseTo(6_000_000, 0); // 5M × 1.20
  });

  it("profit = revenue − cost and is positive here", () => {
    expect(r.profit).toBeCloseTo(r.totalRevenue - r.totalCost, 6);
    expect(r.profit).toBeGreaterThan(0);
  });

  it("resolves finite, positive IRRs", () => {
    expect(Number.isFinite(r.projectIrr)).toBe(true);
    expect(r.projectIrr).toBeGreaterThan(0);
    expect(Number.isFinite(r.equityIrr)).toBe(true);
    expect(r.equityIrr).toBeGreaterThan(0);
  });

  it("leaves no unpaid debt at the end", () => {
    expect(r.rows[r.rows.length - 1].debtBalance).toBeCloseTo(0, 6);
  });

  it("equity multiple exceeds 1 on a profitable deal", () => {
    expect(r.equityMultiple).toBeGreaterThan(1);
  });
});

describe("computeModel — income (interest-only)", () => {
  const inc: ModelAssumptions = {
    mode: "income",
    years: [2026, 2027, 2028, 2029, 2030, 2031],
    landPrice: 3_000_000,
    acquisitionCostsPct: 0.04,
    income: {
      noi: [0, 250_000, 255_000, 260_000, 265_000, 270_000],
      exitYear: 5,
      exitNoi: 270_000,
      exitCapRate: 0.07,
      saleCostsPct: 0.02,
    },
    finance: { ltcPct: 0.5, interestRate: 0.06, interestOnly: true },
    operationalRisk: { rating: "high", score: 35, note: "test" },
  };

  const r = computeModel(inc);

  it("capitalises the exit value into revenue", () => {
    // exit value = 270k / 0.07 ≈ 3.857M, plus the six NOI years
    expect(r.gdv).toBeCloseTo(270_000 / 0.07, 0);
    expect(r.totalRevenue).toBeGreaterThan(r.gdv);
  });

  it("resolves a finite equity IRR and clears the loan at exit", () => {
    expect(Number.isFinite(r.equityIrr)).toBe(true);
    expect(r.rows[r.rows.length - 1].debtBalance).toBeCloseTo(0, 6);
  });
});

describe("scoreCase", () => {
  const strong = computeModel({
    mode: "development",
    years: [2026, 2027, 2028, 2029],
    landPrice: 1_000_000,
    acquisitionCostsPct: 0.05,
    construction: {
      hardCost: 3_000_000,
      softCostsPct: 0.1,
      contingencyPct: 0.08,
      schedule: [0, 0.5, 0.5, 0],
    },
    sale: {
      saleableArea: 2_500,
      pricePerSqm: 3_200,
      sellingCostsPct: 0.03,
      schedule: [0, 0, 0.5, 0.5],
    },
    finance: { ltcPct: 0.6, interestRate: 0.07 },
    operationalRisk: op,
  });

  it("keeps the composite within 0–100 and grades A–D", () => {
    const s = scoreCase(strong, [], op);
    expect(s.composite).toBeGreaterThanOrEqual(0);
    expect(s.composite).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D"]).toContain(s.grade);
  });

  it("penalises a heavier risk register", () => {
    const clean = scoreCase(strong, [], op);
    const risky = scoreCase(strong, [
      { title: "x", category: "c", severity: "high", status: "open", mitigation: "" },
      { title: "y", category: "c", severity: "high", status: "open", mitigation: "" },
    ], op);
    expect(risky.risk.score).toBeLessThan(clean.risk.score);
    expect(risky.composite).toBeLessThan(clean.composite);
  });

  it("rewards lower operational risk", () => {
    const lowOp = scoreCase(strong, [], { rating: "low", score: 85, note: "" });
    const highOp = scoreCase(strong, [], { rating: "high", score: 30, note: "" });
    expect(lowOp.composite).toBeGreaterThan(highOp.composite);
  });
});
