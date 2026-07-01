// ── Probabilistic return engine ──────────────────────────────────────────────
// A small, dependency-free Monte-Carlo core that turns a deterministic model
// into a *distribution* of outcomes. Each uncertain input is given as a 3-point
// estimate (min / mode / max) — exactly the Pessimistic / Base / Optimistic
// calibration the flagship models already carry — and sampled from a triangular
// marginal. Inputs can be correlated through a Gaussian copula so, e.g., exit
// cap rate moves with interest rates and ADR moves with inflation; ignoring that
// correlation badly understates the tails.
//
// Everything here is pure and seeded: the same seed yields the same run, so the
// output is reproducible and testable. Wire live priors (ECB curve, construction
// index, STR/AirDNA benchmarks) into the driver bounds and correlation matrix to
// bring the distribution closer to reality.

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Deterministic, fast, good enough for Monte-Carlo. Returns a function drawing
// uniforms in [0, 1).
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard-normal generator (Box–Muller), caching the spare deviate.
export function makeNormal(rng: () => number): () => number {
  let spare: number | null = null;
  return function () {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u1 = 0;
    while (u1 <= 1e-12) u1 = rng();
    const u2 = rng();
    const mag = Math.sqrt(-2 * Math.log(u1));
    spare = mag * Math.sin(2 * Math.PI * u2);
    return mag * Math.cos(2 * Math.PI * u2);
  };
}

// ── Distribution helpers ─────────────────────────────────────────────────────

// Error function (Abramowitz & Stegun 7.1.26), max error ~1.5e-7.
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

// Standard-normal CDF Φ.
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Inverse CDF of a triangular distribution from a 3-point estimate. u ∈ [0, 1].
export function triangularInvCdf(u: number, min: number, mode: number, max: number): number {
  if (max <= min) return min;
  const c = (mode - min) / (max - min);
  if (u <= c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

// Cholesky decomposition (lower-triangular L with L·Lᵀ = A). Throws if A is not
// positive semi-definite, which is the caller's signal that the correlation
// matrix is inconsistent.
export function cholesky(a: number[][]): number[][] {
  const n = a.length;
  const L: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = a[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (sum <= -1e-12) throw new Error("correlation matrix is not positive semi-definite");
        L[i][j] = Math.sqrt(Math.max(sum, 0));
      } else {
        L[i][j] = L[j][j] > 0 ? sum / L[j][j] : 0;
      }
    }
  }
  return L;
}

// Quantile of an ascending-sorted array by linear interpolation.
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = clamp(q, 0, 1) * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// ── Simulation ───────────────────────────────────────────────────────────────

export interface Driver {
  key: string;
  min: number;
  mode: number;
  max: number;
}

export interface SimStats {
  samples: number; // valid (finite) trials
  dropped: number; // trials whose metric did not resolve
  hurdle: number;
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  min: number;
  max: number;
  probAtLeastHurdle: number; // P(metric ≥ hurdle)
  expectedShortfall: number; // mean of the worst 5% of outcomes
}

export interface SimulateOptions {
  drivers: Driver[];
  // k×k Pearson-correlation matrix over the drivers (Gaussian copula). Defaults
  // to independent sampling (identity).
  correlation?: number[][];
  // Maps a sampled set of driver values to the metric under test (e.g. equity
  // IRR). Return NaN/Infinity for a trial that does not resolve; it is dropped.
  run: (sample: Record<string, number>) => number;
  hurdle: number;
  n?: number; // trials, default 10_000
  seed?: number; // default 1
}

export interface SimulateResult {
  values: number[]; // sorted ascending, finite only
  stats: SimStats;
}

export function simulate(opts: SimulateOptions): SimulateResult {
  const { drivers, run, hurdle } = opts;
  const n = opts.n ?? 10_000;
  const seed = opts.seed ?? 1;
  const k = drivers.length;
  const L = opts.correlation ? cholesky(opts.correlation) : null;

  const rng = makeRng(seed);
  const normal = makeNormal(rng);

  const values: number[] = [];
  let dropped = 0;
  const nrm = new Array<number>(k);

  for (let t = 0; t < n; t++) {
    for (let i = 0; i < k; i++) nrm[i] = normal();

    const sample: Record<string, number> = {};
    for (let i = 0; i < k; i++) {
      let z = nrm[i];
      if (L) {
        z = 0;
        for (let j = 0; j <= i; j++) z += L[i][j] * nrm[j];
      }
      const u = normalCdf(z);
      sample[drivers[i].key] = triangularInvCdf(u, drivers[i].min, drivers[i].mode, drivers[i].max);
    }

    const metric = run(sample);
    if (Number.isFinite(metric)) values.push(metric);
    else dropped++;
  }

  values.sort((x, y) => x - y);
  const samples = values.length;

  if (samples === 0) {
    return {
      values,
      stats: {
        samples: 0, dropped, hurdle,
        p10: NaN, p50: NaN, p90: NaN, mean: NaN, min: NaN, max: NaN,
        probAtLeastHurdle: NaN, expectedShortfall: NaN,
      },
    };
  }

  const mean = values.reduce((s, v) => s + v, 0) / samples;
  const atLeast = values.reduce((c, v) => c + (v >= hurdle ? 1 : 0), 0) / samples;
  const tailCount = Math.max(1, Math.floor(0.05 * samples));
  let tailSum = 0;
  for (let i = 0; i < tailCount; i++) tailSum += values[i];

  return {
    values,
    stats: {
      samples,
      dropped,
      hurdle,
      p10: quantile(values, 0.1),
      p50: quantile(values, 0.5),
      p90: quantile(values, 0.9),
      mean,
      min: values[0],
      max: values[samples - 1],
      probAtLeastHurdle: atLeast,
      expectedShortfall: tailSum / tailCount,
    },
  };
}

// ── Distribution-aware, hurdle-relative score ────────────────────────────────
// Replaces the flat "6% → 0, 30% → 100" IRR map. A project is graded on three
// distributional facts, all relative to its own hurdle rather than a fixed band:
//   · how *likely* it is to beat the hurdle (probability mass above it),
//   · how far the *median* clears the hurdle, and
//   · how the *downside* (P10) sits against the hurdle.
// Beating the hurdle by `targetExcess` (default 10pp) on all three counts scores
// 100; landing exactly on the hurdle scores ~50; a median a full targetExcess
// below it scores toward 0. Convention-agnostic: a stabilised income yield and a
// short-hold merchant IRR are both judged by whether they clear *their* hurdle.
export const SCORE_WEIGHTS = { probability: 0.45, median: 0.35, downside: 0.2 } as const;

export function scoreReturnDistribution(
  stats: SimStats,
  opts: { targetExcess?: number } = {},
): number {
  if (!Number.isFinite(stats.p50)) return 0;
  const T = opts.targetExcess ?? 0.1;
  const central = clamp(0.5 + (0.5 * (stats.p50 - stats.hurdle)) / T, 0, 1);
  const tail = clamp(0.5 + (0.5 * (stats.p10 - stats.hurdle)) / T, 0, 1);
  const prob = clamp(stats.probAtLeastHurdle, 0, 1);
  const s =
    SCORE_WEIGHTS.probability * prob +
    SCORE_WEIGHTS.median * central +
    SCORE_WEIGHTS.downside * tail;
  return clamp(100 * s, 0, 100);
}
