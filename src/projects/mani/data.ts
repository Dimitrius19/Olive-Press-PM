// Mavromichali Estate — project fundamentals
// All figures extracted from the source documents (purchase deed #6397,
// "Mavro Detailed Brochure 110326", and "Mavromichali_Gytheio_290526").
// Financial figures are marked DRAFT — the brochure tables are watermarked
// "TBC - NS NEW NUMBERS".

export const project = {
  name: "Mavromichali Estate",
  location: "Gytheio · Mani · Peloponnese, Greece",
  tagline:
    "A historic family estate on the Mani coast, proposed as a 5-star agro-tourism farm-hotel and working agricultural operation.",
  concept:
    "5-star agro-tourism “farm-hotel” + agricultural operation. Owner seeking a new 49% equity partner alongside EU / ESPA grant funding.",
  benchmark: "Domaine de Murtoli, Corsica",
  status: "Pre-investment study — figures are draft and subject to due diligence.",
};

export interface Kpi {
  label: string;
  value: string;
  unit: string;
  note: string;
}

export const kpis: Kpi[] = [
  { label: "Land area", value: "547,000 – 911,000", unit: "m²", note: "figure differs between document versions" },
  { label: "Planned keys", value: "52", unit: "rooms", note: "towers, farmhouses & studios" },
  { label: "Development capex", value: "€22.72M", unit: "draft", note: "50% ESPA grant + 50% equity" },
  { label: "Equity stake offered", value: "49%", unit: "to new partner", note: "existing owner retains 51%" },
];

export const location = {
  address:
    "Charakoelies, Passava area, Gytheio · Municipality of East Mani, Laconia, Peloponnese",
  setting:
    "Western coast of the Laconian Gulf, with views to the Taygetos mountains (peak 2,407 m).",
  distances: [
    { place: "Gytheio town", km: "3.4 km", time: "6 min" },
    { place: "Port of Gytheio", km: "6.9 km", time: "12 min" },
    { place: "Sparta", km: "40 km", time: "35 min" },
    { place: "Kalamata airport", km: "108 km", time: "2 h" },
    { place: "Olympia", km: "190 km", time: "2 h 25" },
    { place: "Athens", km: "277.5 km", time: "3 h" },
  ],
};

// Coordinates derived from the official topographic plan (ΕΓΣΑ87 parcel
// vertices, θέση "Πασσαβάς Αγίου Βασιλείου", Δ. Γυθείου, Sept 2014),
// converted to WGS84. Accurate to the estate footprint.
export const geo = {
  estate: {
    lat: 36.7615,
    lon: 22.5335,
    label: "Mavromichali Estate",
    sublabel: "Θέση «Πασσαβάς», Αγ. Βασιλείου, Δ. Γυθείου, Λακωνίας",
    coordText: "36°45′41″N, 22°32′01″E",
  },
  zoom: 14,
  references: [
    { name: "Gytheio town", lat: 36.76, lon: 22.566, note: "3.4 km" },
    { name: "Port of Gytheio", lat: 36.7556, lon: 22.5704, note: "6.9 km" },
  ],
  fromAthens: {
    city: "Athens",
    lat: 37.9838,
    lon: 23.7275,
    road: "277.5 km",
    drive: "≈ 3 h drive",
    straight: "≈ 172 km straight-line",
  },
};

export const land = {
  areaVersions: [
    {
      source: "Detailed brochure (11 Mar 2026)",
      total: "911,000 m²",
      breakdown: [
        "Phase A — core estate: 671,737 m²",
        "Phase B — adjoining land: 239,238 m² (incl. ~239,000 m² forest)",
      ],
    },
    {
      source: "Investor presentation (29 May 2026)",
      total: "~547,000 m²",
      breakdown: [
        "Phase A only (“our land”): 546,730 m²",
        "Phase B / financial tables removed in this version",
      ],
    },
  ],
  assets: [
    "~3,000 olive trees",
    "Fig and orange trees",
    "Small abandoned vineyard",
    "Stone tower-house (dated “17th century” on covers; “late 18th century” in body text)",
  ],
};

export const history = {
  summary:
    "The estate belonged to the Mavromichali clan, one of the leading families of Mani.",
  figure:
    "Petrobey Mavromichalis — a leader of the Greek Revolution against the Ottomans, Bey (governor) of Mani, who fought at the Siege of Tripolitsa.",
};

export const concept = {
  rooms: {
    total: 52,
    breakdown: [
      { type: "Towers", units: 6, perUnit: 4, keys: 24, rate: "€120 / night" },
      { type: "Farmhouses", units: 8, perUnit: 2, keys: 16, rate: "€100 / night" },
      { type: "Studios", units: 12, perUnit: 1, keys: 12, rate: "€90 / night" },
    ],
  },
  assetValues: ["Farmhouse value: €3–5M each", "Studio value: €500k each"],
  amenities: [
    "Clubhouse", "Restaurant", "Kafeneio", "Spa", "Gym", "Cinema", "Museum",
    "Church", "Petting zoo", "Theatre", "Conference centre", "Tennis", "Pools",
    "Workshops", "Vegetable / flower / herb gardens", "Olive press",
    "Bottling & tasting cellars", "Vineyards",
  ],
  offGrid: ["Solar", "Mini wind", "Water drilling"],
  timeline: [
    "≈ 36 months construction",
    "36–60 months to full agricultural production",
  ],
};

export interface Row {
  label: string;
  value: string;
}

export const financials = {
  caveat:
    "All financial tables are watermarked “TBC – NS NEW NUMBERS” (draft) and contain internal inconsistencies between document versions. Treat as indicative only.",
  income: {
    grossAnnual: "€3,504,624",
    lines: [
      { label: "Rented accommodation", value: "€1,785,960" },
      { label: "Food & beverage", value: "€749,232" },
      { label: "Shop", value: "€515,559" },
      { label: "Recreational", value: "€343,706" },
      { label: "Farming", value: "€110,167" },
    ] as Row[],
  },
  waterfall: [
    { label: "Gross annual income", value: "€3,504,624" },
    { label: "Less operating costs / VAT (40%)", value: "→ Net 1: €2,102,775" },
    { label: "Less tax (29%) — €609,805", value: "→ Total net income: €1,492,970" },
    { label: "Implied capital value @ 8% return", value: "€18,662,125" },
    { label: "Gross capitalised value", value: "€43,807,805" },
  ] as Row[],
  assumptions: [
    "Restaurant €35 pp @ 40% usage",
    "Cafe €25 pp @ 30% usage",
    "Shop €15 / guest",
    "Recreation €10 / guest",
    "Honey: 4,500 kg/yr @ €15/kg",
    "Olive oil: 80,000 kg/yr @ €6/ltr",
  ],
  capex: {
    grandTotal: "€22,720,000",
    lines: [
      { label: "Hospitality", value: "€17,350,000", detail: "Building ~€13.8M · Equipment €2.7M · Ops €0.85M" },
      { label: "Agricultural", value: "€4,200,000", detail: "" },
      { label: "Infrastructure", value: "€1,170,000", detail: "" },
    ],
    funding: [
      "50% ESPA / EU grant — €11,360,000",
      "50% equity — €11,360,000",
    ],
  },
  valuation: {
    note: "Second, separate valuation table — inconsistent with the income table above.",
    lines: [
      { label: "Hospitality core revenue", value: "€2.85M" },
      { label: "Hospitality periphery revenue", value: "€3.25M" },
      { label: "Agricultural revenue", value: "€3.15M" },
      { label: "Total revenue stream", value: "€9.25M" },
      { label: "Capitalised @ 6%", value: "€154.17M" },
      { label: "End valuation (stated “SAY”)", value: "€150,000,000" },
      { label: "Value now (stated)", value: "€75,000,000" },
    ] as Row[],
    split: [
      { label: "Shareholder 1 (existing) — 51%", value: "€38.25M" },
      { label: "Shareholder 2 (NEW) — 49%", value: "€36.75M" },
      { label: "Adjoining land", value: "€5,000,000" },
    ] as Row[],
  },
};

export const ownership = {
  deed: "Purchase deed #6397 — signed Mykonos, 4 April 2016",
  condition: "Sale made “με διαλυτική αίρεση” (with a resolutive condition).",
  values: [
    { label: "Transaction value (2016)", value: "€2,200,000" },
    { label: "Objective (tax-assessed) value", value: "€1,430,972.11" },
  ] as Row[],
  buyer: {
    name: "WINDREM LIMITED (Cyprus SPV)",
    details: [
      "Reg. HE 336645 · ΑΦΜ 997181247",
      "Founded 3 Oct 2014",
      "Director: Kyproulla Karantoni",
      "Secretary: FIDUCITRUST SERVICES LIMITED",
      "Represented by civil engineer Antonios-Ioannis Panagopoulos",
    ],
  },
  sellers:
    "Maria Tamvakou (née Mavromichali) & Ioanna-Annita Mavromichali (family heirs).",
  parcels: [
    "Multi-parcel estate (~24 plots).",
    "Example: KAEK 300481503096/0/0 — 12,356.53 m², 450 olive trees, buildable.",
    "Plot 19 declared entirely forest (non-buildable) — Gytheio Forestry 7407/109/19.2.2015.",
    "All land is εκτός σχεδίου (out-of-plan).",
  ],
};

export interface RedFlag {
  title: string;
  detail: string;
}

export const redFlags: RedFlag[] = [
  {
    title: "Land area discrepancy",
    detail:
      "Stated area drops from 911,000 m² (March brochure) to ~547,000 m² (May presentation) — a ~40% reduction.",
  },
  {
    title: "Buildability & permitting risk",
    detail:
      "Land is out-of-plan (εκτός σχεδίου); buildability is parcel-by-parcel. Plot 19 is officially classified forest.",
  },
  {
    title: "Draft / inconsistent financials",
    detail:
      "All tables watermarked “TBC – NS NEW NUMBERS”. Revenue (€3.5M vs €9.25M), dev cost and valuation (€18.7M / €43.8M / €75M / €150M) figures conflict.",
  },
  {
    title: "Resolutive condition on title",
    detail:
      "The 2016 sale was made with a διαλυτική αίρεση (resolutive condition) — title robustness needs verification.",
  },
  {
    title: "Offshore ownership structure",
    detail: "Estate is held by a Cyprus SPV (WINDREM LIMITED).",
  },
  {
    title: "Grant dependency",
    detail:
      "The funding model depends on a 50% ESPA / EU grant being secured.",
  },
];

export const sources = [
  "Copy of SYMBOLAIO AGORAS MAYROMICHALI ARITHMOS 6397.pdf (purchase deed, 113 pp)",
  "Mavro Detailed Brochure 110326_compressed (2).pdf (brochure, 11 Mar 2026)",
  "Mavromichali_Gytheio_290526.pdf (investor presentation, 29 May 2026)",
  "gytheio_TOPOGRAFIKO.pdf (topographic plan)",
];

// ---------- Market Check ----------
// Indicative market context compiled to sense-check the brochure's draft
// assumptions against the actual luxury / agro-tourism market the project
// benchmarks itself against (Domaine de Murtoli). Figures are indicative
// market ranges, not transaction records.

export interface Comp {
  name: string;
  region: string;
  type: string;
  keys: string;
  adr: string; // indicative €/night, peak-season spread
}

export const marketCheck = {
  context:
    "The Peloponnese luxury and agro-tourism segment has re-rated sharply over the last decade, led by Costa Navarino in neighbouring Messinia and a wave of estate-style 5-star openings. The Mavromichali concept positions itself against Domaine de Murtoli in Corsica — a working agricultural estate let as ultra-premium villas. The market exists; the question is whether the draft assumptions reflect it.",
  comps: [
    { name: "Domaine de Murtoli", region: "Corsica, FR", type: "Agro-tourism estate (cited benchmark)", keys: "~20 villas", adr: "€700 – €5,000+" },
    { name: "Amanzoe", region: "Porto Heli, GR", type: "Ultra-luxury resort & villas", keys: "38 pavilions", adr: "€900 – €2,500+" },
    { name: "Costa Navarino — The Romanos / Mandarin Oriental", region: "Messinia, GR", type: "5-star resort cluster", keys: "300+", adr: "€350 – €900" },
    { name: "Euphoria Retreat", region: "Mystras, Laconia, GR", type: "5-star wellness retreat", keys: "45", adr: "€300 – €600" },
    { name: "Kinsterna Hotel", region: "Monemvasia, GR", type: "5-star historic estate hotel", keys: "50", adr: "€250 – €500" },
  ] as Comp[],
  proposedRates: [
    { label: "Towers — proposed", value: "€120 / night" },
    { label: "Farmhouses — proposed", value: "€100 / night" },
    { label: "Studios — proposed", value: "€90 / night" },
  ] as Row[],
  rateFlag:
    "The brochure's proposed rates (€90–€120/night) sit far below comparable 5-star agro-tourism positioning (€250–€5,000+). Against the cited Domaine de Murtoli benchmark they are roughly one-fifth to one-tenth of market. Either modelled revenue is materially understated, or the product is mis-positioned. A market-based rate card would lift revenue several-fold — but must be earned with the matching standard of build, service and brand.",
  landComps: [
    { label: "Large out-of-plan agricultural tracts (Mani / Laconia)", value: "€3 – €15 / m²" },
    { label: "Coastal out-of-plan, sea-view / partly buildable", value: "€20 – €80 / m²" },
    { label: "In-plan buildable plots near Gytheio", value: "€100 – €300 / m²" },
  ] as Row[],
  landFlag:
    "The 2016 deed valued the whole estate at €2.2M. The brochure's €75M “value now” and €150M “end value” describe a fully-built, fully-operating resort — not the raw land. On out-of-plan land comparables the underlying site is worth single-digit millions; the uplift to €75M+ must be created by permitting, construction and a proven operating business. Land value and going-concern value need separate, independent appraisal.",
  demandDrivers: [
    "Kalamata International airport — growing direct European routes (the estate's ~2 h gateway)",
    "Costa Navarino halo effect re-pricing the wider Peloponnese",
    "Structural growth in European agro-tourism, wellness and experiential travel",
    "Scarcity of large, brandable coastal estates in mainland Greece",
  ],
  sourceNote:
    "Comparable nightly rates and land values are indicative market ranges compiled for this study, not transaction records. They are intended only to sense-check the brochure's draft assumptions and require independent feasibility and valuation work before any commitment.",
};

// ---------- Risk Register ----------
// A structured, rated register complementing the Due Diligence flags: each item
// carries a severity, likelihood, status and mitigation so capital decisions can
// be prioritised. Severities/likelihoods use the shared high/medium/low scale.

export interface RiskItem {
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  probability: "high" | "medium" | "low";
  status: "open" | "mitigating" | "resolved";
  mitigation: string;
}

export const riskRegister: RiskItem[] = [
  {
    title: "Land area discrepancy (911k → 547k m²)",
    category: "Asset / Title",
    severity: "high",
    probability: "high",
    status: "open",
    mitigation:
      "Commission a fresh topographic survey and reconcile against the cadastre (ΕΚΧΑ / Κτηματολόγιο) before any value is ascribed to Phase B land.",
  },
  {
    title: "Buildability — out-of-plan, parcel-by-parcel",
    category: "Permitting",
    severity: "high",
    probability: "high",
    status: "open",
    mitigation:
      "Parcel-level legal opinion on εκτός σχεδίου buildability; clear all plots against the forestry maps (δασικοί χάρτες). Plot 19 is officially forest — exclude from buildable area.",
  },
  {
    title: "Resolutive condition on 2016 title (διαλυτική αίρεση)",
    category: "Legal / Title",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "Title lawyer to confirm whether the condition is satisfied or still live; satisfy or formally extinguish it before exchange.",
  },
  {
    title: "Draft & internally inconsistent financials",
    category: "Commercial",
    severity: "high",
    probability: "high",
    status: "open",
    mitigation:
      "Treat all brochure tables (watermarked “TBC – NS NEW NUMBERS”) as indicative. Rebuild a bottom-up model and commission independent feasibility before relying on any figure.",
  },
  {
    title: "Revenue / ADR positioning gap vs benchmarks",
    category: "Market",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "Proposed €90–120/night is far below 5-star agro-tourism comps. Run a market study and reposition the rate card — and the matching build/brand standard — to a defensible level.",
  },
  {
    title: "Valuation unsupported by land comparables",
    category: "Commercial",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "Obtain a RICS-style appraisal that separates raw-land value from built / operating going-concern value; do not capitalise unbuilt revenue.",
  },
  {
    title: "ESPA / EU grant dependency (50% of capex)",
    category: "Finance",
    severity: "high",
    probability: "medium",
    status: "open",
    mitigation:
      "Confirm eligibility, scoring and disbursement timeline with the managing authority; model a downside case in which the grant is delayed or not awarded.",
  },
  {
    title: "Offshore ownership structure (Cyprus SPV)",
    category: "Legal",
    severity: "medium",
    probability: "medium",
    status: "mitigating",
    mitigation:
      "UBO / AML verification on WINDREM LIMITED; confirm the structure does not impair ESPA grant eligibility or future exit.",
  },
  {
    title: "Construction & off-grid infrastructure on a remote site",
    category: "Construction",
    severity: "medium",
    probability: "medium",
    status: "open",
    mitigation:
      "Feasibility on solar / wind / water-drilling and access roads; procure under a fixed-price EPC contract with contingency for the ~36-month build.",
  },
  {
    title: "Agricultural ramp-up (36–60 months to full yield)",
    category: "Operational",
    severity: "medium",
    probability: "medium",
    status: "mitigating",
    mitigation:
      "Agronomy plan for the ~3,000 olive trees and new planting; phase the farming revenue and avoid front-loading honey / olive-oil yields.",
  },
  {
    title: "Single-partner equity & funding gap",
    category: "Finance",
    severity: "medium",
    probability: "medium",
    status: "open",
    mitigation:
      "Plan does not rest on one 49% partner plus a grant alone — broaden investor outreach and stage capital against permitting milestones.",
  },
];
