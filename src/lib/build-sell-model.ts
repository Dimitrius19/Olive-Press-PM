// Build-and-Sell financial model — Supernatural AE (Ellinikon / Athens Riviera).
// Ported from "Supernatural_Build&Sell_Final Family.xlsx" (T-Life Capital, June 2026).
// Parallel to the operate-and-hold model in financial-model.ts: instead of holding and
// operating the asset, the project is built and sold, with two exit scenarios.

export interface BuildSellInputs {
  // A. Project cost
  landCost: number; // Land + soft costs paid in to date (€)
  constructionCost: number; // Construction & development cost — base estimate, today's prices (€)
  costEscalationPct: number; // Annual construction cost escalation, compounded to the spend midpoint
  escalationYears: number; // Years from the base estimate to the cost-weighted spend midpoint
  contingencyPct: number; // Construction contingency, as % of escalated construction cost
  constructionVatRate: number; // VAT rate on construction spend
  vatRecoverable: boolean; // If false, input VAT is irrecoverable and added to project cost
  // B. Debt — 10yr facility, 3yr interest-free grace
  debt: number; // Facility I size (€)
  euribor: number; // Euribor 3M reference rate (post-grace)
  spread: number; // Bank spread (post-grace)
  constructionQuarters: number; // Quarterly drawdown tranches over the build
  // C. Sale / exit
  mainArea: number; // Saleable main built area — GBA (m²)
  mainPricePerSqm: number; // €/m²
  secondaryArea: number; // Saleable secondary built area — GBA (m²)
  secondaryPricePerSqm: number; // €/m²
  agentCommissionPct: number; // Seller-side brokerage
  marketingPct: number; // Show-home, staging, listing
  legalPct: number; // Notary, legal, land registry
  saleTaxRate: number; // Corporate income tax on the development sale gain
  // D. Operating assumptions (only used by the "1 yr ops + sale" scenario)
  weeklyRate: number; // €/week
  weeksOfOperation: number;
  occupancyRate: number;
  managementFeePct: number; // % of revenue
  payroll: number;
  utilities: number;
  otherOpex: number;
  enfia: number; // ENFIA property tax (€)
  capexReservePct: number; // % of revenue set aside
  operatingTaxRate: number; // Corporate rate on operating profit
}

export interface BuildSellScenario {
  name: string;
  hasOperatingYear: boolean;
  holdingPeriodYears: number;
  note: string;
}

export interface OperatingYear {
  revenue: number;
  managementFee: number;
  payroll: number;
  utilities: number;
  otherOpex: number;
  enfia: number;
  totalOpex: number;
  ebitda: number;
  interest: number;
  pbt: number;
  tax: number;
  nopat: number;
  capexReserve: number;
  cashFlowAfterTax: number;
}

export interface BuildSellResult {
  scenario: BuildSellScenario;
  // Cost & structure
  totalProjectCost: number;
  equityCostGap: number; // Total cost − debt
  ltc: number; // Loan-to-cost
  // Construction cost build-up (base → escalation → contingency → VAT)
  baseConstructionCost: number;
  escalatedConstructionCost: number;
  contingencyAmount: number;
  constructionVat: number;
  effectiveConstructionCost: number;
  // Debt interest (accrued; equity-funded during grace)
  allInRate: number;
  quarterlyRate: number;
  quarterlyDrawdown: number;
  constructionInterest: number;
  operatingYearInterest: number;
  totalInterest: number;
  // Sale
  grossSalePrice: number;
  sellingCostPct: number;
  sellingCosts: number;
  netSaleProceeds: number;
  // Operating (null when scenario sells at completion)
  operating: OperatingYear | null;
  // Sale profit
  developmentCost: number; // Land + construction + total interest
  grossProfitOnSale: number;
  developmentMargin: number; // Gross profit ÷ gross sale
  saleGainTax: number; // Corporate income tax on the development gain
  netProfitOnSale: number; // Gross profit on sale − sale gain tax
  // Returns to equity
  totalEquityDeployed: number;
  operatingCashFlow: number;
  totalProfitToEquity: number;
  loanRepayment: number; // Facility repaid in full at sale
  netCashToEquityAtExit: number;
  roe: number; // Return on equity over the holding period
  equityMultiple: number;
  annualisedIrr: number; // Dated-cash-flow IRR (quarterly flows, annualised)
  simpleAnnualisedIrr: number; // Proxy: equityMultiple^(1/years) − 1
  equityCashFlows: number[]; // Quarterly equity cash flows used for the dated IRR
}

export const BUILD_SELL_SCENARIOS: BuildSellScenario[] = [
  {
    name: "Sell at Completion",
    hasOperatingYear: false,
    holdingPeriodYears: 2,
    note: "Build-to-sell. No operating phase. Sale at end of Year 2.",
  },
  {
    name: "1 Yr Ops + Sale",
    hasOperatingYear: true,
    holdingPeriodYears: 3,
    note: "One operating year, then sale at end of Year 3 (end of grace).",
  },
];

export const BUILD_SELL_DEFAULTS: BuildSellInputs = {
  landCost: 13_000_000,
  constructionCost: 13_000_000,
  costEscalationPct: 0,
  escalationYears: 2.25,
  contingencyPct: 0,
  constructionVatRate: 0.24,
  vatRecoverable: true,
  debt: 13_000_000,
  euribor: 0.02148,
  spread: 0.013,
  constructionQuarters: 8,
  mainArea: 1_500,
  mainPricePerSqm: 30_000,
  secondaryArea: 500,
  secondaryPricePerSqm: 15_000,
  agentCommissionPct: 0.02,
  marketingPct: 0.002,
  legalPct: 0.002,
  saleTaxRate: 0.22,
  weeklyRate: 100_000,
  weeksOfOperation: 52,
  occupancyRate: 0.6,
  managementFeePct: 0.1,
  payroll: 140_000,
  utilities: 50_000,
  otherOpex: 100_000,
  enfia: 50_000,
  capexReservePct: 0.03,
  operatingTaxRate: 0.22,
};

// Internal: IRR of a uniform-period cash-flow series, solved by bisection. Returns the
// per-period rate, or null if there is no sign change (e.g. no equity is deployed). The
// equity flows here are "conventional" — outflows during the build, then inflows at and
// before exit — so a single real root exists and bisection is robust.
function computeIrr(flows: number[]): number | null {
  if (flows.length < 2) return null;
  const npv = (rate: number) =>
    flows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i), 0);
  let lo = -0.9999;
  let hi = 1;
  let fLo = npv(lo);
  let fHi = npv(hi);
  let guard = 0;
  while (fLo * fHi > 0 && hi < 1e6 && guard < 100) {
    hi *= 2;
    fHi = npv(hi);
    guard += 1;
  }
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;
  let mid = lo;
  for (let i = 0; i < 200; i++) {
    mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (!Number.isFinite(fMid)) return null;
    if (Math.abs(fMid) < 1e-4) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return mid;
}

export function runBuildSellScenario(
  inputs: BuildSellInputs,
  scenario: BuildSellScenario,
): BuildSellResult {
  // Construction cost build-up. Escalate the base (today's-prices) estimate forward to the
  // cost-weighted spend midpoint, add contingency, then add VAT when it is irrecoverable (a
  // real cost where new-build sales are VAT-exempt). Debt is sized to the term sheet, so any
  // uplift here widens the equity cost-gap rather than the loan.
  const baseConstructionCost = inputs.constructionCost;
  const escalatedConstructionCost =
    baseConstructionCost *
    Math.pow(1 + inputs.costEscalationPct, inputs.escalationYears);
  const contingencyAmount = escalatedConstructionCost * inputs.contingencyPct;
  const constructionExVat = escalatedConstructionCost + contingencyAmount;
  const constructionVat = inputs.vatRecoverable
    ? 0
    : constructionExVat * inputs.constructionVatRate;
  const effectiveConstructionCost = constructionExVat + constructionVat;

  // Cost & structure
  const totalProjectCost = inputs.landCost + effectiveConstructionCost;
  const equityCostGap = totalProjectCost - inputs.debt;
  const ltc = totalProjectCost > 0 ? inputs.debt / totalProjectCost : 0;

  // Debt interest. The grace period is interest-free against cash, but the model
  // accrues interest and treats it as equity-funded (added to equity deployed).
  const allInRate = inputs.euribor + inputs.spread;
  const quarterlyRate = allInRate / 4;
  const quarterlyDrawdown =
    inputs.constructionQuarters > 0 ? inputs.debt / inputs.constructionQuarters : 0;
  // Construction interest = quarterly rate on the cumulative balance, summed over the
  // drawdown tranches: rate × tranche × (1 + 2 + … + n).
  const n = inputs.constructionQuarters;
  const constructionInterest =
    quarterlyRate * quarterlyDrawdown * ((n * (n + 1)) / 2);
  // One additional year of interest on the full balance if the asset is operated.
  const operatingYearInterest = inputs.debt * allInRate;
  const totalInterest =
    constructionInterest + (scenario.hasOperatingYear ? operatingYearInterest : 0);

  // Sale
  const grossSalePrice =
    inputs.mainArea * inputs.mainPricePerSqm +
    inputs.secondaryArea * inputs.secondaryPricePerSqm;
  const sellingCostPct =
    inputs.agentCommissionPct + inputs.marketingPct + inputs.legalPct;
  const sellingCosts = grossSalePrice * sellingCostPct;
  const netSaleProceeds = grossSalePrice - sellingCosts;

  // Operating year (scenario 2 only)
  let operating: OperatingYear | null = null;
  if (scenario.hasOperatingYear) {
    const revenue = inputs.weeklyRate * inputs.weeksOfOperation * inputs.occupancyRate;
    const managementFee = revenue * inputs.managementFeePct;
    const totalOpex =
      managementFee + inputs.payroll + inputs.utilities + inputs.otherOpex + inputs.enfia;
    const ebitda = revenue - totalOpex;
    const interest = operatingYearInterest;
    const pbt = ebitda - interest;
    const tax = Math.max(0, pbt) * inputs.operatingTaxRate;
    const nopat = pbt - tax;
    const capexReserve = revenue * inputs.capexReservePct;
    const cashFlowAfterTax = nopat - capexReserve;
    operating = {
      revenue,
      managementFee,
      payroll: inputs.payroll,
      utilities: inputs.utilities,
      otherOpex: inputs.otherOpex,
      enfia: inputs.enfia,
      totalOpex,
      ebitda,
      interest,
      pbt,
      tax,
      nopat,
      capexReserve,
      cashFlowAfterTax,
    };
  }

  // Sale profit. Gross profit subtracts the full original cost basis plus all accrued
  // interest from net proceeds (consistent across both scenarios).
  const developmentCost = inputs.landCost + effectiveConstructionCost + totalInterest;
  const grossProfitOnSale = netSaleProceeds - developmentCost;
  const developmentMargin =
    grossSalePrice > 0 ? grossProfitOnSale / grossSalePrice : 0;
  // Corporate income tax on the development gain (Greek SA, 22% default). Only a positive
  // gain is taxed; the operating year (scenario 2) is taxed separately above.
  const saleGainTax = Math.max(0, grossProfitOnSale) * inputs.saleTaxRate;
  const netProfitOnSale = grossProfitOnSale - saleGainTax;

  // Returns to equity. Accrued interest is equity-funded, so it lifts equity deployed.
  const totalEquityDeployed = equityCostGap + totalInterest;
  const operatingCashFlow = operating?.cashFlowAfterTax ?? 0;
  const totalProfitToEquity = operatingCashFlow + netProfitOnSale;
  const netCashToEquityAtExit =
    operatingCashFlow + netSaleProceeds - inputs.debt - saleGainTax;
  const roe = totalEquityDeployed > 0 ? totalProfitToEquity / totalEquityDeployed : 0;
  const equityMultiple = 1 + roe;
  // Proxy IRR: assumes all equity in on day one and all cash out at exit.
  const simpleAnnualisedIrr =
    scenario.holdingPeriodYears > 0 && equityMultiple > 0
      ? Math.pow(equityMultiple, 1 / scenario.holdingPeriodYears) - 1
      : 0;

  // Dated cash-flow IRR. Equity funds land/soft costs upfront (t0); any remaining cost-gap
  // plus accrued interest is injected pro-rata across the construction quarters, while debt
  // funds construction. The asset is sold at the end of the holding period; in scenario 2
  // the operating cash flow is received across the operating quarters before the sale.
  const exitQuarter = Math.round(scenario.holdingPeriodYears * 4);
  const equityCashFlows = new Array<number>(exitQuarter + 1).fill(0);
  const equityAtT0 = Math.max(0, Math.min(equityCostGap, inputs.landCost));
  const equitySpread = Math.max(0, equityCostGap - equityAtT0);
  if (n > 0) {
    const perQuarterEquity = (equitySpread + totalInterest) / n;
    for (let i = 0; i < n; i++) equityCashFlows[i] -= perQuarterEquity;
    equityCashFlows[0] -= equityAtT0;
  } else {
    equityCashFlows[0] -= equityAtT0 + equitySpread + totalInterest;
  }
  const saleCashToEquity = netSaleProceeds - inputs.debt - saleGainTax;
  const operatingQuarters = Math.max(0, exitQuarter - n);
  if (operatingQuarters > 0) {
    const perQuarterOp = operatingCashFlow / operatingQuarters;
    for (let i = n + 1; i <= exitQuarter; i++) equityCashFlows[i] += perQuarterOp;
  }
  equityCashFlows[exitQuarter] += saleCashToEquity;
  const quarterlyIrr = computeIrr(equityCashFlows);
  const annualisedIrr =
    quarterlyIrr !== null ? Math.pow(1 + quarterlyIrr, 4) - 1 : simpleAnnualisedIrr;

  return {
    scenario,
    totalProjectCost,
    equityCostGap,
    ltc,
    baseConstructionCost,
    escalatedConstructionCost,
    contingencyAmount,
    constructionVat,
    effectiveConstructionCost,
    allInRate,
    quarterlyRate,
    quarterlyDrawdown,
    constructionInterest,
    operatingYearInterest,
    totalInterest,
    grossSalePrice,
    sellingCostPct,
    sellingCosts,
    netSaleProceeds,
    operating,
    developmentCost,
    grossProfitOnSale,
    developmentMargin,
    saleGainTax,
    netProfitOnSale,
    totalEquityDeployed,
    operatingCashFlow,
    totalProfitToEquity,
    loanRepayment: inputs.debt,
    netCashToEquityAtExit,
    roe,
    equityMultiple,
    annualisedIrr,
    simpleAnnualisedIrr,
    equityCashFlows,
  };
}

export interface DrawdownQuarter {
  index: number;
  drawdown: number;
  cumulativeLoan: number;
  interest: number;
}

// Quarterly construction draw-down schedule (for display).
export function buildDrawdownSchedule(inputs: BuildSellInputs): DrawdownQuarter[] {
  const quarterlyRate = (inputs.euribor + inputs.spread) / 4;
  const tranche =
    inputs.constructionQuarters > 0 ? inputs.debt / inputs.constructionQuarters : 0;
  const schedule: DrawdownQuarter[] = [];
  let cumulative = 0;
  for (let i = 1; i <= inputs.constructionQuarters; i++) {
    cumulative += tranche;
    schedule.push({
      index: i,
      drawdown: tranche,
      cumulativeLoan: cumulative,
      interest: cumulative * quarterlyRate,
    });
  }
  return schedule;
}
