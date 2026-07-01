import type { CaseData } from "../types";

// Source: "RoboPark — Αβέρωφ 17, Αθήνα" opportunity teaser (dated 27.05.2026).
export const robopark: CaseData = {
  id: "case-robopark",
  name: "RoboPark — Averof 17",
  shortName: "RoboPark Averof 17",
  location: "Victoria Square, Athens",
  tagline:
    "A 230-space automated mechanical parking garage beside Victoria Square and the National Archaeological Museum — an income asset offered below replacement.",
  stage: "Acquisition study",
  status: "First-pass review — recommend renegotiation toward ≈€3.45M.",
  accent: "rose",
  sidebarBg: "#2a1320",
  heroGradient: ["#2a1320", "#43182c", "#be123c"],
  cover: "/cases/robopark-cover.jpg",

  kpis: [
    { label: "Asking price", value: "€3.75M" },
    { label: "Building area", value: "5,061 m²" },
    { label: "Capacity", value: "230 spaces" },
    { label: "Built", value: "2000" },
  ],

  assetType: "Automated garage",
  price: "€3,750,000",
  summary: [
    "An automated mechanical parking garage at Averof 17, beside Victoria Square and the National Archaeological Museum in central Athens. Built in 2000, the building totals 5,060.79 m² (4,543.25 m² above ground plus a 517.54 m² basement) on a 747 m² plot and operates 230 spaces.",
    "At €3.75M the asking price implies €741/m². A rooftop antenna lease contributes €14,000/yr but rolls off in August 2028, and the teaser notes roughly €250,000 of expenses. An indicative buyer offer of €3.2M (≈€632/m²) sits below asking.",
    "The recommendation is to proceed selectively and renegotiate toward ~€3.45M, reflecting the single-use mechanical plant, its age and the expiring antenna income — subject to technical and legal verification of the structure and licences.",
  ],
  recommendation: {
    verdict: "Positive — renegotiate to ≈€3.45M",
    detail:
      "A sound central asset, but the single-use automated plant, building age and expiring antenna lease justify a price below asking. Verify structure and licences, then anchor the offer near €3.45M.",
  },
  highlights: [
    "230-space automated mechanical garage built in 2000",
    "Prime central location by Victoria Square & the National Archaeological Museum",
    "Roof-antenna lease adds €14,000/yr until 08/2028",
    "Offer at €3.2M implies ≈€632/m² vs €741/m² asking",
  ],
  gallery: [
    { src: "/cases/robopark-interior.jpg", caption: "Interior — red columns and structural reinforcements." },
    { src: "/cases/robopark-map.jpg", caption: "Location — Averof 17, near Victoria Square." },
  ],

  address: "Averof 17, 104 33 Athens (Victoria Square)",
  coords: { lat: 37.992, lon: 23.73, approximate: true },
  facts: [
    { label: "Total building", value: "5,060.79 m²" },
    { label: "Plot area", value: "747.00 m²" },
    { label: "Above ground", value: "4,543.25 m²" },
    { label: "Basement", value: "517.54 m²" },
    { label: "Year built", value: "2000" },
    { label: "Capacity", value: "230 spaces", note: "automatic mechanical" },
  ],

  pricing: [
    { label: "Price / building m²", value: "€741", note: "at asking" },
    { label: "Offer / building m²", value: "€632", note: "at €3.2M offer" },
    { label: "Antenna income", value: "€14,000/yr", note: "lease expires 08/2028" },
  ],
  financials: {
    note: "Operating figures as stated in the teaser — to be verified in diligence.",
    lines: [
      { label: "Asking price", value: "€3,750,000" },
      { label: "Roof-antenna rent", value: "€14,000 / yr" },
      { label: "Stated expenses", value: "€250,000" },
      { label: "Indicative buyer offer", value: "€3,200,000" },
    ],
    scenario: {
      title: "Renegotiation target",
      lines: [
        { label: "Asking", value: "€3,750,000" },
        { label: "Buyer offer", value: "€3,200,000" },
        { label: "Recommended target", value: "≈€3,450,000" },
      ],
      conclusion:
        "A negotiated price around €3.45M (≈€682/m²) better reflects the single-use, ageing mechanical plant and the antenna lease rolling off in 2028.",
    },
  },

  risks: [
    {
      title: "Single-use automated mechanical plant",
      category: "Technical",
      severity: "high",
      status: "open",
      mitigation:
        "The 230-space automated system is capital-intensive and specialised — verify condition, maintenance contracts and remaining useful life.",
    },
    {
      title: "Antenna income expires in 2028",
      category: "Income",
      severity: "medium",
      status: "mitigating",
      mitigation:
        "The €14,000/yr rooftop lease rolls off in 08/2028 — do not capitalise it beyond the term.",
    },
    {
      title: "Stated operating expenses",
      category: "Financial",
      severity: "medium",
      status: "open",
      mitigation:
        "Confirm the nature and recurrence of the €250,000 expense figure quoted in the teaser.",
    },
    {
      title: "Repurposing optionality",
      category: "Market",
      severity: "low",
      status: "open",
      mitigation:
        "Assess whether the structure can convert to other uses if demand for automated parking softens.",
    },
  ],
  dueDiligence: [
    {
      title: "Mechanical system condition",
      detail: "Inspect the automated garage plant, maintenance records and remaining useful life.",
    },
    {
      title: "Licences & operating permits",
      detail: "Verify the garage operating licence and fire / safety certifications.",
    },
    {
      title: "Antenna lease terms",
      detail: "Review the rooftop lease and confirm the 08/2028 expiry and any renewal options.",
    },
  ],
  nextSteps: [
    "Technical & legal due diligence on the structure and licences",
    "Independent valuation of the income and the building",
    "Submit / renegotiate the offer near €3.45M",
  ],
};
