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
  nav: ProjectNavItem[];
  Wrapper?: ComponentType<{ children: ReactNode }>;
}
