import type { CaseData } from "../types";

// Source: "Οικόπεδο Ασκληπιού 23-25, Μεταμόρφωση" opportunity teaser (28.05.2026).
// Thinnest of the set — a two-page teaser with no investment-thesis slide.
export const metamorfosi: CaseData = {
  id: "case-metamorfosi",
  name: "Asklipiou 23-25 Plot",
  shortName: "Asklipiou Plot",
  location: "Metamorfosi, Athens",
  tagline:
    "A vacant, unencumbered 2,695 m² residential plot in northern Athens with ≈3,234 m² of buildable rights under pure-residential zoning.",
  stage: "Acquisition study",
  status: "First-pass review — teaser is brief; parameters to be confirmed.",
  accent: "teal",
  sidebarBg: "#0d2422",
  heroGradient: ["#0d2422", "#134e4a", "#0f766e"],
  cover: "/cases/metamorfosi-cover.jpg",

  kpis: [
    { label: "Asking price", value: "€1.8M" },
    { label: "Plot area", value: "2,695 m²" },
    { label: "Building ratio", value: "Σ.Δ. 1.20" },
    { label: "Buildable", value: "≈3,234 m²" },
  ],

  assetType: "Residential plot",
  price: "€1,800,000",
  summary: [
    "An undeveloped, unencumbered 2,695 m² plot at Asklipiou 23-25 in Metamorfosi, northern Athens, zoned for pure residential use (Αμιγής κατοικία). A building ratio of Σ.Δ. 1.20 with ~40% coverage and a 14–17 m height limit supports roughly 3,234 m² of residential buildable area.",
    "At €1.8M the plot is priced at €668/m² of land and €557/m² of buildable area. The teaser is a short two-page summary, so the figures are indicative and the residential-development case rests on confirming the planning parameters and local sales values.",
    "A clean, vacant residential plot of this scale is straightforward to underwrite, but warrants the standard legal, topographic and architectural confirmation before pricing.",
  ],
  recommendation: {
    verdict: "Worth a closer look",
    detail:
      "A clean vacant residential plot at a moderate €557/m² of buildable area. The teaser is thin — confirm the Σ.Δ. 1.20 envelope, title and local residential values before forming a bid.",
  },
  highlights: [
    "Vacant, unencumbered 2,695 m² residential plot",
    "Σ.Δ. 1.20 + ~40% coverage → ≈3,234 m² buildable",
    "Pure-residential zoning (Αμιγής κατοικία), 14–17 m height",
    "€557/m² of buildable area at the asking price",
  ],
  gallery: [
    { src: "/cases/metamorfosi-aerial.jpg", caption: "Cadastral aerial — plot outline at Asklipiou 23-25." },
  ],

  address: "Asklipiou 23-25, 144 52 Metamorfosi",
  coords: { lat: 38.063, lon: 23.762, approximate: true },
  mapsLink: "https://maps.app.goo.gl/qSwqudb2QvhEmhrF9",
  facts: [
    { label: "Plot area", value: "2,695 m²" },
    { label: "Building ratio", value: "Σ.Δ. 1.20" },
    { label: "Coverage", value: "~40%" },
    { label: "Max height", value: "14–17 m" },
    { label: "Status", value: "Vacant", note: "undeveloped, free" },
    { label: "Use zone", value: "Pure residential", note: "Αμιγής κατοικία" },
  ],
  kaek: [{ code: "050940907016", area: "2,695 m²", note: "Plot" }],

  pricing: [
    { label: "Price / plot m²", value: "€668", note: "land basis" },
    { label: "Price / buildable m²", value: "€557", note: "at Σ.Δ. 1.20" },
  ],
  buildability: {
    intro:
      "At Σ.Δ. 1.20 with ~40% coverage and a 14–17 m height limit, the plot supports roughly 3,234 m² of residential building.",
    facts: [
      { label: "Total buildable", value: "≈3,234 m²", note: "at Σ.Δ. 1.20" },
      { label: "Coverage", value: "~40%" },
      { label: "Max height", value: "14–17 m" },
    ],
    uses: ["Pure residential (Αμιγής κατοικία)"],
  },

  risks: [
    {
      title: "Thin teaser — unverified parameters",
      category: "Information",
      severity: "medium",
      status: "open",
      mitigation:
        "The two-page summary lacks detail — confirm Σ.Δ. 1.20, coverage and height against the current city plan.",
    },
    {
      title: "Residential sales values",
      category: "Market",
      severity: "medium",
      status: "open",
      mitigation: "Underwrite achievable €/m² for new residential in Metamorfosi before pricing.",
    },
    {
      title: "Title & encumbrances",
      category: "Title",
      severity: "low",
      status: "open",
      mitigation: "Confirm the plot is free of liens and claims, as stated in the teaser.",
    },
    {
      title: "Ground & access",
      category: "Technical",
      severity: "low",
      status: "open",
      mitigation: "Standard geotechnical and access checks for a vacant plot.",
    },
  ],
  dueDiligence: [
    {
      title: "Planning parameters",
      detail: "Confirm Σ.Δ. 1.20, ~40% coverage and 14–17 m height for KAEK 050940907016.",
    },
    {
      title: "Clean title",
      detail: "Verify the plot is unencumbered and the 2,695 m² area is as registered.",
    },
    {
      title: "Residential comparables",
      detail: "Gather local new-build sales evidence to test the €557/m² buildable basis.",
    },
  ],
  nextSteps: [
    "Legal title review",
    "Topographic survey",
    "Confirm the planning envelope against the city plan",
    "Residential market study for Metamorfosi",
  ],
};
