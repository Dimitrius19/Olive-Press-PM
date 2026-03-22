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
  },
];

export const INVESTMENT = 10_557_940;
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

export function runScenario(inputs: ScenarioInputs): ScenarioResult {
  const projections: YearProjection[] = [];
  let cumulativeNoi = 0;

  for (let i = 0; i < MODEL_YEARS; i++) {
    const yearNum = i + 1;
    const calendarYear = START_YEAR + i;

    // Available nights
    const availableNights =
      yearNum === 1 ? ROOMS * OPERATING_DAYS_YEAR1 : ROOMS * OPERATING_DAYS_FULL;

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
    });
  }

  // Terminal value based on last year NOI
  const lastNoi = projections[projections.length - 1].noi;
  const terminalValue = lastNoi / inputs.terminalCapRate;

  // Cash flows for IRR: Year 0 = -investment, Years 1-9 = NOI, Year 10 = NOI + terminal
  const cashFlows: number[] = [-INVESTMENT];
  for (let i = 0; i < projections.length; i++) {
    const cf =
      i === projections.length - 1
        ? projections[i].noi + terminalValue
        : projections[i].noi;
    cashFlows.push(cf);
  }

  const irr = calculateIRR(cashFlows);
  const totalNoi = projections.reduce((sum, p) => sum + p.noi, 0);
  const roi = (totalNoi - INVESTMENT) / INVESTMENT;

  // Payback year: first year where cumulative NOI >= investment
  let paybackYear: number | null = null;
  for (const p of projections) {
    if (p.cumulativeNoi >= INVESTMENT) {
      paybackYear = p.year;
      break;
    }
  }

  // Year 3 stabilized total revenue per room
  const year3 = projections[2];
  const totalRevenuePerRoom = year3 ? year3.totalRevenue / ROOMS : 0;

  const totalReturn = terminalValue + totalNoi;

  return {
    inputs,
    projections,
    irr,
    roi,
    paybackYear,
    totalRevenuePerRoom,
    terminalValue,
    totalReturn,
  };
}
