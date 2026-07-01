import {
  LayoutDashboard,
  GanttChart,
  Wallet,
  FileText,
  AlertTriangle,
  Users,
  Image,
  Map,
  TrendingUp,
  Calculator,
  Building2,
  HardHat,
} from "lucide-react";
import type { ProjectDef, ProjectEconomics, ProjectScore } from "./types";
import { CapexProvider } from "../lib/capex-context";
import {
  fmtMoney,
  fmtPct,
  scoreIrr,
  scoreRisk,
  composeGrade,
  type RiskLike,
} from "./cases/model";
import {
  runScenario,
  SCENARIOS,
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  STATE_SUBSIDY_DEFAULT,
} from "../lib/financial-model";
import {
  runBuildSellScenario,
  BUILD_SELL_DEFAULTS,
  BUILD_SELL_SCENARIOS,
} from "../lib/build-sell-model";

// Olive Press views (Supabase-backed PM workspace)
import { Overview } from "../views/Overview";
import { Timeline } from "../views/Timeline";
import { Budget } from "../views/Budget";
import { Documents } from "../views/Documents";
import { Risks } from "../views/Risks";
import { Team } from "../views/Team";
import { Gallery } from "../views/Gallery";
import { SitePlan } from "../views/SitePlan";
import { MarketCheck } from "../views/MarketCheck";
import { FinancialModel } from "../views/FinancialModel";

// Ellinikon Villa views (build-to-sell model + construction cost plan)
import { BuildSell } from "../views/BuildSell";
import { ConstructionCapex } from "../views/ConstructionCapex";
import { EllinikonMarketCheck } from "../views/EllinikonMarketCheck";
import { EllinikonRisks, RISKS as ELLINIKON_RISKS } from "../views/EllinikonRisks";

// Mani estate (self-contained project package)
import { maniProject } from "./mani";

// Acquisition opportunity cases (data-driven shared framework)
import { caseProjects } from "./cases";

// ── Headline economics for the two flagship projects ──
// Each is derived from that project's own base-case model so the hub card shows
// a real total cost + IRR, consistent with the opportunity cases.

// Olive Press: the base scenario of the hotel model. Total cost is the all-in
// investment; IRR is the net (post-subsidy) IRR the model headlines.
const olivePressBase = runScenario(
  SCENARIOS[1],
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  STATE_SUBSIDY_DEFAULT,
);
const olivePressEconomics: ProjectEconomics = {
  totalCost: fmtMoney(INVESTMENT),
  irr: fmtPct(olivePressBase.netIrr),
};

// Risk-adjusted grade for the hub card, on the same 0–100 scorecard as the
// opportunity cases (IRR 50% / development 30% / operational 20%). Two caveats
// are specific to this asset:
//  · the scorecard's IRR axis is calibrated for levered *development* equity IRRs
//    (6% → 0, 30% → 100); Olive Press headlines a stabilised, post-subsidy *net*
//    yield (~6.5%), which sits on the band floor and caps the composite whatever
//    the risk axes say.
//  · the live risk register is Supabase-backed and not available at build time, so
//    the development-risk axis is a hand-set assessment, not a computed penalty.
const olivePressScore: ProjectScore = (() => {
  const irrScore = scoreIrr(olivePressBase.netIrr);
  const devRisk = 55; // active build, historic conversion; permits + €3M subsidy secured
  const opRisk = 45; // 48-key operating hotel — seasonal, staff- and F&B-intensive
  const { composite, grade, verdict } = composeGrade(irrScore, devRisk, opRisk);
  return { composite: Math.round(composite), grade, verdict };
})();

// Ellinikon Villa: the "Sell at Completion" base case of the build-sell model.
const ellinikonBase = runBuildSellScenario(BUILD_SELL_DEFAULTS, BUILD_SELL_SCENARIOS[0]);
const ellinikonEconomics: ProjectEconomics = {
  totalCost: fmtMoney(ellinikonBase.totalProjectCost),
  irr: fmtPct(ellinikonBase.annualisedIrr),
};

// Risk-adjusted grade for the hub card, on the same scorecard as the cases.
// Development risk is scored from the real, rated Ellinikon register; operational
// risk is low because a merchant build-and-sell leaves no asset to run. Note the
// IRR axis reads this project's *annualised* short-hold sale IRR — a different
// convention from the cases' multi-year levered equity IRR — so it pins to 100
// and effectively carries the grade.
const ellinikonRegister: RiskLike[] = ELLINIKON_RISKS;
const ellinikonScore: ProjectScore = (() => {
  const irrScore = scoreIrr(ellinikonBase.annualisedIrr);
  const riskScore = scoreRisk(ellinikonRegister);
  const opRisk = 82; // build-to-sell: no operating business retained after the sale
  const { composite, grade, verdict } = composeGrade(irrScore, riskScore, opRisk);
  return { composite: Math.round(composite), grade, verdict };
})();

const olivePress: ProjectDef = {
  id: "olive-press",
  name: "Olive Press Hotel",
  shortName: "Olive Press",
  location: "Molyvos, Lesvos",
  tagline:
    "A 48-key 4-star boutique hotel reborn from a historic olive press on the Molyvos waterfront.",
  stage: "In development",
  status: "Active build",
  accent: "emerald",
  sidebarBg: "#1a2e1a",
  cover: "/hotel-aerial.jpg",
  logo: "/hotel-logo.png",
  kpis: [
    { label: "Keys", value: "48" },
    { label: "Gross area", value: "6,658 m²" },
    { label: "Opening", value: "Apr 2029" },
    { label: "State subsidy", value: "€3.0M" },
  ],
  economics: olivePressEconomics,
  score: olivePressScore,
  nav: [
    { key: "overview", label: "Overview", icon: LayoutDashboard, component: Overview },
    { key: "timeline", label: "Timeline", icon: GanttChart, component: Timeline },
    { key: "budget", label: "Budget", icon: Wallet, component: Budget },
    { key: "documents", label: "Documents", icon: FileText, component: Documents },
    { key: "risks", label: "Risks", icon: AlertTriangle, component: Risks },
    { key: "team", label: "Team", icon: Users, component: Team },
    { key: "gallery", label: "Gallery", icon: Image, component: Gallery },
    { key: "siteplan", label: "Site Plan", icon: Map, component: SitePlan },
    { key: "market", label: "Market Check", icon: TrendingUp, component: MarketCheck },
    { key: "financial", label: "Financial Model", icon: Calculator, component: FinancialModel },
  ],
};

const ellinikon: ProjectDef = {
  id: "ellinikon",
  name: "Ellinikon Villa",
  shortName: "Ellinikon Villa",
  location: "Ellinikon, Athens Riviera",
  tagline:
    "A build-to-sell luxury villa on the Athens Riviera — sell-side returns driven directly by the construction cost plan.",
  stage: "Feasibility",
  status: "Modelling",
  accent: "sky",
  sidebarBg: "#10243a",
  cover: "/aegean-coast.jpg",
  kpis: [
    { label: "GDV", value: "€52.5M" },
    { label: "Built area", value: "2,000 m²" },
    { label: "Land cost", value: "€13.0M" },
    { label: "Strategy", value: "Build & sell" },
  ],
  economics: ellinikonEconomics,
  score: ellinikonScore,
  nav: [
    { key: "buildsell", label: "Build-Sell Model", icon: Building2, component: BuildSell },
    { key: "capex", label: "Construction CAPEX", icon: HardHat, component: ConstructionCapex },
    { key: "market", label: "Market Check", icon: TrendingUp, component: EllinikonMarketCheck },
    { key: "risks", label: "Risks", icon: AlertTriangle, component: EllinikonRisks },
  ],
  Wrapper: CapexProvider,
};

export const projects: ProjectDef[] = [olivePress, ellinikon, maniProject, ...caseProjects];

export function getProject(id: string): ProjectDef | undefined {
  return projects.find((p) => p.id === id);
}
