import { describe, it, expect } from "vitest";
import {
  CAPEX_CATEGORIES,
  CAPEX_DEFAULTS,
  CAPEX_DEFAULT_LINE_ITEMS,
  runCapexModel,
} from "../../src/lib/construction-capex-model";
import {
  BUILD_SELL_DEFAULTS,
  BUILD_SELL_SCENARIOS,
  runBuildSellScenario,
} from "../../src/lib/build-sell-model";

describe("Construction CAPEX — default elemental plan", () => {
  const r = runCapexModel(CAPEX_DEFAULTS);

  it("sums the line items to the €13.0m construction base", () => {
    expect(CAPEX_DEFAULT_LINE_ITEMS).toHaveLength(18);
    expect(r.baseCost).toBe(13_000_000);
    expect(r.baseCostPerSqm).toBe(6_500);
  });

  it("groups into the seven canonical categories with correct subtotals", () => {
    expect(r.categories).toHaveLength(7);
    const byName = Object.fromEntries(r.categories.map((c) => [c.category, c]));
    expect(byName["Substructure"].cost).toBe(1_560_000);
    expect(byName["Superstructure"].cost).toBe(3_640_000);
    expect(byName["Building Envelope & Openings"].cost).toBe(1_300_000);
    expect(byName["Internal Finishes"].cost).toBe(1_950_000);
    expect(byName["MEP / Services"].cost).toBe(2_600_000);
    expect(byName["External Works"].cost).toBe(1_300_000);
    expect(byName["Preliminaries"].cost).toBe(650_000);
    // Superstructure is the biggest single bucket at 28% of base.
    expect(byName["Superstructure"].pctOfBase).toBeCloseTo(0.28, 6);
  });

  it("renders categories in canonical order with item-level €/m² and %", () => {
    expect(r.categories.map((c) => c.category)).toEqual([...CAPEX_CATEGORIES]);
    const pctSum = r.categories.reduce((s, c) => s + c.pctOfBase, 0);
    expect(pctSum).toBeCloseTo(1, 6);
    const frame = r.categories[1].items.find((i) => i.id === "sup-1")!;
    expect(frame.cost).toBe(2_000_000);
    expect(frame.costPerSqm).toBe(1_000); // 2.0m ÷ 2,000 m²
  });

  it("applies the Sep-2027 base case: 4% escalation + 7.5% contingency, VAT recoverable", () => {
    expect(CAPEX_DEFAULTS.costEscalationPct).toBe(0.04);
    expect(CAPEX_DEFAULTS.contingencyPct).toBe(0.075);
    expect(CAPEX_DEFAULTS.vatRecoverable).toBe(true);
    const escalated = 13_000_000 * Math.pow(1.04, 2.25);
    expect(r.escalatedCost).toBeCloseTo(escalated, 4);
    expect(r.escalationAmount).toBeCloseTo(escalated - 13_000_000, 4);
    expect(r.contingencyAmount).toBeCloseTo(escalated * 0.075, 4);
    expect(r.vatAmount).toBe(0); // recoverable in the base case
    expect(r.allInCost).toBeCloseTo(escalated * 1.075, 4); // ≈ €15.26m
    expect(r.allInCostPerSqm).toBeCloseTo((escalated * 1.075) / 2_000, 4); // ≈ €7,632/m²
  });

  it("collapses to base when wrappers are neutral (all-in = base)", () => {
    const neutral = runCapexModel({
      ...CAPEX_DEFAULTS,
      costEscalationPct: 0,
      contingencyPct: 0,
      vatRecoverable: true,
    });
    expect(neutral.escalationAmount).toBe(0);
    expect(neutral.contingencyAmount).toBe(0);
    expect(neutral.vatAmount).toBe(0);
    expect(neutral.allInCost).toBe(13_000_000);
  });
});

describe("Construction CAPEX — build-up to all-in", () => {
  const stressed = runCapexModel({
    ...CAPEX_DEFAULTS,
    costEscalationPct: 0.05,
    escalationYears: 2.25,
    contingencyPct: 0.1,
    vatRate: 0.24,
    vatRecoverable: false,
  });

  it("escalates, adds contingency and irrecoverable VAT", () => {
    expect(stressed.escalatedCost).toBeCloseTo(14_508_391.8, 0);
    expect(stressed.escalationAmount).toBeCloseTo(1_508_391.8, 0);
    expect(stressed.contingencyAmount).toBeCloseTo(1_450_839.18, 0);
    expect(stressed.vatAmount).toBeCloseTo(3_830_215.44, 0);
    expect(stressed.allInCost).toBeCloseTo(19_789_446.42, 0);
    expect(stressed.allInCostPerSqm).toBeCloseTo(9_894.72, 1);
  });

  it("nets VAT out when flagged recoverable", () => {
    const recoverable = runCapexModel({
      ...CAPEX_DEFAULTS,
      costEscalationPct: 0.05,
      escalationYears: 2.25,
      contingencyPct: 0.1,
      vatRate: 0.24,
      vatRecoverable: true,
    });
    expect(recoverable.vatAmount).toBe(0);
    expect(recoverable.allInCost).toBeCloseTo(15_959_230.98, 0);
  });

  it("reconciles exactly with the Build-Sell effective construction cost", () => {
    const bs = runBuildSellScenario(
      {
        ...BUILD_SELL_DEFAULTS,
        costEscalationPct: 0.05,
        escalationYears: 2.25,
        contingencyPct: 0.1,
        constructionVatRate: 0.24,
        vatRecoverable: false,
      },
      BUILD_SELL_SCENARIOS[0],
    );
    expect(stressed.allInCost).toBeCloseTo(bs.effectiveConstructionCost, 6);
  });

  it("links to Build-Sell the way the app wires it (capex base + wrappers → construction)", () => {
    // Mirrors BuildSell.tsx's linkedInputs: the CAPEX base cost (sum of line items) becomes
    // the model's constructionCost, and the CAPEX escalation/contingency/VAT wrappers are
    // passed through. So the CAPEX all-in equals the model's effective construction cost for
    // the live default base case (4% escalation, 7.5% contingency, VAT recoverable).
    const capex = runCapexModel(CAPEX_DEFAULTS);
    const bs = runBuildSellScenario(
      {
        ...BUILD_SELL_DEFAULTS,
        constructionCost: capex.baseCost,
        costEscalationPct: CAPEX_DEFAULTS.costEscalationPct,
        escalationYears: CAPEX_DEFAULTS.escalationYears,
        contingencyPct: CAPEX_DEFAULTS.contingencyPct,
        constructionVatRate: CAPEX_DEFAULTS.vatRate,
        vatRecoverable: CAPEX_DEFAULTS.vatRecoverable,
      },
      BUILD_SELL_SCENARIOS[0],
    );
    expect(bs.baseConstructionCost).toBe(13_000_000);
    expect(capex.allInCost).toBeCloseTo(bs.effectiveConstructionCost, 6);
  });
});

describe("Construction CAPEX — interactive edits", () => {
  it("reflects an edited line item in its category and the base", () => {
    const edited = CAPEX_DEFAULT_LINE_ITEMS.map((it) =>
      it.id === "sup-1" ? { ...it, cost: 3_000_000 } : it,
    );
    const r = runCapexModel({ ...CAPEX_DEFAULTS, lineItems: edited });
    expect(r.baseCost).toBe(14_000_000); // +€1.0m
    const sup = r.categories.find((c) => c.category === "Superstructure")!;
    expect(sup.cost).toBe(4_640_000);
  });

  it("reflects added and removed line items", () => {
    const withAdded = [
      ...CAPEX_DEFAULT_LINE_ITEMS,
      { id: "custom-1", category: "MEP / Services", name: "Solar PV & battery", cost: 400_000 },
    ];
    const added = runCapexModel({ ...CAPEX_DEFAULTS, lineItems: withAdded });
    expect(added.baseCost).toBe(13_400_000);
    expect(added.categories.find((c) => c.category === "MEP / Services")!.cost).toBe(
      3_000_000,
    );

    const withRemoved = CAPEX_DEFAULT_LINE_ITEMS.filter((it) => it.id !== "ext-1");
    const removed = runCapexModel({ ...CAPEX_DEFAULTS, lineItems: withRemoved });
    expect(removed.baseCost).toBe(12_500_000); // −€0.5m pool line
  });

  it("captures user-added categories in a trailing 'Other' bucket", () => {
    const withOther = [
      ...CAPEX_DEFAULT_LINE_ITEMS,
      { id: "x-1", category: "Owner's Direct Works", name: "Art & sculpture", cost: 250_000 },
    ];
    const r = runCapexModel({ ...CAPEX_DEFAULTS, lineItems: withOther });
    expect(r.baseCost).toBe(13_250_000);
    const other = r.categories.find((c) => c.category === "Other")!;
    expect(other).toBeDefined();
    expect(other.cost).toBe(250_000);
  });
});
