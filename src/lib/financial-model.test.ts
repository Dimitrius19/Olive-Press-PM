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

// Named scenarios exercise both sides of the disposal-tax logic: the Pessimistic
// exit sells below its written-down basis (a loss), while the Optimistic exit
// clears cost and recaptures depreciation as a taxable gain.
const PESSIMISTIC = SCENARIOS[0];
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
  it("taxes the recaptured gain (proceeds − written-down basis) at the corporate rate", () => {
    const r = run(OPTIMISTIC);
    const basis = INVESTMENT - r.accumulatedDepreciation;
    const expectedGain = Math.max(0, r.terminalValue - basis);
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

  it("floors the tax at zero when the asset sells below its written-down basis (Pessimistic)", () => {
    const r = run(PESSIMISTIC);
    expect(r.terminalValue).toBeLessThan(INVESTMENT - r.accumulatedDepreciation);
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
    const basis = INVESTMENT - levered.accumulatedDepreciation;
    const expectedGain = Math.max(0, levered.terminalValue - basis);
    expect(levered.terminalGainsTax).toBeCloseTo(expectedGain * OPTIMISTIC.corporateTaxRate, 6);
    expect(Number.isFinite(levered.leveragedIrr)).toBe(true);
  });
});

describe("runScenario — depreciation", () => {
  it("charges straight-line depreciation on the non-land base", () => {
    const r = run(BASE);
    const expectedAnnual = (INVESTMENT * (1 - 0.2)) / 25; // defaults: 20% land, 25y life
    expect(r.annualDepreciation).toBeCloseTo(expectedAnnual, 6);
    expect(r.accumulatedDepreciation).toBeCloseTo(expectedAnnual * MODEL_YEARS, 6);
    // Every operating year carries the same charge.
    expect(r.projections[0].depreciation).toBeCloseTo(expectedAnnual, 6);
  });

  it("shields operating income, lowering the annual tax vs no depreciation", () => {
    const withDep = run(OPTIMISTIC);
    const noDep = run({ ...OPTIMISTIC, landValuePct: 1 }); // depreciable base = 0
    expect(noDep.annualDepreciation).toBe(0);
    // A stabilised year pays less income tax, hence more after-tax NOI, with the shield.
    expect(withDep.projections[5].incomeTax).toBeLessThan(noDep.projections[5].incomeTax);
    expect(withDep.projections[5].afterTaxNoi).toBeGreaterThan(noDep.projections[5].afterTaxNoi);
  });

  it("recaptures depreciation at exit: a gainful sale is taxed more than with no depreciation", () => {
    const withDep = run(OPTIMISTIC);
    const noDep = run({ ...OPTIMISTIC, landValuePct: 1 });
    expect(withDep.terminalGainsTax).toBeGreaterThan(noDep.terminalGainsTax);
  });

  it("caps accumulated depreciation at the depreciable base over a long horizon", () => {
    // 5-year life over a 10-year hold would over-depreciate; it is capped at the base.
    const r = run({ ...BASE, buildingUsefulLifeYears: 5 });
    const base = INVESTMENT * (1 - 0.2);
    expect(r.accumulatedDepreciation).toBeCloseTo(base, 6);
  });
});
