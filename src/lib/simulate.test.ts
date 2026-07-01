import { describe, it, expect } from "vitest";
import {
  makeRng,
  makeNormal,
  normalCdf,
  triangularInvCdf,
  cholesky,
  quantile,
  simulate,
  scoreReturnDistribution,
  type SimStats,
} from "./simulate";

describe("makeRng — seeded PRNG", () => {
  it("is deterministic for a given seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("diverges across seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toBe(b());
  });

  it("stays inside [0, 1)", () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const u = r();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });
});

describe("makeNormal — Box–Muller", () => {
  it("has ~zero mean and ~unit variance", () => {
    const normal = makeNormal(makeRng(123));
    const n = 50_000;
    let sum = 0;
    let sumsq = 0;
    for (let i = 0; i < n; i++) {
      const z = normal();
      sum += z;
      sumsq += z * z;
    }
    const mean = sum / n;
    const variance = sumsq / n - mean * mean;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(variance - 1)).toBeLessThan(0.05);
  });
});

describe("normalCdf — standard-normal Φ", () => {
  it("is 0.5 at the mean", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
  });

  it("matches known quantiles", () => {
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1.959964)).toBeCloseTo(0.025, 4);
    expect(normalCdf(1)).toBeCloseTo(0.841345, 4);
  });

  it("is monotone and bounded in (0, 1)", () => {
    let prev = 0;
    for (let x = -4; x <= 4; x += 0.25) {
      const p = normalCdf(x);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});

describe("triangularInvCdf", () => {
  it("returns the endpoints at u = 0 and u = 1", () => {
    expect(triangularInvCdf(0, 2, 5, 10)).toBeCloseTo(2, 9);
    expect(triangularInvCdf(1, 2, 5, 10)).toBeCloseTo(10, 9);
  });

  it("returns the mode at the CDF break-point", () => {
    const min = 2;
    const mode = 5;
    const max = 10;
    const c = (mode - min) / (max - min);
    expect(triangularInvCdf(c, min, mode, max)).toBeCloseTo(mode, 9);
  });

  it("is monotone non-decreasing in u", () => {
    let prev = -Infinity;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const x = triangularInvCdf(Math.min(u, 1), 0, 3, 4);
      expect(x).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = x;
    }
  });

  it("collapses to a point when max ≤ min", () => {
    expect(triangularInvCdf(0.7, 5, 5, 5)).toBe(5);
  });

  it("has a sample mean near (min+mode+max)/3", () => {
    const rng = makeRng(9);
    let sum = 0;
    const n = 40_000;
    for (let i = 0; i < n; i++) sum += triangularInvCdf(rng(), 1, 2, 6);
    expect(sum / n).toBeCloseTo((1 + 2 + 6) / 3, 1);
  });
});

describe("cholesky", () => {
  it("recovers L with L·Lᵀ = A", () => {
    const A = [
      [4, 2, 2],
      [2, 5, 3],
      [2, 3, 6],
    ];
    const L = cholesky(A);
    const n = A.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += L[i][k] * L[j][k];
        expect(s).toBeCloseTo(A[i][j], 9);
      }
  });

  it("is lower-triangular", () => {
    const L = cholesky([
      [2, 1],
      [1, 2],
    ]);
    expect(L[0][1]).toBe(0);
  });

  it("throws on a non-PSD matrix", () => {
    expect(() =>
      cholesky([
        [1, 2],
        [2, 1],
      ]),
    ).toThrow();
  });
});

describe("quantile", () => {
  const sorted = [10, 20, 30, 40, 50];
  it("hits the endpoints", () => {
    expect(quantile(sorted, 0)).toBe(10);
    expect(quantile(sorted, 1)).toBe(50);
  });
  it("interpolates the median", () => {
    expect(quantile(sorted, 0.5)).toBe(30);
  });
  it("interpolates between samples", () => {
    expect(quantile(sorted, 0.25)).toBeCloseTo(20, 9);
    expect(quantile(sorted, 0.1)).toBeCloseTo(14, 9);
  });
  it("handles degenerate inputs", () => {
    expect(Number.isNaN(quantile([], 0.5))).toBe(true);
    expect(quantile([7], 0.9)).toBe(7);
  });
});

describe("simulate", () => {
  const drivers = [
    { key: "a", min: 0, mode: 1, max: 2 },
    { key: "b", min: 10, mode: 10, max: 10 }, // degenerate constant
  ];

  it("is reproducible for a fixed seed", () => {
    const opts = {
      drivers,
      run: (s: Record<string, number>) => s.a + s.b,
      hurdle: 11,
      n: 2000,
      seed: 5,
    };
    const r1 = simulate(opts);
    const r2 = simulate(opts);
    expect(r1.stats.p50).toBe(r2.stats.p50);
    expect(r1.stats.mean).toBe(r2.stats.mean);
    expect(r1.values).toEqual(r2.values);
  });

  it("orders the quantiles p10 ≤ p50 ≤ p90 and brackets by min/max", () => {
    const { stats } = simulate({
      drivers,
      run: (s) => s.a + s.b,
      hurdle: 11,
      n: 5000,
      seed: 3,
    });
    expect(stats.min).toBeLessThanOrEqual(stats.p10);
    expect(stats.p10).toBeLessThanOrEqual(stats.p50);
    expect(stats.p50).toBeLessThanOrEqual(stats.p90);
    expect(stats.p90).toBeLessThanOrEqual(stats.max);
  });

  it("holds a degenerate driver constant", () => {
    const { values } = simulate({
      drivers,
      run: (s) => s.b,
      hurdle: 0,
      n: 500,
      seed: 1,
    });
    expect(values.every((v) => v === 10)).toBe(true);
  });

  it("counts dropped (non-finite) trials and keeps the finite ones", () => {
    const { stats } = simulate({
      drivers,
      run: (s) => (s.a < 1 ? NaN : s.a),
      hurdle: 1,
      n: 3000,
      seed: 8,
    });
    expect(stats.dropped).toBeGreaterThan(0);
    expect(stats.samples).toBeGreaterThan(0);
    expect(stats.samples + stats.dropped).toBe(3000);
  });

  it("estimates P(metric ≥ hurdle) sensibly", () => {
    // a ~ triangular(0,1,2), symmetric ⇒ P(a ≥ 1) ≈ 0.5
    const { stats } = simulate({
      drivers: [{ key: "a", min: 0, mode: 1, max: 2 }],
      run: (s) => s.a,
      hurdle: 1,
      n: 20_000,
      seed: 2,
    });
    expect(stats.probAtLeastHurdle).toBeGreaterThan(0.45);
    expect(stats.probAtLeastHurdle).toBeLessThan(0.55);
  });

  it("computes expected shortfall as the worst-5% mean, below p10", () => {
    const { stats } = simulate({
      drivers: [{ key: "a", min: 0, mode: 1, max: 2 }],
      run: (s) => s.a,
      hurdle: 1,
      n: 10_000,
      seed: 4,
    });
    expect(stats.expectedShortfall).toBeLessThanOrEqual(stats.p10);
    expect(stats.expectedShortfall).toBeGreaterThanOrEqual(stats.min);
  });

  it("recovers a positive correlation through the Gaussian copula", () => {
    const corr = [
      [1, 0.8],
      [0.8, 1],
    ];
    const xs: number[] = [];
    const ys: number[] = [];
    simulate({
      drivers: [
        { key: "x", min: 0, mode: 0.5, max: 1 },
        { key: "y", min: 0, mode: 0.5, max: 1 },
      ],
      correlation: corr,
      run: (s) => {
        xs.push(s.x);
        ys.push(s.y);
        return s.x + s.y;
      },
      hurdle: 1,
      n: 8000,
      seed: 6,
    });
    // Pearson correlation of the realised marginals should come out clearly positive.
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let cov = 0;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < n; i++) {
      cov += (xs[i] - mx) * (ys[i] - my);
      vx += (xs[i] - mx) ** 2;
      vy += (ys[i] - my) ** 2;
    }
    const rho = cov / Math.sqrt(vx * vy);
    expect(rho).toBeGreaterThan(0.6);
  });
});

describe("scoreReturnDistribution", () => {
  const base = (over: Partial<SimStats> = {}): SimStats => ({
    samples: 1000,
    dropped: 0,
    hurdle: 0.1,
    p10: 0.1,
    p50: 0.1,
    p90: 0.1,
    mean: 0.1,
    min: 0.05,
    max: 0.2,
    probAtLeastHurdle: 0.5,
    expectedShortfall: 0.05,
    ...over,
  });

  it("scores ~50 when the distribution sits exactly on the hurdle", () => {
    const s = scoreReturnDistribution(base());
    expect(s).toBeGreaterThan(45);
    expect(s).toBeLessThan(55);
  });

  it("scores 100 when it clears the hurdle by the target on all three counts", () => {
    const s = scoreReturnDistribution(
      base({ p50: 0.2, p10: 0.2, probAtLeastHurdle: 1 }),
      { targetExcess: 0.1 },
    );
    expect(s).toBeCloseTo(100, 5);
  });

  it("scores toward 0 when the median is a full target below the hurdle", () => {
    const s = scoreReturnDistribution(
      base({ p50: 0, p10: -0.05, probAtLeastHurdle: 0 }),
      { targetExcess: 0.1 },
    );
    expect(s).toBeLessThan(10);
  });

  it("is monotone in the probability of beating the hurdle", () => {
    const lo = scoreReturnDistribution(base({ probAtLeastHurdle: 0.2 }));
    const hi = scoreReturnDistribution(base({ probAtLeastHurdle: 0.9 }));
    expect(hi).toBeGreaterThan(lo);
  });

  it("stays within 0–100 and returns 0 on an unresolved p50", () => {
    expect(scoreReturnDistribution(base({ p50: NaN }))).toBe(0);
    const s = scoreReturnDistribution(base({ p50: 5, p10: 5, probAtLeastHurdle: 1 }));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
