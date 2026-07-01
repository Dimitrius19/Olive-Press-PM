import type { CaseData } from "../types";

// Source: "Μαυρομιχάλη 12 & Γραβιάς 21Α, Πειραιάς" opportunity teaser.
// No site photograph in the teaser; the cover is a generated brand image.
export const mavromichali: CaseData = {
  id: "case-mavromichali",
  name: "Mavromichali 12 & Gravias 21A",
  shortName: "Mavromichali & Gravias",
  location: "Piraeus · port & metro",
  tagline:
    "Two adjoining corner parcels assembled into a 1,269 m² development plot minutes from Piraeus port and the metro, with a high Σ.Δ. 3.6 density.",
  stage: "Acquisition study",
  status: "First-pass review — offered subject to price negotiation.",
  accent: "violet",
  sidebarBg: "#1e1633",
  heroGradient: ["#1e1633", "#2b1f4d", "#6d28d9"],
  cover: "/cases/mavromichali-cover.jpg",

  kpis: [
    { label: "Asking price", value: "€3.3M" },
    { label: "Plot area", value: "1,269 m²" },
    { label: "Building ratio", value: "Σ.Δ. 3.6" },
    { label: "Buildable", value: "≈4,568 m²" },
  ],

  assetType: "Development plot",
  price: "€3,300,000",
  priceNote: "negotiable",
  summary: [
    "Two adjoining corner parcels — Mavromichali 12 and Gravias 21A — assembled into a single 1,268.78 m² development plot a short walk from Piraeus port and the metro. A high building ratio of Σ.Δ. 3.6 with 60% coverage and a 17.5 m height limit supports roughly 4,568 m² of buildable area over about six floors.",
    "At the €3.3M asking price (described as negotiable) the plot is priced at €2,601/m² of land and €722/m² of buildable area — a competitive basis for a central Piraeus development given the port-and-metro location.",
    "The opportunity is clean — a corner site with no preserved-building constraints — and is offered subject to price negotiation. The governing parameters come from the 1978 sector-III presidential decree and should be confirmed against the current city plan.",
  ],
  recommendation: {
    verdict: "Attractive — pursue under price negotiation",
    detail:
      "Strong location and density at a competitive €722/m² of buildable area. Open negotiations and run legal, topographic and a preliminary architectural study to confirm the ~4,568 m² envelope.",
  },
  highlights: [
    "Σ.Δ. 3.6 + 60% coverage → ≈4,568 m² over ~6 floors",
    "Corner plot, walkable to Piraeus port and metro",
    "Two assembled KAEK forming a single 1,269 m² site",
    "€722/m² of buildable area, with price stated negotiable",
  ],

  address: "Mavromichali 12 & Gravias 21A, Piraeus",
  coords: { lat: 37.948, lon: 23.643, approximate: true },
  mapsLink: "https://maps.app.goo.gl/j646Eqnf3RshpzMt8",
  facts: [
    { label: "Total plot", value: "1,268.78 m²", note: "two KAEK" },
    { label: "Building ratio", value: "Σ.Δ. 3.6" },
    { label: "Coverage", value: "60%" },
    { label: "Max height", value: "17.5 m", note: "≈6 floors" },
    { label: "Footprint / floor", value: "761.27 m²" },
    { label: "Plot type", value: "Corner" },
  ],
  kaek: [
    { code: "051162031001", area: "739.63 m²", note: "Parcel A — Mavromichali 12" },
    { code: "051162031010", area: "529.15 m²", note: "Parcel B — Gravias 21A" },
  ],
  feks: [
    {
      ref: "ΦΕΚ 359Δ / 1978",
      date: "in force 18.07.1978",
      summary:
        "Presidential decree, urban sector III (decision Γ.20130/1978, Municipality of Piraeus) — fixes Σ.Δ. 3.6, 60% coverage and the 17.5 m height limit.",
    },
  ],
  legalNote:
    "Building parameters derive from the 1978 sector-III decree; confirm they remain current and unaffected by later ΓΠΣ / city-plan revisions.",

  pricing: [
    { label: "Price / plot m²", value: "€2,601", note: "land basis" },
    { label: "Price / buildable m²", value: "€722", note: "at Σ.Δ. 3.6" },
  ],
  buildability: {
    intro:
      "At Σ.Δ. 3.6 with 60% coverage and a 17.5 m height limit, the assembled plot supports roughly 4,568 m² over about six floors.",
    facts: [
      { label: "Total buildable", value: "≈4,568 m²", note: "at Σ.Δ. 3.6" },
      { label: "Footprint / floor", value: "761.27 m²", note: "60% coverage" },
      { label: "Storeys", value: "≈6", note: "to 17.5 m" },
    ],
  },

  model: {
    mode: "development",
    years: [2026, 2027, 2028, 2029],
    landPrice: 3_300_000,
    acquisitionCostsPct: 0.05,
    landLabel: "Land (asking, negotiable)",
    construction: {
      hardCost: 7_300_000, // ≈€1,600/m² over 4,568 m²
      softCostsPct: 0.12,
      contingencyPct: 0.08,
      schedule: [0, 0.55, 0.45, 0],
      label: "Build all-in (hard + soft + contingency)",
    },
    sale: {
      saleableArea: 4_568,
      pricePerSqm: 3_400, // central Piraeus new-build, walkable to port & metro
      sellingCostsPct: 0.03,
      schedule: [0, 0, 0.45, 0.55],
    },
    finance: { ltcPct: 0.55, interestRate: 0.07, label: "55% LTC @ 7.0%" },
    operationalRisk: {
      rating: "low",
      score: 72,
      note: "Straightforward residential merchant-build; the only operational wrinkles are the two-parcel assembly and corner-setback massing — no ongoing asset to run.",
    },
    note: "Illustrative merchant-build model: €3,400/m² GDV on 4,568 m², €1,600/m² all-in build, sold over 2027–28. Asking price used; the teaser notes it is negotiable.",
  },

  risks: [
    {
      title: "Price negotiation outcome",
      category: "Commercial",
      severity: "medium",
      status: "mitigating",
      mitigation:
        "Asking price is stated negotiable — secure a binding price before incurring legal and survey spend.",
    },
    {
      title: "Currency of the 1978 decree parameters",
      category: "Planning",
      severity: "medium",
      status: "open",
      mitigation:
        "Confirm Σ.Δ. 3.6 / 60% coverage / 17.5 m remain in force under the current Piraeus city plan.",
    },
    {
      title: "Two-parcel title assembly",
      category: "Title / cadastre",
      severity: "low",
      status: "open",
      mitigation:
        "Confirm both KAEK convey clean, unencumbered title and can be developed as a single unit.",
    },
    {
      title: "Corner setbacks & massing",
      category: "Design",
      severity: "low",
      status: "open",
      mitigation:
        "Validate the 761.27 m²/floor footprint and ~6-floor massing against setback and corner rules.",
    },
  ],
  dueDiligence: [
    {
      title: "Decree currency",
      detail:
        "Verify the 1978 sector-III parameters against the latest ΓΠΣ / city plan for the area.",
    },
    {
      title: "Title on both KAEK",
      detail: "Confirm clean, unencumbered title on 051162031001 and 051162031010.",
    },
    {
      title: "Buildable envelope",
      detail:
        "Preliminary architectural test of 761.27 m²/floor across ~6 floors within applicable setbacks.",
    },
  ],
  nextSteps: [
    "Open price negotiation and agree a binding figure",
    "Legal title review across both KAEK",
    "Topographic survey of the assembled corner plot",
    "Preliminary architectural study of the ~4,568 m² envelope",
  ],
};
