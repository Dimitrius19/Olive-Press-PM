import type { CaseRisk } from "./types";

// ── Financial model engine ───────────────────────────────────────────────────
// A transparent, teaser-grade development / income model. Each case supplies a
// set of ModelAssumptions; computeModel() expands them into a year-by-year cash
// flow, then derives an unlevered (project) IRR and a levered (equity) IRR plus
// the usual return metrics. scoreCase() grades the deal on three axes — IRR,
// development risk and operational risk — into a single composite.
//
// All figures are illustrative: they layer market-reasonable assumptions on top
// of the teaser facts and are meant to frame the return, not to underwrite it.

export type ModelMode = "development" | "income";

export interface OperationalRisk {
  rating: "low" | "medium" | "high";
  score: number; // 0–100, higher = lower operational burden
  note: string;
}

export interface ModelAssumptions {
  mode: ModelMode;
  currency?: string; // default "€"
  years: number[]; // calendar-year labels; length defines the timeline

  // ── Acquisition (both modes) ──
  landPrice: number; // asking / negotiated entry price
  acquisitionCostsPct: number; // transfer tax + legal + technical, as % of price
  landLabel?: string; // e.g. "Land / asset", "Negotiated entry"

  // ── Development-and-sale mode ──
  construction?: {
    hardCost: number; // construction / completion hard cost
    softCostsPct?: number; // design, PM, permits — as % of hard cost
    contingencyPct?: number; // as % of hard cost
    schedule: number[]; // fraction of all-in build spent per year (length = years)
    label?: string;
  };
  sale?: {
    saleableArea: number; // m² sold
    pricePerSqm: number; // € per saleable m²
    sellingCostsPct?: number; // agency + legal on sales
    schedule: number[]; // fraction of GDV realised per year (absorption)
  };

  // ── Income-and-exit mode ──
  income?: {
    noi: number[]; // net operating income per year (year 0 usually 0)
    exitYear: number; // index into years at which the asset is sold
    exitNoi: number; // stabilised NOI capitalised at exit
    exitCapRate: number; // e.g. 0.075
    saleCostsPct?: number; // costs on the exit sale
  };

  // ── Financing (both modes) ──
  finance: {
    ltcPct: number; // debt as a share of development / acquisition cost
    interestRate: number; // annual, capitalised through the build/hold
    interestOnly?: boolean; // income assets: service interest, repay principal at exit
    label?: string;
  };

  operationalRisk: OperationalRisk;
  note?: string; // per-case methodology note
}

export interface CashflowRow {
  year: number;
  land: number;
  acquisition: number;
  construction: number;
  selling: number;
  cost: number; // total outflow for the year
  revenue: number; // total inflow for the year
  unlevered: number; // revenue − cost
  cumUnlevered: number;
  debtDraw: number;
  interest: number;
  debtRepay: number;
  debtBalance: number;
  equity: number; // equity cash flow (negative = drawn, positive = returned)
  cumEquity: number;
}

export interface ModelResult {
  mode: ModelMode;
  currency: string;
  rows: CashflowRow[];
  totalCost: number;
  totalRevenue: number;
  gdv: number; // gross development / sale value
  profit: number; // unlevered profit
  profitOnCost: number; // profit / total cost
  projectIrr: number; // unlevered IRR
  equityIrr: number; // levered IRR
  equityInvested: number; // total equity contributed
  equityReturned: number;
  equityMultiple: number; // MOIC
  leveredProfit: number; // equity returned − equity invested
  peakFunding: number; // deepest cumulative equity outflow (positive magnitude)
  debtPeak: number;
  totalInterest: number;
  constructionAllIn: number;
}

export interface ScoreAxis {
  label: string;
  score: number; // 0–100
  detail: string;
}

export interface Scorecard {
  irr: ScoreAxis;
  risk: ScoreAxis;
  operational: ScoreAxis;
  composite: number; // 0–100
  grade: string; // A / B / C / D
  verdict: string;
}

// ── Math helpers ─────────────────────────────────────────────────────────────

const zeros = (n: number): number[] => new Array(n).fill(0);

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Net present value of a cash-flow series at a given rate (period 0 undiscounted).
export function npv(rate: number, cfs: number[]): number {
  let acc = 0;
  for (let t = 0; t < cfs.length; t++) acc += cfs[t] / Math.pow(1 + rate, t);
  return acc;
}

// Internal rate of return. Newton–Raphson with a bracketed bisection fallback so
// it stays robust on the irregular cash flows a development model throws off.
export function irr(cfs: number[], guess = 0.15): number {
  const hasPos = cfs.some((c) => c > 1e-9);
  const hasNeg = cfs.some((c) => c < -1e-9);
  if (!hasPos || !hasNeg) return NaN;

  // Newton–Raphson
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let f = 0;
    let df = 0;
    for (let t = 0; t < cfs.length; t++) {
      const denom = Math.pow(1 + rate, t);
      f += cfs[t] / denom;
      if (t > 0) df -= (t * cfs[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(f) < 1e-7) return rate;
    if (df === 0) break;
    const next = rate - f / df;
    if (!isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
  }

  // Bisection over a wide bracket
  let lo = -0.9;
  let hi = 10;
  let flo = npv(lo, cfs);
  let fhi = npv(hi, cfs);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid, cfs);
    if (Math.abs(fm) < 1e-7) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

// ── Model ────────────────────────────────────────────────────────────────────

export function computeModel(a: ModelAssumptions): ModelResult {
  const n = a.years.length;
  const currency = a.currency ?? "€";

  const land = zeros(n);
  const acquisition = zeros(n);
  const construction = zeros(n);
  const selling = zeros(n);
  const revenue = zeros(n);

  land[0] = a.landPrice;
  acquisition[0] = a.landPrice * a.acquisitionCostsPct;

  let constructionAllIn = 0;
  let gdv = 0;

  if (a.mode === "development" && a.construction && a.sale) {
    const c = a.construction;
    const s = a.sale;
    constructionAllIn = c.hardCost * (1 + (c.softCostsPct ?? 0) + (c.contingencyPct ?? 0));
    for (let t = 0; t < n; t++) construction[t] = constructionAllIn * (c.schedule[t] ?? 0);
    gdv = s.saleableArea * s.pricePerSqm;
    for (let t = 0; t < n; t++) {
      const rev = gdv * (s.schedule[t] ?? 0);
      revenue[t] += rev;
      selling[t] += rev * (s.sellingCostsPct ?? 0);
    }
  } else if (a.mode === "income" && a.income) {
    const inc = a.income;
    for (let t = 0; t < n; t++) revenue[t] += inc.noi[t] ?? 0;
    const exitValue = inc.exitNoi / inc.exitCapRate;
    gdv = exitValue;
    revenue[inc.exitYear] += exitValue;
    selling[inc.exitYear] += exitValue * (inc.saleCostsPct ?? 0);
  }

  const ltc = a.finance.ltcPct;
  const rate = a.finance.interestRate;
  const interestOnly = a.finance.interestOnly ?? false;
  // In interest-only mode, principal is only repaid from the exit-year proceeds.
  const exitYear = a.mode === "income" && a.income ? a.income.exitYear : n - 1;

  const rows: CashflowRow[] = [];
  let balance = 0;
  let totalInterest = 0;
  let debtPeak = 0;

  for (let t = 0; t < n; t++) {
    const devCost = land[t] + acquisition[t] + construction[t]; // debt-fundable cost
    const cost = devCost + selling[t];
    const rev = revenue[t];
    const unlevered = rev - cost;

    const debtDraw = ltc * devCost;
    balance += debtDraw;
    const interest = balance * rate;
    totalInterest += interest;

    const netRev = Math.max(0, rev - selling[t]); // proceeds after selling costs
    let debtRepay: number;
    let distribution: number;

    if (interestOnly) {
      // Service interest from income; distribute the surplus; hold principal
      // until the exit year, capitalising any interest the income cannot cover.
      const interestPaid = Math.min(interest, netRev);
      balance += interest - interestPaid;
      const surplus = netRev - interestPaid;
      debtRepay = t >= exitYear ? Math.min(balance, surplus) : 0;
      balance -= debtRepay;
      distribution = surplus - debtRepay;
    } else {
      // Merchant build: interest capitalises and sale proceeds sweep the debt.
      balance += interest;
      debtRepay = Math.min(balance, netRev);
      balance -= debtRepay;
      distribution = netRev - debtRepay;
    }
    debtPeak = Math.max(debtPeak, balance);

    const equityOut = devCost - debtDraw;
    const equity = -equityOut + distribution;

    rows.push({
      year: a.years[t],
      land: land[t],
      acquisition: acquisition[t],
      construction: construction[t],
      selling: selling[t],
      cost,
      revenue: rev,
      unlevered,
      cumUnlevered: 0,
      debtDraw,
      interest,
      debtRepay,
      debtBalance: balance,
      equity,
      cumEquity: 0,
    });
  }

  // Settle any residual debt against the final year's equity.
  if (balance > 1e-6) {
    const last = rows[n - 1];
    last.debtRepay += balance;
    last.equity -= balance;
    last.debtBalance = 0;
    balance = 0;
  }

  // Cumulative passes + return metrics.
  let cumUn = 0;
  let cumEq = 0;
  let equityInvested = 0;
  let equityReturned = 0;
  let peakFunding = 0;
  const unleveredCF: number[] = [];
  const equityCF: number[] = [];
  for (const r of rows) {
    cumUn += r.unlevered;
    cumEq += r.equity;
    r.cumUnlevered = cumUn;
    r.cumEquity = cumEq;
    if (r.equity < 0) equityInvested += -r.equity;
    else equityReturned += r.equity;
    peakFunding = Math.min(peakFunding, cumEq);
    unleveredCF.push(r.unlevered);
    equityCF.push(r.equity);
  }

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const profit = totalRevenue - totalCost;

  return {
    mode: a.mode,
    currency,
    rows,
    totalCost,
    totalRevenue,
    gdv,
    profit,
    profitOnCost: totalCost > 0 ? profit / totalCost : NaN,
    projectIrr: irr(unleveredCF),
    equityIrr: irr(equityCF),
    equityInvested,
    equityReturned,
    equityMultiple: equityInvested > 0 ? equityReturned / equityInvested : NaN,
    leveredProfit: equityReturned - equityInvested,
    peakFunding: -peakFunding,
    debtPeak,
    totalInterest,
    constructionAllIn,
  };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

// The minimal risk shape the register score needs. CaseRisk satisfies it, as do
// the flagship registers (same severity/status scale), so one scoring path can
// grade any project. `probability` and `category` are optional: a register that
// rates likelihood (e.g. the Ellinikon register) gets a full likelihood × impact
// treatment, and a category lets the score weigh genuine build / entitlement
// risk above the market or financing risk the IRR and operational axes carry.
export type RiskLike = {
  severity: "high" | "medium" | "low";
  status: "open" | "mitigating" | "resolved";
  probability?: "high" | "medium" | "low";
  category?: string;
};

// Map the levered (equity) IRR onto 0–100: 6% → 0, 30% → 100, linear between.
export function scoreIrr(eqIrr: number): number {
  if (!isFinite(eqIrr)) return 0;
  return clamp(((eqIrr - 0.06) / (0.3 - 0.06)) * 100, 0, 100);
}

// ── Development-risk model ───────────────────────────────────────────────────
// The score is a probability of clean delivery: 100 × Π(1 − hazardᵢ) over the
// register. Each risk contributes an independent hazard built from expected loss
// (likelihood × impact), discounted by how far it has been retired (status) and
// weighted by how squarely it sits on the *development* axis (category). Reading
// it as a survival product means the axis is monotonic (any risk can only lower
// it), never saturates hard to zero the way an additive penalty does, and
// rewards mitigation multiplicatively rather than by a flat subtraction.

// Impact if the risk lands, by severity.
const RISK_IMPACT: Record<RiskLike["severity"], number> = { high: 1.0, medium: 0.5, low: 0.2 };
// Likelihood the risk lands. Registers that omit probability are treated as
// medium so a bare severity/status register still scores sensibly.
const RISK_LIKELIHOOD: Record<"high" | "medium" | "low", number> = { high: 0.9, medium: 0.6, low: 0.3 };
// How live the exposure still is: mitigation halves it, resolution all but
// retires it.
const RISK_STATUS: Record<RiskLike["status"], number> = { open: 1.0, mitigating: 0.5, resolved: 0.15 };
// Ceiling on a single open, high-severity, high-likelihood development risk so
// one line can never by itself zero the axis.
const RISK_HAZARD_CAP = 0.5;

// Category weighting. The development axis is meant to price *build and
// entitlement* execution — the risks specific to actually delivering the asset.
// Market / sales / liquidity risk is already carried by the IRR axis, and
// financing risk sits partly there too, so those are down-weighted here to avoid
// double-counting. Anything unclassified (or a genuine build/permit/technical
// risk) keeps full weight.
export function developmentWeight(category?: string): number {
  if (!category) return 1;
  const c = category.toLowerCase();
  if (/(market|sales|liquid|demand|macro|currency|fx|commercial|income|absorption|lease|buyer|exit)/.test(c))
    return 0.6;
  if (/(financ|debt|interest|tax|funding|capital)/.test(c)) return 0.8;
  return 1;
}

// Derive a 0–100 development-risk score from a project's risk register. Higher is
// safer (a clean register scores 100). Heavier, more-likely, still-open risks —
// especially build / entitlement risks — pull it down the hardest.
export function scoreRisk(risks: RiskLike[]): number {
  let survival = 1;
  for (const r of risks) {
    const hazard =
      RISK_HAZARD_CAP *
      RISK_IMPACT[r.severity] *
      RISK_LIKELIHOOD[r.probability ?? "medium"] *
      RISK_STATUS[r.status] *
      developmentWeight(r.category);
    survival *= 1 - hazard;
  }
  return clamp(100 * survival, 0, 100);
}

export interface GradeResult {
  composite: number; // 0–100
  grade: string; // A / B / C / D
  verdict: string;
}

// Blend the three axis scores — IRR 50%, development risk 30%, operational 20%
// — into a composite, an A–D grade and a one-line verdict. Shared by the case
// scorecard and the flagship hub grades so the scale means the same everywhere.
export function composeGrade(irrScore: number, riskScore: number, opScore: number): GradeResult {
  const composite = 0.5 * irrScore + 0.3 * riskScore + 0.2 * opScore;
  const grade =
    composite >= 78 ? "A" : composite >= 64 ? "B" : composite >= 50 ? "C" : "D";
  const verdict =
    composite >= 78
      ? "Strong risk-adjusted return"
      : composite >= 64
      ? "Attractive, with manageable risk"
      : composite >= 50
      ? "Workable, but return leans on the assumptions"
      : "Marginal — the return does not yet clear the risk";
  return { composite, grade, verdict };
}

export function scoreCase(
  model: ModelResult,
  risks: CaseRisk[],
  op: OperationalRisk,
): Scorecard {
  const irrScore = scoreIrr(model.equityIrr);
  const riskScore = scoreRisk(risks);
  const opScore = clamp(op.score, 0, 100);
  const { composite, grade, verdict } = composeGrade(irrScore, riskScore, opScore);

  const highs = risks.filter((r) => r.severity === "high").length;
  const openRisks = risks.filter((r) => r.status === "open").length;

  return {
    irr: {
      label: "IRR",
      score: irrScore,
      detail: isFinite(model.equityIrr)
        ? `Equity IRR ≈ ${fmtPct(model.equityIrr)} on ${fmtX(model.equityMultiple)} equity multiple.`
        : "Return does not resolve on these assumptions.",
    },
    risk: {
      label: "Development risk",
      score: riskScore,
      detail: `${risks.length} risks on the register — ${highs} high-severity, ${openRisks} still open. Scored as likelihood × impact per risk, retired by mitigation and weighted toward build & entitlement risk over market risk.`,
    },
    operational: {
      label: "Operational risk",
      score: opScore,
      detail: op.note,
    },
    composite,
    grade,
    verdict,
  };
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function fmtMoney(n: number, currency = "€"): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${currency}${(abs / 1e3).toFixed(0)}k`;
  return `${sign}${currency}${abs.toFixed(0)}`;
}

// Compact money for dense tables: whole thousands or one-decimal millions.
export function fmtMoneyCompact(n: number, currency = "€"): string {
  if (Math.abs(n) < 1) return "—";
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${currency}${Math.round(abs / 1e3)}k`;
}

export function fmtPct(x: number, digits = 1): string {
  if (!isFinite(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmtX(x: number): string {
  if (!isFinite(x)) return "—";
  return `${x.toFixed(2)}×`;
}
