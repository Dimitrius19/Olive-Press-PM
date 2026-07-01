import type { CaseData } from "../types";

// Source: "HBH Πειραιώς 64, Νέο Φάληρο" opportunity teaser (ΜΠΛΕ ΚΕΔΡΟΣ ΑΕΕΑΠ).
// All figures as stated in the brochure; coordinates approximated from address.
export const hbh: CaseData = {
  id: "case-hbh",
  name: "HBH — Piraeus 64",
  shortName: "HBH Piraeus 64",
  location: "Neo Faliro, Piraeus",
  tagline:
    "A landmark preserved industrial site on the Athens–Piraeus axis — 7,182 m² of land carrying 18,674 m² of buildable rights across a broad use envelope.",
  stage: "Acquisition study",
  status: "First-pass review — figures from the teaser, pending diligence.",
  accent: "orange",
  sidebarBg: "#241a12",
  heroGradient: ["#241a12", "#3a2718", "#b45309"],
  cover: "/cases/hbh-cover.jpg",

  kpis: [
    { label: "Asking price", value: "€8.0M" },
    { label: "Plot area", value: "7,182 m²" },
    { label: "Building ratio", value: "Σ.Δ. 2.60" },
    { label: "Buildable", value: "18,674 m²" },
  ],

  assetType: "Industrial — Preserved",
  price: "€8,000,000",
  summary: [
    "A landmark industrial site on the Athens–Piraeus axis at Neo Faliro: a 7,182 m² plot carrying 2,787 m² of preserved former-factory buildings — including the signature chimney and historic 'HBH' signage — with a building ratio (Σ.Δ.) of 2.60 that unlocks 18,674 m² of total buildable area.",
    "After accounting for the preserved volumes, roughly 15,887 m² of new build remains available across a broad permitted-use envelope spanning hotel, residence, offices, food & beverage, recreation and culture. At €8.0M the plot is priced at €1,114/m² of land and just €428/m² of total buildable area.",
    "The asset trades on its rarity — a large, centrally-located redevelopment canvas with a protected industrial identity — but its value turns on resolving the preserved-building constraints, the 10 m protection zone, and a 2025 cadastral correction that carved a 1,205 m² road strip into the public domain.",
  ],
  recommendation: {
    verdict: "Positive — proceed with conditions",
    detail:
      "Attractive redevelopment scale and location. Advance to legal, topographic and architectural diligence to fix the preserved-area split, vehicular/fire access and the excluded road strip before pricing a bid.",
  },
  highlights: [
    "Σ.Δ. 2.60 yields 18,674 m² of buildable area on a central 7,182 m² plot",
    "Broad use envelope: hotel, residence, offices, F&B, recreation, culture",
    "Landmark preserved identity — the chimney and historic 'HBH' signage",
    "Priced at just €428/m² of total buildable area",
  ],
  gallery: [
    { src: "/cases/hbh-frontage.jpg", caption: "Industrial buildings — frontage and surroundings." },
    { src: "/cases/hbh-warehouse.jpg", caption: "Preserved warehouse volume." },
    { src: "/cases/hbh-sign.jpg", caption: "Stone frontage with the historic 'HBH' sign." },
  ],

  address: "Piraeus (Πειραιώς) 64, Neo Faliro, Piraeus",
  coords: { lat: 37.945, lon: 23.667, approximate: true },
  mapsLink: "https://maps.google.com/?q=Πειραιώς+64,+Νέο+Φάληρο",
  facts: [
    { label: "Plot area", value: "7,182.23 m²" },
    { label: "Preserved buildings", value: "2,787 m²", note: "διατηρητέα (1997)" },
    { label: "Building ratio", value: "Σ.Δ. 2.60" },
    { label: "Protection zone", value: "10 m", note: "around preserved volumes" },
    { label: "Frontage axis", value: "Athinon–Pireos", note: "Λεωφ. Αθηνών–Πειραιώς" },
    { label: "Side access", value: "Emmanouilidi · A. Mourati" },
  ],
  kaek: [
    { code: "051164106001", area: "7,182.23 m²", note: "Main plot — private (subject of sale)" },
    {
      code: "05116ΕΚ00051",
      area: "1,205.50 m²",
      note: "Shared road strip — reassigned to the public domain (2025), excluded from the sale",
    },
  ],
  feks: [
    {
      ref: "ΦΕΚ Δ' 871",
      date: "02.12.2021",
      summary:
        "Sets the permitted uses, building ratio Σ.Δ. 2.60 and the 10 m protection zone; abolishes the 2015 'care-space' (κοινόχρηστος χώρος) regime.",
    },
    {
      ref: "ΑΑΠ 17",
      date: "22.01.2015",
      summary:
        "Earlier regime designating part of the site as care / communal space — superseded by the 2021 decree.",
    },
    {
      ref: "ΦΕΚ Δ' 267",
      date: "07.04.1997",
      summary: "Lists the HBH buildings as preserved (διατηρητέα).",
    },
    {
      ref: "ΔΓΜ ΚΗΔ 3128731",
      date: "20.10.2025",
      summary:
        "Cadastral correction reassigning the 1,205.50 m² road strip to public KAEK 05116ΕΚ00051.",
    },
  ],
  legalNote:
    "Preserved-building status (1997) constrains demolition; the 10 m protection zone and the 2025 strip reassignment must both be reflected in any massing study.",

  pricing: [
    { label: "Price / plot m²", value: "€1,114", note: "land basis" },
    { label: "Price / buildable m²", value: "€428", note: "total Σ.Δ. area" },
    { label: "Price / new-build m²", value: "€504", note: "excl. preserved" },
  ],
  buildability: {
    intro:
      "At Σ.Δ. 2.60 the plot carries 18,674 m² of total buildable area; the preserved volumes consume 2,787 m², leaving the balance for new construction.",
    facts: [
      { label: "Total buildable", value: "18,674 m²", note: "at Σ.Δ. 2.60" },
      { label: "Existing preserved", value: "2,787 m²" },
      { label: "Remaining new build", value: "≈15,887 m²" },
    ],
    uses: ["Hotel", "Residence", "Offices", "Food & beverage", "Recreation", "Culture"],
  },

  risks: [
    {
      title: "Preserved-building constraints & restoration liability",
      category: "Heritage / planning",
      severity: "high",
      status: "open",
      mitigation:
        "Commission a conservation architect; quantify the exact preserved m² and the split between the private and public KAEK before committing.",
    },
    {
      title: "Cadastral strip reassigned to public domain",
      category: "Title / cadastre",
      severity: "medium",
      status: "mitigating",
      mitigation:
        "The 1,205.50 m² road strip moved to a public KAEK in Oct 2025 — confirm it is fully excluded from the sale and carries no restoration cost.",
    },
    {
      title: "Vehicular & fire access from side streets",
      category: "Access",
      severity: "medium",
      status: "open",
      mitigation:
        "Verify legal access and fire-brigade route/turning from Emmanouilidi and A. Mourati for a hotel programme.",
    },
    {
      title: "Optimal use under the Σ.Δ. envelope",
      category: "Market",
      severity: "low",
      status: "open",
      mitigation:
        "Permitted uses are broad — test which (hotel vs residential vs offices) maximises value at Σ.Δ. 2.60.",
    },
  ],
  dueDiligence: [
    {
      title: "Exact preserved area & ownership split",
      detail:
        "Reconcile the 2,787 m² of preserved volume against the private (051164106001) and public (05116ΕΚ00051) KAEK to fix precisely what is sold.",
    },
    {
      title: "Fire & vehicular access route",
      detail:
        "Verify legal access and fire-brigade route from Emmanouilidi and A. Mourati for a hotel use.",
    },
    {
      title: "Restoration liability across the strip",
      detail:
        "Establish who bears restoration cost on the reassigned road strip and whether it affects the preserved frontage.",
    },
  ],
  nextSteps: [
    "Legal title & planning review (preserved status, uses, the excluded strip)",
    "Topographic survey to confirm plot boundaries and the public-domain carve-out",
    "Architectural massing & conservation study to size the developable envelope",
  ],
};
