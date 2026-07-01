import type { CaseData } from "../types";

// Source: "Εμπορικό Κτίριο Κορίνθου 380, Πάτρα" opportunity teaser.
export const patras: CaseData = {
  id: "case-patras",
  name: "Korinthou 380 — Patras",
  shortName: "Korinthou 380",
  location: "Patras · rail & port",
  tagline:
    "An unfinished 5,453 m² commercial frame steps from the Patras rail station and port — a conversion play into 58–62 student / professional apartments.",
  stage: "Acquisition study",
  status: "First-pass review — positive subject to completion costing.",
  accent: "indigo",
  sidebarBg: "#161a33",
  heroGradient: ["#161a33", "#1e2150", "#4338ca"],
  cover: "/cases/patras-cover.jpg",

  kpis: [
    { label: "Asking price", value: "€3.4M" },
    { label: "Building area", value: "5,453 m²" },
    { label: "Status", value: "Unfinished" },
    { label: "Conversion", value: "58–62 apts" },
  ],

  assetType: "Commercial — Unfinished",
  price: "€3,400,000",
  summary: [
    "An unfinished commercial building — a completed concrete skeleton — at Korinthou 380 in Patras, 250 m from the railway station and 1 km from the port. The structure totals 5,453 m² (3,560 m² above ground plus a 1,593 m² basement) on a 2,951 m² plot.",
    "At €3.4M the asking price is €624/m² of built area. Completing the shell is estimated at €4–6M, bringing all-in investment to €7.4–9.4M for a potential 58–62 apartments — a basis of roughly €120–160k per unit.",
    "The recommendation is positive with conditions: the most credible route to value is converting the frame into student or young-professional housing, leveraging the rail-and-port location. The wide completion-cost range is the key variable to pin down.",
  ],
  recommendation: {
    verdict: "Positive — subject to costing",
    detail:
      "A well-located unfinished frame with a clear conversion-to-housing thesis. Pin down the €4–6M completion cost and the apartment yield before underwriting; the rail/port location supports rental demand.",
  },
  highlights: [
    "5,453 m² unfinished frame at €624/m² — below completed values",
    "250 m to the rail station, 1 km to the port",
    "Conversion potential of 58–62 apartments",
    "Student / young-professional housing thesis",
  ],
  gallery: [
    { src: "/cases/patras-cover.jpg", caption: "Unfinished building — street frontage on Korinthou." },
    { src: "/cases/patras-2.jpg", caption: "Interior — concrete skeleton / frame." },
  ],

  address: "Korinthou 380, Patras",
  coords: { lat: 38.246, lon: 21.736, approximate: true },
  mapsLink: "https://maps.app.goo.gl/qN3Kn5VQt3qVe6198",
  facts: [
    { label: "Total building", value: "5,453 m²" },
    { label: "Plot area", value: "2,951 m²" },
    { label: "Above ground", value: "3,560 m²" },
    { label: "Basement", value: "1,593 m²" },
    { label: "Status", value: "Unfinished", note: "skeleton / frame" },
    { label: "Use", value: "Commercial / mixed" },
    { label: "Rail station", value: "250 m" },
    { label: "Port", value: "1 km" },
  ],

  pricing: [
    { label: "Price / building m²", value: "€624", note: "as-is shell" },
    { label: "Completion capex", value: "€4–6M", note: "estimate" },
    { label: "All-in investment", value: "€7.4–9.4M" },
  ],
  buildability: {
    intro:
      "The unfinished frame can be completed and converted to residential — the teaser estimates 58–62 apartments aimed at student and young-professional demand.",
    facts: [
      { label: "Conversion potential", value: "58–62 apts" },
      { label: "Above-ground GFA", value: "3,560 m²" },
      { label: "Basement", value: "1,593 m²" },
    ],
    uses: ["Student housing", "Young-professional housing", "Commercial / mixed"],
  },
  financials: {
    note: "Completion and conversion estimates from the teaser — wide ranges, to be costed.",
    lines: [
      { label: "Asking price", value: "€3,400,000" },
      { label: "Price / m²", value: "€624" },
      { label: "Completion capex (est.)", value: "€4–6M" },
      { label: "Total investment", value: "€7.4–9.4M" },
    ],
    scenario: {
      title: "Conversion to housing",
      lines: [
        { label: "Apartments (potential)", value: "58–62" },
        { label: "Total investment", value: "€7.4–9.4M" },
        { label: "Per apartment (all-in)", value: "≈€120–160k" },
      ],
      conclusion:
        "Completing the shell as student / young-professional housing — 250 m from the rail station and 1 km from the port — is the route to value; the capex range is wide and must be costed before underwriting.",
    },
  },

  risks: [
    {
      title: "Completion-cost uncertainty",
      category: "Cost",
      severity: "high",
      status: "open",
      mitigation:
        "The €4–6M completion range is wide — a full bill of quantities is needed before the deal can be underwritten.",
    },
    {
      title: "Structural integrity of the frame",
      category: "Technical",
      severity: "high",
      status: "open",
      mitigation:
        "Verify the unfinished skeleton's condition, permit status and that it can be completed to current code.",
    },
    {
      title: "Change-of-use approval",
      category: "Planning",
      severity: "medium",
      status: "open",
      mitigation:
        "Conversion from commercial to residential needs planning approval — confirm feasibility early.",
    },
    {
      title: "Absorption & rental demand",
      category: "Market",
      severity: "medium",
      status: "open",
      mitigation:
        "Test student and young-professional rental demand and achievable rents in Patras.",
    },
  ],
  dueDiligence: [
    {
      title: "Structural & permit review",
      detail:
        "Inspect the frame, confirm the building-permit status and code compliance for completion.",
    },
    {
      title: "Detailed completion costing",
      detail:
        "Produce a bill of quantities to replace the €4–6M estimate with a firm completion budget.",
    },
    {
      title: "Change-of-use feasibility",
      detail: "Confirm the planning route to convert the commercial frame to residential.",
    },
  ],
  nextSteps: [
    "Legal & building-permit review",
    "Detailed completion costing (bill of quantities)",
    "Architectural conversion study (58–62 units)",
  ],
};
