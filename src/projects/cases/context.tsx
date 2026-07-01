import { createContext, useContext, type ReactNode } from "react";
import {
  LayoutDashboard,
  MapPin,
  Calculator,
  Coins,
  ShieldAlert,
} from "lucide-react";
import type { AccentKey, ProjectDef, ProjectEconomics, ProjectScore } from "../types";
import type { CaseData } from "./types";
import { computeModel, scoreCase, fmtMoney, fmtPct } from "./model";
import { CaseOverview } from "./views/CaseOverview";
import { CaseProperty } from "./views/CaseProperty";
import { CaseAnalysis } from "./views/CaseAnalysis";
import { CaseFinancials } from "./views/CaseFinancials";
import { CaseRisks } from "./views/CaseRisks";

// ── Accent → Tailwind class lookup ──
// Written out in full so the JIT scanner picks up every literal class string.
// Only the keys actually used by case views appear here.
interface AccentClasses {
  eyebrow: string; // section eyebrow text
  em: string; // emphasised figures / card-title accent
  statBg: string; // tinted stat-card background
  bullet: string; // list bullet glyph
  pill: string; // accent pill (border + bg + text)
  softBorder: string; // left border on highlight cards
  softFrom: string; // gradient start for highlight cards
}

export const ACCENT_UI: Record<AccentKey, AccentClasses> = {
  emerald: {
    eyebrow: "text-emerald-700/80",
    em: "text-emerald-700",
    statBg: "bg-emerald-50/40",
    bullet: "text-emerald-600",
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
    softBorder: "border-l-emerald-500",
    softFrom: "from-emerald-500/[0.08]",
  },
  sky: {
    eyebrow: "text-sky-700/80",
    em: "text-sky-700",
    statBg: "bg-sky-50/40",
    bullet: "text-sky-600",
    pill: "bg-sky-100 text-sky-700 border-sky-200",
    softBorder: "border-l-sky-500",
    softFrom: "from-sky-500/[0.08]",
  },
  amber: {
    eyebrow: "text-amber-700/80",
    em: "text-amber-700",
    statBg: "bg-amber-50/40",
    bullet: "text-amber-600",
    pill: "bg-amber-100 text-amber-700 border-amber-200",
    softBorder: "border-l-amber-500",
    softFrom: "from-amber-500/[0.08]",
  },
  orange: {
    eyebrow: "text-orange-700/80",
    em: "text-orange-700",
    statBg: "bg-orange-50/40",
    bullet: "text-orange-600",
    pill: "bg-orange-100 text-orange-700 border-orange-200",
    softBorder: "border-l-orange-500",
    softFrom: "from-orange-500/[0.08]",
  },
  violet: {
    eyebrow: "text-violet-700/80",
    em: "text-violet-700",
    statBg: "bg-violet-50/40",
    bullet: "text-violet-600",
    pill: "bg-violet-100 text-violet-700 border-violet-200",
    softBorder: "border-l-violet-500",
    softFrom: "from-violet-500/[0.08]",
  },
  rose: {
    eyebrow: "text-rose-700/80",
    em: "text-rose-700",
    statBg: "bg-rose-50/40",
    bullet: "text-rose-600",
    pill: "bg-rose-100 text-rose-700 border-rose-200",
    softBorder: "border-l-rose-500",
    softFrom: "from-rose-500/[0.08]",
  },
  teal: {
    eyebrow: "text-teal-700/80",
    em: "text-teal-700",
    statBg: "bg-teal-50/40",
    bullet: "text-teal-600",
    pill: "bg-teal-100 text-teal-700 border-teal-200",
    softBorder: "border-l-teal-500",
    softFrom: "from-teal-500/[0.08]",
  },
  indigo: {
    eyebrow: "text-indigo-700/80",
    em: "text-indigo-700",
    statBg: "bg-indigo-50/40",
    bullet: "text-indigo-600",
    pill: "bg-indigo-100 text-indigo-700 border-indigo-200",
    softBorder: "border-l-indigo-500",
    softFrom: "from-indigo-500/[0.08]",
  },
};

// Solid accent hex (Tailwind 600) for Leaflet markers, which render outside the
// Tailwind/React tree and therefore need an inline colour.
export const ACCENT_HEX: Record<AccentKey, string> = {
  emerald: "#059669",
  sky: "#0284c7",
  amber: "#d97706",
  orange: "#ea580c",
  violet: "#7c3aed",
  rose: "#e11d48",
  teal: "#0d9488",
  indigo: "#4f46e5",
};

const CaseContext = createContext<CaseData | null>(null);

export function useCase(): CaseData {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used within a CaseProvider");
  return ctx;
}

export function useAccentUI(): AccentClasses {
  return ACCENT_UI[useCase().accent];
}

// Build a self-contained ProjectDef from a case's data. The Wrapper closes over
// the data and exposes it to the four shared views through context.
export function makeCaseProject(data: CaseData): ProjectDef {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <CaseContext.Provider value={data}>{children}</CaseContext.Provider>
  );
  Wrapper.displayName = `CaseProvider(${data.id})`;

  // Derive the hub-card headline economics and risk-adjusted grade from the
  // case's financial model: the all-in project cost, the levered (equity) IRR,
  // and the blended IRR / development-risk / operational-risk scorecard.
  let economics: ProjectEconomics | undefined;
  let score: ProjectScore | undefined;
  if (data.model) {
    const r = computeModel(data.model);
    economics = { totalCost: fmtMoney(r.totalCost), irr: fmtPct(r.equityIrr) };
    const sc = scoreCase(r, data.risks, data.model.operationalRisk);
    score = { composite: Math.round(sc.composite), grade: sc.grade, verdict: sc.verdict };
  }

  return {
    id: data.id,
    name: data.name,
    shortName: data.shortName,
    location: data.location,
    tagline: data.tagline,
    stage: data.stage,
    status: data.status,
    accent: data.accent,
    sidebarBg: data.sidebarBg,
    cover: data.cover,
    kpis: data.kpis,
    economics,
    score,
    nav: [
      { key: "overview", label: "Overview", icon: LayoutDashboard, component: CaseOverview },
      { key: "property", label: "Property & Location", icon: MapPin, component: CaseProperty },
      { key: "valuation", label: "Valuation", icon: Calculator, component: CaseAnalysis },
      { key: "financials", label: "Financials", icon: Coins, component: CaseFinancials },
      { key: "dd", label: "Due Diligence", icon: ShieldAlert, component: CaseRisks },
    ],
    Wrapper,
  };
}
