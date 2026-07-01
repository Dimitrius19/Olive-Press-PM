import type { AccentKey } from "../types";

// One acquisition "opportunity case" (teaser) modelled as data. Each becomes a
// self-contained project workspace via makeCaseProject(). Fields map onto the
// four shared views: Overview, Property, Valuation and Due Diligence.

export interface CaseKpi {
  label: string;
  value: string;
}

export interface CaseFact {
  label: string;
  value: string;
  note?: string;
}

export interface CaseRow {
  label: string;
  value: string;
}

export interface CaseGalleryItem {
  src: string;
  caption: string;
}

export interface CaseKaek {
  code: string;
  area?: string;
  note?: string;
}

// Greek urban-planning / legal instrument (ΦΕΚ, ministerial decision, decree).
export interface CaseFek {
  ref: string;
  date?: string;
  summary: string;
}

export interface CaseRisk {
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  status: "open" | "mitigating" | "resolved";
  mitigation: string;
}

export interface CaseDueDiligence {
  title: string;
  detail: string;
}

export interface CaseFinancials {
  note?: string;
  lines: CaseRow[];
  scenario?: {
    title: string;
    lines: CaseRow[];
    conclusion?: string;
  };
}

export interface CaseBuildability {
  intro?: string;
  facts: CaseFact[];
  uses?: string[];
}

export interface CaseData {
  // ── Identity & theme ──
  id: string;
  name: string;
  shortName: string;
  location: string;
  tagline: string;
  stage: string;
  status: string;
  accent: AccentKey;
  sidebarBg: string; // hex
  heroGradient: [string, string, string]; // hex stops, dark → accent
  cover: string; // /public path

  kpis: CaseKpi[];

  // ── Overview / investment thesis ──
  assetType: string; // e.g. "Industrial — Preserved"
  price: string; // headline asking price
  priceNote?: string; // e.g. "negotiable"
  summary: string[]; // thesis paragraphs
  recommendation: { verdict: string; detail: string };
  highlights?: string[];
  gallery?: CaseGalleryItem[];

  // ── Property & location ──
  address: string;
  coords: { lat: number; lon: number; approximate?: boolean };
  mapsLink?: string;
  mapImage?: string; // fallback exhibit when no live coordinates
  facts: CaseFact[];
  kaek?: CaseKaek[];
  feks?: CaseFek[];
  legalNote?: string;

  // ── Valuation & analysis ──
  pricing: CaseFact[]; // €/m² metrics
  buildability?: CaseBuildability;
  financials?: CaseFinancials;

  // ── Risk & due diligence ──
  risks: CaseRisk[];
  dueDiligence?: CaseDueDiligence[];
  nextSteps?: string[];
}
