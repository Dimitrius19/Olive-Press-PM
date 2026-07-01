import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Accent palette keys. Each maps to a concrete set of Tailwind classes inside
// the Sidebar (kept there so the literal class strings are scanned by the JIT).
export type AccentKey =
  | "emerald"
  | "sky"
  | "amber"
  | "orange"
  | "violet"
  | "rose"
  | "teal"
  | "indigo";

export interface ProjectNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

export interface ProjectKpi {
  label: string;
  value: string;
}

// Headline economics surfaced on the portfolio hub card. Pre-formatted strings
// so each project can source them from its own model (the case engine, the hotel
// scenario model, or the build-sell model) without the card knowing the details.
export interface ProjectEconomics {
  totalCost: string; // all-in project cost, e.g. "€45.20M"
  irr: string; // headline IRR, e.g. "17.1%"
}

// Risk-adjusted grade surfaced on the hub card. Blends the modelled IRR,
// development risk (the risk register) and operational risk into a single
// 0–100 composite and an A–D grade — see scoreCase() in cases/model.ts. Only
// the opportunity cases carry this; the flagships use return conventions the
// scorecard's IRR band isn't calibrated for, so they leave it undefined.
export interface ProjectScore {
  composite: number; // 0–100, rounded
  grade: string; // A / B / C / D
  verdict: string; // one-line risk-adjusted read (badge tooltip)
}

// A project is a self-contained workspace: its own brand, theme, headline KPIs
// for the portfolio card, navigation set, and an optional state Wrapper (e.g.
// the CAPEX provider that links the Ellinikon Villa build-up to its cost plan).
export interface ProjectDef {
  id: string;
  name: string;
  shortName: string;
  location: string;
  tagline: string;
  stage: string;
  status: string;
  accent: AccentKey;
  sidebarBg: string; // hex, applied via inline style
  cover: string; // image path in /public
  logo?: string;
  kpis: ProjectKpi[];
  economics?: ProjectEconomics; // headline total cost + IRR for the hub card
  score?: ProjectScore; // risk-adjusted grade for the hub card (cases only)
  nav: ProjectNavItem[];
  Wrapper?: ComponentType<{ children: ReactNode }>;
}
