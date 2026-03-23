// Bottom-Up Cost Estimate — Olive Press PM
// Independent estimate from physical quantities (ANICON report + masterplan)
// multiplied by current Greek unit rates (PEDMEDE/ATEE 2025-2026, +15% island premium)

export interface BoQLine {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  total: number;
  source: string;
  notes: string;
}

export interface BoQCategory {
  name: string;
  lines: BoQLine[];
  subtotal: number;
}

export interface BottomUpEstimate {
  categories: BoQCategory[];
  constructionSubtotal: number;
  opIISubtotal: number;
  ffeSubtotal: number;
  oseSubtotal: number;
  softCostsSubtotal: number;
  preOpeningSubtotal: number;
  baseTotal: number;
  contingency: number;
  inflation: number;
  totalExclVat: number;
  vat: number;
  grandTotal: number;
  comparisonWithAnicon: {
    aniconTotal: number;
    bottomUpTotal: number;
    delta: number;
    deltaPct: number;
  };
}

export interface KeyVariance {
  category: string;
  bottomUp: number;
  anicon: number;
  delta: number;
  explanation: string;
}

function line(
  id: string,
  category: string,
  subcategory: string,
  description: string,
  quantity: number,
  unit: string,
  unitRate: number,
  source: string,
  notes: string,
): BoQLine {
  return {
    id,
    category,
    subcategory,
    description,
    quantity,
    unit,
    unitRate,
    total: Math.round(quantity * unitRate),
    source,
    notes,
  };
}

function buildCategory(name: string, lines: BoQLine[]): BoQCategory {
  return {
    name,
    lines,
    subtotal: lines.reduce((sum, l) => sum + l.total, 0),
  };
}

export function generateEstimate(): BottomUpEstimate {
  const categories: BoQCategory[] = [];

  // 1. Preliminaries & Site Setup
  categories.push(
    buildCategory("1. Preliminaries & Site Setup", [
      line("1.1", "1. Preliminaries", "Site setup", "Site setup, temporary facilities", 1, "ls", 80_000, "PEDMEDE 2025", "Lump sum for site compound, hoarding, welfare"),
      line("1.2", "1. Preliminaries", "Scaffolding", "Scaffolding (heritage, facade 2,800 m²)", 2_800, "m²", 38, "ATEE 2025 +15%", "Heritage-spec scaffolding, island logistics premium"),
      line("1.3", "1. Preliminaries", "Demolition", "Demolition & strip-out (36 rooms + common)", 3_200, "m²", 25, "PEDMEDE 2025", "Careful demolition for heritage building"),
      line("1.4", "1. Preliminaries", "Waste", "Waste removal & disposal", 1, "ls", 35_000, "Local contractor quotes", "Island waste disposal premium"),
    ]),
  );

  // 2. Structural Reinforcement (OP I)
  categories.push(
    buildCategory("2. Structural Reinforcement (OP I)", [
      line("2.1", "2. Structural", "Masonry", "Stone masonry repair & repointing (facade)", 2_800, "m²", 65, "PEDMEDE 2025 +15%", "Heritage stone repointing, lime mortar"),
      line("2.2", "2. Structural", "Foundations", "Micropile foundations (seismic)", 40, "nr", 3_500, "Specialist geotech quotes", "Seismic reinforcement per ANICON structural report"),
      line("2.3", "2. Structural", "Tie rods", "Serzaneta (tie rods/wall anchors)", 60, "nr", 1_200, "PEDMEDE 2025", "Wall-to-wall structural ties"),
      line("2.4", "2. Structural", "Ring beam", "Concrete ring beam/diaphragm", 200, "lm", 180, "PEDMEDE 2025", "Perimeter ring beam for seismic restraint"),
      line("2.5", "2. Structural", "Steel", "Structural steel reinforcement", 15, "t", 3_200, "PEDMEDE 2025 +15%", "15 tonnes structural steel, island delivery"),
      line("2.6", "2. Structural", "Chimney", "Chimney stabilization (22m)", 1, "ls", 45_000, "Heritage specialist quote", "22m heritage chimney, brick/stone restoration"),
      line("2.7", "2. Structural", "Kiln", "Courtyard kiln restoration", 1, "ls", 30_000, "Heritage specialist quote", "Preserved kiln/oven structure in courtyard"),
    ]),
  );

  // 3. Building Works (OP I)
  categories.push(
    buildCategory("3. Building Works (OP I)", [
      line("3.1", "3. Building Works", "Partitions", "Internal walls (new partitions)", 1_200, "m²", 45, "PEDMEDE 2025", "New room partition walls"),
      line("3.2", "3. Building Works", "Plaster", "Plaster/render (internal)", 4_500, "m²", 22, "PEDMEDE 2025", "Internal plastering all surfaces"),
      line("3.3", "3. Building Works", "Plaster ext.", "Plaster/render (external/heritage)", 1_500, "m²", 45, "PEDMEDE 2025 +15%", "Heritage-spec external lime render"),
      line("3.4", "3. Building Works", "Floor tiling", "Floor tiling (rooms + common)", 1_800, "m²", 55, "ATEE 2025 +15%", "Natural stone / porcelain tiles, island supply"),
      line("3.5", "3. Building Works", "Wall tiling", "Wall tiling (bathrooms 36 × 12 m²)", 432, "m²", 65, "ATEE 2025 +15%", "Bathroom ceramic/porcelain wall tiles"),
      line("3.6", "3. Building Works", "Windows", "External wooden windows (heritage spec)", 120, "nr", 1_800, "Heritage joinery quotes +15%", "Bespoke timber windows to heritage spec"),
      line("3.7", "3. Building Works", "Int. doors", "Internal doors", 80, "nr", 450, "PEDMEDE 2025", "Solid-core internal doors"),
      line("3.8", "3. Building Works", "Ext. doors", "External doors", 8, "nr", 2_200, "PEDMEDE 2025 +15%", "Heavy-duty external doors, heritage spec"),
      line("3.9", "3. Building Works", "Paint int.", "Painting (internal)", 5_500, "m²", 8, "PEDMEDE 2025", "Two-coat emulsion, all internal surfaces"),
      line("3.10", "3. Building Works", "Paint ext.", "Painting (external)", 1_500, "m²", 12, "PEDMEDE 2025", "External masonry paint, heritage colours"),
      line("3.11", "3. Building Works", "Waterproofing", "Waterproofing (roofs + bathrooms)", 2_200, "m²", 18, "PEDMEDE 2025", "Membrane waterproofing"),
      line("3.12", "3. Building Works", "Insulation", "Insulation", 2_500, "m²", 25, "PEDMEDE 2025", "Thermal insulation to walls/floors"),
      line("3.13", "3. Building Works", "Reception", "Reception/entrance fit-out", 80, "m²", 350, "Contractor benchmark", "New reception hall, high-spec finish"),
      line("3.14", "3. Building Works", "Restaurant", "Restaurant renovation", 150, "m²", 300, "Contractor benchmark", "Restaurant renovation incl. F&B finishes"),
      line("3.15", "3. Building Works", "Bathrooms", "Bathroom complete (36 rooms)", 36, "nr", 4_500, "PEDMEDE 2025 +15%", "Complete bathroom inc. sanitary ware, tiling, MEP"),
    ]),
  );

  // 4. Roofing
  categories.push(
    buildCategory("4. Roofing", [
      line("4.1", "4. Roofing", "Timber", "Timber structure repair/replace", 1_800, "m²", 85, "PEDMEDE 2025 +15%", "Timber roof structure, pitched roof"),
      line("4.2", "4. Roofing", "Tiles", "Byzantine ceramic tiles", 1_800, "m²", 55, "ATEE 2025 +15%", "Heritage Byzantine-style ceramic tiles"),
      line("4.3", "4. Roofing", "Insulation", "Roof insulation", 1_800, "m²", 30, "PEDMEDE 2025", "Under-roof thermal insulation"),
      line("4.4", "4. Roofing", "Gutters", "Gutters & downpipes", 300, "lm", 35, "PEDMEDE 2025", "Copper/zinc gutters and downpipes"),
    ]),
  );

  // 5. MEP
  categories.push(
    buildCategory("5. MEP — Mechanical, Electrical, Plumbing", [
      line("5.1", "5. MEP", "HVAC rooms", "HVAC (VRV/split per room)", 36, "nr", 3_500, "PEDMEDE 2025 +15%", "VRV system, per-room indoor units"),
      line("5.2", "5. MEP", "HVAC common", "HVAC common areas", 400, "m²", 85, "PEDMEDE 2025", "Common area HVAC distribution"),
      line("5.3", "5. MEP", "Plumbing", "Plumbing (hot/cold water, drainage)", 36, "nr", 2_800, "PEDMEDE 2025 +15%", "Per-room plumbing rough-in + fixtures"),
      line("5.4", "5. MEP", "Electrical", "Electrical (power, lighting, data)", 3_200, "m²", 45, "PEDMEDE 2025", "Full electrical installation"),
      line("5.5", "5. MEP", "Fire safety", "Fire detection & safety", 3_200, "m²", 15, "PEDMEDE 2025", "Fire alarm, sprinkler, extinguishers"),
      line("5.6", "5. MEP", "BMS", "BMS/controls", 1, "ls", 35_000, "MEP consultant estimate", "Building management system"),
      line("5.7", "5. MEP", "Elevator", "Elevator (if applicable)", 1, "nr", 45_000, "PEDMEDE 2025", "Passenger elevator, 2-stop"),
      line("5.8", "5. MEP", "Solar", "Solar thermal (DHW)", 36, "nr", 800, "PEDMEDE 2025", "Solar thermal panels for domestic hot water"),
      line("5.9", "5. MEP", "Generator", "Generator", 1, "nr", 25_000, "PEDMEDE 2025", "Backup diesel generator"),
    ]),
  );

  // 6. Surrounding Area & Landscaping
  categories.push(
    buildCategory("6. Surrounding Area & Landscaping", [
      line("6.1", "6. Landscaping", "Paving", "Paving (stone/concrete)", 2_000, "m²", 45, "PEDMEDE 2025 +15%", "Natural stone paving, island supply"),
      line("6.2", "6. Landscaping", "Planting", "Planting & irrigation", 3_000, "m²", 18, "Local landscape quotes", "Mediterranean planting, drip irrigation"),
      line("6.3", "6. Landscaping", "Lighting", "Outdoor lighting", 80, "nr", 350, "ATEE 2025", "Landscape lighting fixtures incl. cabling"),
      line("6.4", "6. Landscaping", "Pergolas", "Pergolas (4 units)", 4, "nr", 8_000, "Local contractor quotes", "Timber/steel pergola structures"),
      line("6.5", "6. Landscaping", "Beach", "Beach facilities (sun beds, cabins)", 1, "ls", 40_000, "Hospitality supplier quotes", "Sun beds, umbrellas, storage cabins"),
      line("6.6", "6. Landscaping", "Beach volley", "Beach volley court", 1, "ls", 15_000, "Sports facility quotes", "Sand court with net and boundary"),
      line("6.7", "6. Landscaping", "Yoga/gym", "Yoga/gym outdoor area", 1, "ls", 20_000, "Hospitality supplier quotes", "Outdoor fitness area with equipment"),
      line("6.8", "6. Landscaping", "Water feature", "Water feature", 1, "ls", 12_000, "Landscape specialist", "Decorative water feature"),
      line("6.9", "6. Landscaping", "Platforms", "Floating platforms", 3, "nr", 8_000, "Marine supplier quotes", "Floating swim/sunbathing platforms"),
      line("6.10", "6. Landscaping", "Retaining walls", "Retaining walls/terracing", 150, "lm", 120, "PEDMEDE 2025", "Stone retaining walls, terraced landscape"),
    ]),
  );

  // 7. Pool
  categories.push(
    buildCategory("7. Pool", [
      line("7.1", "7. Pool", "Structure", "Pool structure (concrete, ~200 m²)", 200, "m²", 450, "PEDMEDE 2025 +15%", "Reinforced concrete pool shell"),
      line("7.2", "7. Pool", "MEP", "Pool MEP (filtration, heating, pumps)", 1, "ls", 65_000, "Pool specialist quotes", "Complete pool mechanical package"),
      line("7.3", "7. Pool", "Deck", "Pool deck & surrounding", 300, "m²", 55, "PEDMEDE 2025 +15%", "Anti-slip stone/tile pool surround"),
      line("7.4", "7. Pool", "Changing rooms", "Changing rooms/WC", 40, "m²", 600, "Contractor benchmark", "Pool changing and WC facilities"),
      line("7.5", "7. Pool", "Furniture", "Pool furniture", 1, "ls", 15_000, "Hospitality supplier quotes", "Loungers, tables, parasols"),
    ]),
  );

  // 8. Olive Press II
  categories.push(
    buildCategory("8. Olive Press II (12 studios)", [
      line("8.1", "8. OP II", "Renovation", "Full renovation (no structural)", 587, "m²", 800, "PEDMEDE 2025 +15%", "Complete renovation, concrete building, no structural work"),
      line("8.2", "8. OP II", "FF&E", "FF&E (12 studios)", 12, "nr", 12_000, "Hospitality FF&E benchmark", "Studio apartment furniture package"),
      line("8.3", "8. OP II", "OS&E", "OS&E (12 studios)", 12, "nr", 2_000, "Hospitality OS&E benchmark", "Operating supplies per studio"),
      line("8.4", "8. OP II", "MEP", "MEP upgrade", 587, "m²", 120, "PEDMEDE 2025", "MEP upgrade for hospitality use"),
      line("8.5", "8. OP II", "External", "External works", 1, "ls", 35_000, "Local contractor quotes", "Entrance, facade, landscaping"),
    ]),
  );

  // 9. FF&E (OP I)
  categories.push(
    buildCategory("9. FF&E (OP I)", [
      line("9.1", "9. FF&E", "Double rooms", "Double room FF&E (17 rooms)", 17, "nr", 10_000, "Hospitality FF&E benchmark", "Bed, wardrobe, desk, chair, lighting, textiles"),
      line("9.2", "9. FF&E", "Triple rooms", "Triple room FF&E (15 rooms)", 15, "nr", 12_000, "Hospitality FF&E benchmark", "Larger rooms, extra bed, additional furniture"),
      line("9.3", "9. FF&E", "Suites", "Suite FF&E (4 suites)", 4, "nr", 22_000, "Hospitality FF&E benchmark", "Premium furniture, living area, upgraded finishes"),
      line("9.4", "9. FF&E", "Common areas", "Common area FF&E", 400, "m²", 180, "Hospitality FF&E benchmark", "Reception, corridors, lobby furniture"),
      line("9.5", "9. FF&E", "Restaurant", "Restaurant/bar FF&E", 150, "m²", 200, "F&B FF&E benchmark", "Dining furniture, bar equipment"),
      line("9.6", "9. FF&E", "Kitchen", "Kitchen equipment", 1, "ls", 45_000, "F&B equipment quotes", "Commercial kitchen equipment package"),
    ]),
  );

  // 10. OS&E (OP I)
  categories.push(
    buildCategory("10. OS&E (OP I)", [
      line("10.1", "10. OS&E", "Room OS&E", "Room OS&E (36 rooms)", 36, "nr", 2_500, "Hospitality OS&E benchmark", "Linen, towels, amenities, consumables per room"),
      line("10.2", "10. OS&E", "Common/kitchen", "Common area/kitchen OS&E", 1, "ls", 35_000, "Hospitality OS&E benchmark", "Cleaning supplies, kitchen consumables, uniforms"),
      line("10.3", "10. OS&E", "Technology", "Technology (PMS, POS, WiFi, TV)", 1, "ls", 55_000, "IT vendor quotes", "Property management, POS, guest WiFi, smart TV"),
    ]),
  );

  // 11. Soft Costs
  categories.push(
    buildCategory("11. Soft Costs", [
      line("11.1", "11. Soft Costs", "Architecture", "Architectural studies (application)", 1, "ls", 120_000, "ETEK fee schedule", "Full architectural design package"),
      line("11.2", "11. Soft Costs", "Interior design", "Interior design", 1, "ls", 180_000, "Interior design market rates", "Concept through to FF&E specification"),
      line("11.3", "11. Soft Costs", "Structural eng.", "Structural engineering", 1, "ls", 60_000, "ETEK fee schedule", "Structural survey + reinforcement design"),
      line("11.4", "11. Soft Costs", "MEP design", "MEP design", 1, "ls", 45_000, "ETEK fee schedule", "Full MEP design and specifications"),
      line("11.5", "11. Soft Costs", "Landscape", "Landscape design", 1, "ls", 35_000, "Landscape architect rates", "Landscape architecture and planting plans"),
      line("11.6", "11. Soft Costs", "Consultants", "Lighting/acoustic consultants", 1, "ls", 40_000, "Consultant market rates", "Specialist lighting and acoustic design"),
      line("11.7", "11. Soft Costs", "Archaeology", "Archaeology supervision", 1, "ls", 50_000, "Ministry of Culture tariff", "Mandatory archaeological supervision during works"),
      line("11.8", "11. Soft Costs", "Design supervision", "Design team supervision", 1, "ls", 45_000, "ETEK fee schedule", "Site supervision during construction"),
      line("11.9", "11. Soft Costs", "PM/CM", "PM/CM (5% of construction)", 1, "ls", 200_000, "Industry standard 5%", "Project management and cost management"),
      line("11.10", "11. Soft Costs", "Permits", "Building permit & fees", 1, "ls", 30_000, "Municipal fee schedule", "Building permits, connection fees"),
    ]),
  );

  // 12. Pre-Opening
  categories.push(
    buildCategory("12. Pre-Opening", [
      line("12.1", "12. Pre-Opening", "Signage", "Signage & branding", 1, "ls", 45_000, "Branding agency quotes", "Hotel signage, brand identity implementation"),
      line("12.2", "12. Pre-Opening", "Digital", "Website & digital marketing", 1, "ls", 30_000, "Digital agency quotes", "Website, SEO, social media setup"),
      line("12.3", "12. Pre-Opening", "OTA", "OTA setup & photography", 1, "ls", 15_000, "Industry benchmark", "Booking.com, Expedia setup + professional photography"),
      line("12.4", "12. Pre-Opening", "Recruitment", "Staff recruitment", 1, "ls", 25_000, "HR consultant estimate", "Recruitment costs for ~25-30 staff"),
      line("12.5", "12. Pre-Opening", "Training", "Staff training (3 months)", 1, "ls", 80_000, "Hospitality training benchmark", "3-month pre-opening training programme"),
      line("12.6", "12. Pre-Opening", "Soft opening", "Soft opening & testing", 1, "ls", 35_000, "Industry benchmark", "Trial runs, complimentary stays, testing"),
      line("12.7", "12. Pre-Opening", "IT systems", "IT/PMS/POS systems", 1, "ls", 40_000, "IT vendor quotes", "System setup, integration, testing"),
      line("12.8", "12. Pre-Opening", "Supplies", "Pre-opening supplies", 1, "ls", 25_000, "Industry benchmark", "Initial inventory, cleaning, amenities stock"),
    ]),
  );

  // Compute subtotals
  const constructionSubtotal = categories
    .filter((c) => ["1", "2", "3", "4", "5", "6", "7"].some((n) => c.name.startsWith(n + ".")))
    .reduce((sum, c) => sum + c.subtotal, 0);

  const opIISubtotal = categories.find((c) => c.name.startsWith("8."))?.subtotal ?? 0;
  const ffeSubtotal = categories.find((c) => c.name.startsWith("9."))?.subtotal ?? 0;
  const oseSubtotal = categories.find((c) => c.name.startsWith("10."))?.subtotal ?? 0;
  const softCostsSubtotal = categories.find((c) => c.name.startsWith("11."))?.subtotal ?? 0;
  const preOpeningSubtotal = categories.find((c) => c.name.startsWith("12."))?.subtotal ?? 0;

  const baseTotal =
    constructionSubtotal + opIISubtotal + ffeSubtotal + oseSubtotal + softCostsSubtotal + preOpeningSubtotal;

  const contingency = Math.round(baseTotal * 0.1);
  const inflation = Math.round((baseTotal + contingency) * 0.04);
  const totalExclVat = baseTotal + contingency + inflation;
  const vat = Math.round(totalExclVat * 0.24);
  const grandTotal = totalExclVat + vat;

  const aniconTotal = 10_557_940;
  const delta = aniconTotal - totalExclVat;
  const deltaPct = (delta / aniconTotal) * 100;

  return {
    categories,
    constructionSubtotal,
    opIISubtotal,
    ffeSubtotal,
    oseSubtotal,
    softCostsSubtotal,
    preOpeningSubtotal,
    baseTotal,
    contingency,
    inflation,
    totalExclVat,
    vat,
    grandTotal,
    comparisonWithAnicon: {
      aniconTotal,
      bottomUpTotal: totalExclVat,
      delta,
      deltaPct,
    },
  };
}

export const KEY_VARIANCES: KeyVariance[] = [
  {
    category: "Pre-Opening",
    bottomUp: 295_000,
    anicon: 1_164_000,
    delta: 869_000,
    explanation:
      "ANICON allocates significantly more to pre-opening. Their figure may include items not typical in pre-opening budgets, or may bundle working capital / initial operating costs.",
  },
  {
    category: "Structural Reinforcement",
    bottomUp: 553_000,
    anicon: 1_030_000,
    delta: 477_000,
    explanation:
      "ANICON's higher structural figure reflects their conservative assessment of the stone masonry condition. Actual scope depends on detailed structural survey — risk of discovery works.",
  },
  {
    category: "Soft Costs",
    bottomUp: 805_000,
    anicon: 1_200_000,
    delta: 395_000,
    explanation:
      "ANICON includes broader advisory and contingency within soft costs. Bottom-up estimate uses ETEK fee schedules and market rates for individual disciplines.",
  },
  {
    category: "FF&E + OS&E",
    bottomUp: 759_000,
    anicon: 1_632_000,
    delta: 873_000,
    explanation:
      "ANICON's FF&E at €34K/key is at the upper end for a 4-star island hotel. Bottom-up uses €10-22K/room (type-dependent) which aligns with Greek hospitality benchmarks.",
  },
  {
    category: "MEP",
    bottomUp: 586_600,
    anicon: 780_000,
    delta: 193_400,
    explanation:
      "Moderate variance. ANICON may include more extensive MEP scope or higher specification. VRV systems and solar thermal are costed separately in bottom-up.",
  },
];
