import { describe, it, expect } from "vitest";
import {
  simulateCaseReturn,
  simulateHotelReturn,
  simulateVillaReturn,
} from "./return-sim";
import { computeHurdle } from "../lib/hurdle";
import { hbh } from "./cases/data/hbh";
import { robopark } from "./cases/data/robopark";

const ordered = (s: { p10: number; p50: number; p90: number }) => {
  expect(s.p10).toBeLessThanOrEqual(s.p50);
  expect(s.p50).toBeLessThanOrEqual(s.p90);
};

describe("simulateCaseReturn — development case (HBH)", () => {
  const s = simulateCaseReturn(hbh.model!);

  it("produces an ordered, finite distribution", () => {
    ordered(s);
    expect(Number.isFinite(s.mean)).toBe(true);
    expect(s.samples).toBeGreaterThan(0);
  });

  it("measures it against the development hurdle", () => {
    expect(s.hurdle).toBeCloseTo(computeHurdle({ strategy: "development" }), 9);
  });

  it("reports a probability of beating the hurdle in [0, 1]", () => {
    expect(s.probAtLeastHurdle).toBeGreaterThanOrEqual(0);
    expect(s.probAtLeastHurdle).toBeLessThanOrEqual(1);
  });

  it("memoises on the assumptions identity", () => {
    expect(simulateCaseReturn(hbh.model!)).toBe(s);
  });
});

describe("simulateCaseReturn — income case (RoboPark)", () => {
  const s = simulateCaseReturn(robopark.model!);

  it("produces an ordered distribution against the income hurdle", () => {
    ordered(s);
    expect(s.hurdle).toBeCloseTo(computeHurdle({ strategy: "income" }), 9);
  });
});

describe("simulateHotelReturn — Olive Press", () => {
  const s = simulateHotelReturn();

  it("is memoised (same reference each call)", () => {
    expect(simulateHotelReturn()).toBe(s);
  });

  it("uses the income hurdle and orders its quantiles", () => {
    ordered(s);
    expect(s.hurdle).toBeCloseTo(computeHurdle({ strategy: "income" }), 9);
  });

  it("lands a stabilised low-single-digit-to-high yield, mostly below the income bar", () => {
    // The net IRR sits well under a ~10.8% required income return.
    expect(s.p50).toBeGreaterThan(0);
    expect(s.p50).toBeLessThan(s.hurdle);
    expect(s.probAtLeastHurdle).toBeLessThan(0.4);
  });
});

describe("simulateVillaReturn — Ellinikon", () => {
  const s = simulateVillaReturn();

  it("is memoised and ordered", () => {
    expect(simulateVillaReturn()).toBe(s);
    ordered(s);
  });

  it("clears its merchant hurdle across essentially the whole distribution", () => {
    expect(s.hurdle).toBeCloseTo(computeHurdle({ strategy: "merchant" }), 9);
    expect(s.p10).toBeGreaterThan(s.hurdle);
    expect(s.probAtLeastHurdle).toBeGreaterThan(0.95);
  });

  it("centres on a short-hold merchant IRR well above 30%", () => {
    expect(s.p50).toBeGreaterThan(0.3);
  });
});
