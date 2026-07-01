import { describe, it, expect } from "vitest";
import {
  runScenario,
  calculateIRR,
  SCENARIOS,
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  type ScenarioInputs,
} from "./financial-model";

// Base capitalises BELOW all-in cost (a loss on disposal); only the Optimistic
// exit clears cost and produces a taxable gain — so the two scenarios exercise
// both sides of the disposal-tax logic.
const BASE = SCENARIOS[1];
const OPTIMISTIC = SCENARIOS[2];
const run = (inputs: ScenarioInputs) =>
  runScenario(inputs, INVESTMENT, ROOMS, OPERATING_DAYS_FULL, MODEL_YEARS, 0);

// Rebuild the after-tax IRR cash-flow series from the *exposed* per-year figures,
// so we can assert the model wired the terminal-gain tax through correctly — and
// that removing it (crediting the full terminal value, the old bug) would inflate
// the return.
function afterTaxIrrFromTerminal(r: ReturnType<typeof run>, terminalInflow: number): number {
  const last = r.projections.length - 1;
  const flows = [-INVESTMENT, ...r.projections.map((p, i) => p.afterTaxNoi + (i === last ? terminalInflow : 0))];
  return calculateIRR(flows);
}

describe("runScenario — disposal gain is taxed", () => {
  it("taxes the gain (proceeds − cost basis) at the corporate rate", () => {
    const r = run(OPTIMISTIC);
    const expectedGain = Math.max(0, r.terminalValue - INVESTMENT);
    expect(expectedGain).toBeGreaterThan(0);
    expect(r.terminalGainsTax).toBeCloseTo(expectedGain * OPTIMISTIC.corporateTaxRate, 6);
  });

  it("a gainful exit produces a positive tax deduction", () => {
    const r = run(OPTIMISTIC);
    expect(r.terminalValue).toBeGreaterThan(INVESTMENT);
    expect(r.terminalGainsTax).toBeGreaterThan(0);
  });

  it("after-tax IRR uses proceeds NET of the gains tax", () => {
    const r = run(OPTIMISTIC);
    // Wiring: reconstructing with (terminalValue − tax) reproduces the model's IRR.
    expect(afterTaxIrrFromTerminal(r, r.terminalValue - r.terminalGainsTax)).toBeCloseTo(r.afterTaxIrr, 10);
  });

  it("the fix bites: crediting the full terminal (old behaviour) overstates the IRR", () => {
    const r = run(OPTIMISTIC);
    // The buggy series (full terminal value, untaxed) must sit ABOVE the fixed one.
    expect(afterTaxIrrFromTerminal(r, r.terminalValue)).toBeGreaterThan(r.afterTaxIrr);
  });

  it("floors the tax at zero when the asset capitalises below cost (Base)", () => {
    const r = run(BASE);
    expect(r.terminalValue).toBeLessThan(INVESTMENT);
    expect(r.terminalGainsTax).toBe(0);
  });

  it("is zero when the corporate rate is zero, even on a gainful exit", () => {
    const r = run({ ...OPTIMISTIC, corporateTaxRate: 0 });
    expect(r.terminalValue).toBeGreaterThan(INVESTMENT);
    expect(r.terminalGainsTax).toBe(0);
  });

  it("with no debt, the leveraged IRR collapses onto the after-tax IRR", () => {
    const r = run(OPTIMISTIC); // ltvPct 0
    expect(r.leveragedIrr).toBeCloseTo(r.afterTaxIrr, 10);
  });

  it("the gains tax is basis-driven, independent of leverage", () => {
    const levered = run({ ...OPTIMISTIC, ltvPct: 0.5 });
    const expectedGain = Math.max(0, levered.terminalValue - INVESTMENT);
    expect(levered.terminalGainsTax).toBeCloseTo(expectedGain * OPTIMISTIC.corporateTaxRate, 6);
    expect(Number.isFinite(levered.leveragedIrr)).toBe(true);
  });
});
