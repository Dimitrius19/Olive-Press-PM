export interface ScenarioInputs {
  name: string;
  adrYear1: number;
  occupancyYear1: number;
  occupancyMature: number;
  adrGrowth: number;
  gopMargin: number;
  opexGrowth: number;
  fbPerNight: number;
  otherRevenuePct: number;
  capexReservePct: number;
  terminalCapRate: number;
  // Tax
  corporateTaxRate: number; // default 0.22 (Greece 22%)
  propertyTaxAnnual: number; // default 15000 (ENFIA estimate)
  // Debt Financing
  ltvPct: number; // Loan-to-Value, default 0 (no debt), range 0-0.80
  interestRate: number; // default 0.045 (4.5%)
  loanTermYears: number; // default 15
}

export interface YearProjection {
  year: number;
  availableNights: number;
  occupancy: number;
  occupiedNights: number;
  adr: number;
  revpar: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  gop: number;
  capexReserve: number;
  noi: number;
  cumulativeNoi: number;
  fcf: number;
  incomeTax: number;
  propertyTax: number;
  afterTaxNoi: number;
  debtService: number; // annual mortgage payment (P+I)
  leveragedCashFlow: number; // afterTaxNoi - debtService
  cumulativeLeveragedCf: number;
}

export interface ScenarioResult {
  inputs: ScenarioInputs;
  projections: YearProjection[];
  irr: number;
  roi: number;
  paybackYear: number | null;
  totalRevenuePerRoom: number;
  terminalValue: number;
  totalReturn: number;
  yieldOnCost: number; // Stabilized NOI (Year 3) / Investment
  cashOnCash: number; // Same as YoC when no debt
  stabilizedNoi: number; // Year 3 NOI
  afterTaxIrr: number;
  afterTaxYieldOnCost: number;
  leveragedIrr: number; // IRR on equity invested (after debt service)
  equityInvested: number; // investment * (1 - ltv)
  loanAmount: number;
  annualDebtService: number;
  debtServiceCoverageRatio: number; // stabilized NOI / debt service (should be >1.2)
  grossInvestment: number;
  stateSubsidy: number;
  effectiveInvestment: number; // grossInvestment - stateSubsidy
  netIrr: number; // IRR calculated on effective investment
  netYieldOnCost: number; // Stabilized NOI / effective investment
  netAfterTaxYieldOnCost: number;
  // Yield on Equity: after-tax NOI / actual owner equity (investment - subsidy - debt)
  yieldOnEquity: number;
  ownerEquity: number; // effectiveInvestment - loanAmount
}

export const SCENARIOS: ScenarioInputs[] = [
  {
    name: "Pessimistic",
    adrYear1: 140,
    occupancyYear1: 0.45,
    occupancyMature: 0.55,
    adrGrowth: 0.02,
    gopMargin: 0.3,
    opexGrowth: 0.03,
    fbPerNight: 25,
    otherRevenuePct: 0.05,
    capexReservePct: 0.05,
    terminalCapRate: 0.09,
    corporateTaxRate: 0.22,
    propertyTaxAnnual: 15000,
    ltvPct: 0,
    interestRate: 0.045,
    loanTermYears: 15,
  },
  {
    name: "Base",
    adrYear1: 180,
    occupancyYear1: 0.55,
    occupancyMature: 0.65,
    adrGrowth: 0.035,
    gopMargin: 0.38,
    opexGrowth: 0.025,
    fbPerNight: 35,
    otherRevenuePct: 0.1,
    capexReservePct: 0.04,
    terminalCapRate: 0.075,
    corporateTaxRate: 0.22,
    propertyTaxAnnual: 15000,
    ltvPct: 0,
    interestRate: 0.045,
    loanTermYears: 15,
  },
  {
    name: "Optimistic",
    adrYear1: 220,
    occupancyYear1: 0.65,
    occupancyMature: 0.75,
    adrGrowth: 0.05,
    gopMargin: 0.45,
    opexGrowth: 0.02,
    fbPerNight: 45,
    otherRevenuePct: 0.15,
    capexReservePct: 0.03,
    terminalCapRate: 0.06,
    corporateTaxRate: 0.22,
    propertyTaxAnnual: 15000,
    ltvPct: 0,
    interestRate: 0.045,
    loanTermYears: 15,
  },
];

export const INVESTMENT = 10_557_940;
export const STATE_SUBSIDY_DEFAULT = 3_000_000; // Αναπτυξιακός Νόμος — 50% of €6M approved
export const ROOMS = 48;
export const OPERATING_DAYS_FULL = 180;
export const OPERATING_DAYS_YEAR1 = 120;
export const MODEL_YEARS = 10;
export const START_YEAR = 2029;

export function calculateIRR(cashFlows: number[], guess = 0.1): number {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 0.00001) return newRate;
    rate = newRate;
  }
  return rate;
}

function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal === 0) return 0;
  if (annualRate === 0) return principal / years;
  const r = annualRate;
  const n = years;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function loanBalanceAfterPayments(principal: number, annualRate: number, totalYears: number, paymentsMade: number): number {
  if (principal === 0 || paymentsMade >= totalYears) return 0;
  if (annualRate === 0) return principal * (1 - paymentsMade / totalYears);
  const r = annualRate;
  const pmt = calculatePMT(principal, r, totalYears);
  // Balance = PV of remaining payments
  const remainingPayments = totalYears - paymentsMade;
  return pmt * (1 - Math.pow(1 + r, -remainingPayments)) / r;
}

export function runScenario(
  inputs: ScenarioInputs,
  investment = INVESTMENT,
  rooms = ROOMS,
  operatingDaysFull = OPERATING_DAYS_FULL,
  modelYears = MODEL_YEARS,
  stateSubsidy = 0,
): ScenarioResult {
  const operatingDaysYear1 = Math.round(operatingDaysFull * (OPERATING_DAYS_YEAR1 / OPERATING_DAYS_FULL));
  const projections: YearProjection[] = [];
  let cumulativeNoi = 0;

  // Debt calculations
  const loanAmount = investment * inputs.ltvPct;
  const equityInvested = investment - loanAmount;
  const annualDebtService = calculatePMT(loanAmount, inputs.interestRate, inputs.loanTermYears);

  let cumulativeLeveragedCf = 0;

  for (let i = 0; i < modelYears; i++) {
    const yearNum = i + 1;
    const calendarYear = START_YEAR + i;

    // Available nights
    const availableNights =
      yearNum === 1 ? rooms * operatingDaysYear1 : rooms * operatingDaysFull;

    // Occupancy ramp: Year 1 = initial, Year 2 = midpoint, Year 3+ = mature
    let occupancy: number;
    if (yearNum === 1) {
      occupancy = inputs.occupancyYear1;
    } else if (yearNum === 2) {
      occupancy = (inputs.occupancyYear1 + inputs.occupancyMature) / 2;
    } else {
      occupancy = inputs.occupancyMature;
    }

    const occupiedNights = Math.round(availableNights * occupancy);

    // ADR grows annually from Year 1
    const adr = inputs.adrYear1 * Math.pow(1 + inputs.adrGrowth, i);

    const roomRevenue = occupiedNights * adr;
    const fbRevenue = occupiedNights * inputs.fbPerNight;
    const otherRevenue = roomRevenue * inputs.otherRevenuePct;
    const totalRevenue = roomRevenue + fbRevenue + otherRevenue;

    const revpar = roomRevenue / availableNights;

    const gop = totalRevenue * inputs.gopMargin;
    const capexReserve = totalRevenue * inputs.capexReservePct;
    const noi = gop - capexReserve;

    cumulativeNoi += noi;

    // Tax calculations
    const incomeTax = Math.max(0, noi * inputs.corporateTaxRate);
    const propertyTax = inputs.propertyTaxAnnual;
    const afterTaxNoi = noi - incomeTax - propertyTax;

    // Debt service
    const debtService = annualDebtService;
    const leveragedCashFlow = afterTaxNoi - debtService;
    cumulativeLeveragedCf += leveragedCashFlow;

    // FCF: year index 0 in the IRR array is -investment (handled separately)
    const fcf = noi;

    projections.push({
      year: calendarYear,
      availableNights,
      occupancy,
      occupiedNights,
      adr,
      revpar,
      roomRevenue,
      fbRevenue,
      otherRevenue,
      totalRevenue,
      gop,
      capexReserve,
      noi,
      cumulativeNoi,
      fcf,
      incomeTax,
      propertyTax,
      afterTaxNoi,
      debtService,
      leveragedCashFlow,
      cumulativeLeveragedCf,
    });
  }

  // Terminal value based on last year NOI
  const lastNoi = projections[projections.length - 1].noi;
  const terminalValue = lastNoi / inputs.terminalCapRate;

  // Cash flows for IRR: Year 0 = -investment, Years 1-N = NOI, last year = NOI + terminal
  const cashFlows: number[] = [-investment];
  for (let i = 0; i < projections.length; i++) {
    const cf =
      i === projections.length - 1
        ? projections[i].noi + terminalValue
        : projections[i].noi;
    cashFlows.push(cf);
  }

  const irr = calculateIRR(cashFlows);
  const totalNoi = projections.reduce((sum, p) => sum + p.noi, 0);
  const roi = (totalNoi - investment) / investment;

  // Payback year: first year where cumulative NOI >= investment
  let paybackYear: number | null = null;
  for (const p of projections) {
    if (p.cumulativeNoi >= investment) {
      paybackYear = p.year;
      break;
    }
  }

  // Year 3 stabilized total revenue per room
  const year3 = projections[2];
  const totalRevenuePerRoom = year3 ? year3.totalRevenue / rooms : 0;

  const totalReturn = terminalValue + totalNoi;

  // Yield on Cost = Stabilized NOI (Year 3) / Total Investment
  const stabilizedYear = projections.length >= 3 ? projections[2] : projections[projections.length - 1];
  const stabilizedNoi = stabilizedYear?.noi ?? 0;
  const yieldOnCost = investment > 0 ? stabilizedNoi / investment : 0;
  const cashOnCash = yieldOnCost; // Same when no debt financing

  // After-Tax Yield on Cost
  const stabilizedAfterTaxNoi = stabilizedYear?.afterTaxNoi ?? 0;
  const afterTaxYieldOnCost = investment > 0 ? stabilizedAfterTaxNoi / investment : 0;

  // After-Tax IRR: cash flows using afterTaxNoi
  const afterTaxCashFlows: number[] = [-investment];
  for (let i = 0; i < projections.length; i++) {
    const lastYear = i === projections.length - 1;
    // Terminal value adjusted: sale proceeds after tax on gain
    const terminalAfterTax = lastYear ? terminalValue : 0;
    afterTaxCashFlows.push(projections[i].afterTaxNoi + terminalAfterTax);
  }
  const afterTaxIrr = calculateIRR(afterTaxCashFlows);

  // Leveraged IRR: cash flows using leveragedCashFlow
  // Year 0 = -equity, terminal = terminal value - remaining loan balance + final year leveraged CF
  const remainingBalance = loanAmount > 0
    ? loanBalanceAfterPayments(loanAmount, inputs.interestRate, inputs.loanTermYears, modelYears)
    : 0;

  const leveragedCashFlows: number[] = [-equityInvested];
  for (let i = 0; i < projections.length; i++) {
    const lastYear = i === projections.length - 1;
    if (lastYear) {
      // Final year: leveraged CF + terminal value - remaining loan payoff
      leveragedCashFlows.push(projections[i].afterTaxNoi - projections[i].debtService + terminalValue - remainingBalance);
    } else {
      leveragedCashFlows.push(projections[i].leveragedCashFlow);
    }
  }
  const leveragedIrr = equityInvested > 0 ? calculateIRR(leveragedCashFlows) : afterTaxIrr;

  // DSCR = stabilized NOI / annual debt service
  const debtServiceCoverageRatio = annualDebtService > 0
    ? stabilizedNoi / annualDebtService
    : Infinity;

  // Net metrics (after state subsidy)
  const effectiveInvestment = investment - stateSubsidy;

  // Net IRR: same cash flows but Year 0 = -effectiveInvestment
  const netCashFlows: number[] = [-effectiveInvestment];
  for (let i = 0; i < projections.length; i++) {
    const cf =
      i === projections.length - 1
        ? projections[i].noi + terminalValue
        : projections[i].noi;
    netCashFlows.push(cf);
  }
  const netIrr = effectiveInvestment > 0 ? calculateIRR(netCashFlows) : irr;

  const netYieldOnCost = effectiveInvestment > 0 ? stabilizedNoi / effectiveInvestment : 0;
  const netAfterTaxYieldOnCost = effectiveInvestment > 0 ? stabilizedAfterTaxNoi / effectiveInvestment : 0;

  return {
    inputs,
    projections,
    irr,
    roi,
    paybackYear,
    totalRevenuePerRoom,
    terminalValue,
    totalReturn,
    yieldOnCost,
    cashOnCash,
    stabilizedNoi,
    afterTaxIrr,
    afterTaxYieldOnCost,
    leveragedIrr,
    equityInvested,
    loanAmount,
    annualDebtService,
    debtServiceCoverageRatio,
    grossInvestment: investment,
    stateSubsidy,
    effectiveInvestment,
    netIrr,
    netYieldOnCost,
    netAfterTaxYieldOnCost,
    // Yield on Equity = After-tax NOI / Owner's actual equity
    // Owner equity = investment - subsidy - debt
    ownerEquity: Math.max(0, effectiveInvestment - loanAmount),
    yieldOnEquity:
      effectiveInvestment - loanAmount > 0
        ? stabilizedAfterTaxNoi / (effectiveInvestment - loanAmount)
        : 0,
  };
}

// Reverse solve: what ADR is needed to hit a target Yield on Cost?
export function solveAdrForTargetYield(
  baseInputs: ScenarioInputs,
  targetYield: number,
  investment = INVESTMENT,
  rooms = ROOMS,
  operatingDaysFull = OPERATING_DAYS_FULL,
  modelYears = MODEL_YEARS,
  stateSubsidy = 0,
): number {
  // Binary search for ADR that produces the target after-tax YoC
  let low = 50;
  let high = 600;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const testInputs = { ...baseInputs, adrYear1: mid };
    const result = runScenario(testInputs, investment, rooms, operatingDaysFull, modelYears, stateSubsidy);
    if (result.afterTaxYieldOnCost < targetYield) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.round((low + high) / 2);
}

// Reverse solve: what occupancy is needed to hit a target Yield on Cost?
export function solveOccupancyForTargetYield(
  baseInputs: ScenarioInputs,
  targetYield: number,
  investment = INVESTMENT,
  rooms = ROOMS,
  operatingDaysFull = OPERATING_DAYS_FULL,
  modelYears = MODEL_YEARS,
  stateSubsidy = 0,
): number {
  let low = 0.1;
  let high = 0.99;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const testInputs = { ...baseInputs, occupancyMature: mid, occupancyYear1: mid * 0.85 };
    const result = runScenario(testInputs, investment, rooms, operatingDaysFull, modelYears, stateSubsidy);
    if (result.afterTaxYieldOnCost < targetYield) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.round(((low + high) / 2) * 100);
}
