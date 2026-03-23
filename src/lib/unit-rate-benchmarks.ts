import type { BudgetLine } from "./types";

// ---------- Project Physical Data (from ANICON report) ----------

export const PROJECT_AREAS = {
  totalBuildingArea: 4500, // m² actual built/renovated area (excl. courtyard/outdoor)
  totalSiteArea: 6658, // m² preserved building + courtyard (ANICON report figure)
  groundFloorArea: 2600, // est. m² built
  upperFloorArea: 1900, // est. m² built
  basementArea: 587, // m² (Olive Press II underground)
  surroundingArea: 6658, // m² outdoor/landscaping
  neighboringPlot: 6754, // m² (Olive Press II plot)
  roofArea: 2200, // est. m² (pitched roofs, Byzantine tile)
  facadeArea: 3500, // est. m² (stone masonry walls, 50-65cm thick)
  poolArea: 250, // est. m² (pool + deck)
  rooms: 48, // total keys
  roomsOP1: 36,
  roomsOP2: 12,
  beds: 91,
  chimneyHeight: 22, // meters (landmark feature)
  commonAreaEstimate: 800, // est. m² lobby, restaurant, bar, corridors
} as const;

// ---------- Benchmark Definitions ----------

export interface UnitRateBenchmark {
  id: string;
  category: string;
  description: string;
  unit: string; // "€/m²", "€/room", "€/unit", "€/lump"
  lowRange: number;
  midRange: number;
  highRange: number;
  source: string;
  notes: string;
}

export const BENCHMARKS: UnitRateBenchmark[] = [
  {
    id: "scaffolding",
    category: "A",
    description: "Scaffolding (heritage building)",
    unit: "€/m² facade",
    lowRange: 25,
    midRange: 40,
    highRange: 60,
    source: "ATEE 2025, adjusted for island logistics",
    notes:
      "Heritage buildings require specialized scaffolding. Island premium +15-20%.",
  },
  {
    id: "structural",
    category: "A",
    description: "Structural reinforcement (micropiles, serzaneta, concrete)",
    unit: "€/m² building",
    lowRange: 120,
    midRange: 180,
    highRange: 280,
    source: "PEDMEDE structural works rates 2025",
    notes:
      "Stone masonry heritage buildings require extensive reinforcement. Seismic upgrade adds 30-50%.",
  },
  {
    id: "construction",
    category: "A",
    description:
      "Building construction works (masonry, plaster, tiles, paint, windows)",
    unit: "€/m² building",
    lowRange: 150,
    midRange: 220,
    highRange: 350,
    source: "PEDMEDE finishing works + ELSTAT material prices 2025",
    notes:
      "Heritage restoration premium: traditional plaster, stone pointing, handmade tiles. External wooden windows are expensive.",
  },
  {
    id: "roofing",
    category: "A",
    description: "Roofing (timber structure, Byzantine ceramic tiles)",
    unit: "€/m² roof",
    lowRange: 120,
    midRange: 200,
    highRange: 320,
    source: "ATEE roofing rates 2025",
    notes:
      "Timber roof structure with Byzantine tiles. Heritage spec requires matching original materials.",
  },
  {
    id: "mep",
    category: "A",
    description:
      "MEP — Mechanical, Electrical, Plumbing (rooms + common areas)",
    unit: "€/room",
    lowRange: 8000,
    midRange: 13000,
    highRange: 20000,
    source: "PEDMEDE MEP rates for hotel projects 2025",
    notes:
      "Full MEP per room: HVAC, plumbing, electrical, fire safety, BMS. 4-star spec.",
  },
  {
    id: "landscaping",
    category: "A",
    description: "Surrounding area & landscaping",
    unit: "€/m² outdoor",
    lowRange: 40,
    midRange: 80,
    highRange: 150,
    source: "PEDMEDE landscape + hardscape rates",
    notes:
      "Includes paving, planting, irrigation, lighting, pergolas, beach facilities.",
  },
  {
    id: "pool",
    category: "A",
    description: "Swimming pool complete (structure + MEP + deck)",
    unit: "€/lump",
    lowRange: 120000,
    midRange: 220000,
    highRange: 380000,
    source: "Hotel pool contractor estimates Greece 2025",
    notes:
      "25m hotel pool with deck, filtration, heating. Includes surrounding MEP networks.",
  },
  {
    id: "ffe_rooms",
    category: "B",
    description: "FF&E per room (furniture, fixtures, equipment)",
    unit: "€/room",
    lowRange: 8000,
    midRange: 15000,
    highRange: 28000,
    source: "Hotel FF&E suppliers Greece/Europe 2025",
    notes:
      "4-star boutique: bed, wardrobe, desk, minibar, bathroom fixtures, lighting, curtains, TV.",
  },
  {
    id: "ffe_common",
    category: "B",
    description: "FF&E common areas (lobby, restaurant, bar, corridors)",
    unit: "€/m² common",
    lowRange: 80,
    midRange: 150,
    highRange: 280,
    source: "Hotel fit-out benchmarks Southern Europe",
    notes:
      "Reception, lounge, restaurant, bar, corridors. Heritage property requires sympathetic design.",
  },
  {
    id: "ose",
    category: "C",
    description: "OS&E (operating supplies & equipment)",
    unit: "€/room",
    lowRange: 1500,
    midRange: 2500,
    highRange: 4000,
    source: "Hotel pre-opening supply estimates",
    notes:
      "Linen, towels, kitchen equipment, cleaning supplies, amenities, tech.",
  },
  {
    id: "design_studies",
    category: "D",
    description: "Design & engineering studies (application studies)",
    unit: "% of construction",
    lowRange: 6,
    midRange: 9,
    highRange: 14,
    source: "Greek Chamber of Engineers fee schedule",
    notes:
      "Architecture, structural, MEP, landscape, interior design, lighting, acoustic.",
  },
  {
    id: "pm_cm",
    category: "D",
    description: "Project Management / Construction Management",
    unit: "% of construction",
    lowRange: 3,
    midRange: 5,
    highRange: 8,
    source: "RICS PM fee benchmarks Southern Europe",
    notes:
      "PM/CM for heritage hotel renovation. Higher end justified by monument complexity.",
  },
  {
    id: "pre_opening",
    category: "E",
    description: "Signage, branding & pre-opening (incl. staff, marketing, launch)",
    unit: "€/room",
    lowRange: 8000,
    midRange: 18000,
    highRange: 35000,
    source: "Hotel pre-opening budgets Greece/Med 2025, incl. staff training & marketing",
    notes:
      "Full pre-opening: signage, branding, website, OTAs, staff recruitment & 3-month training, soft opening, marketing launch, IT/PMS setup. Heritage boutique hotels spend more on positioning.",
  },
];

// ---------- Matching Logic ----------

interface BenchmarkMapping {
  benchmarkId: string;
  pattern: RegExp;
  getQuantity: (areas: typeof PROJECT_AREAS) => number;
  quantityLabel: (areas: typeof PROJECT_AREAS) => string;
}

const BENCHMARK_MAPPINGS: BenchmarkMapping[] = [
  {
    benchmarkId: "scaffolding",
    pattern: /σκαλωσιές|scaffolding/i,
    getQuantity: (a) => a.facadeArea,
    quantityLabel: (a) => `${a.facadeArea.toLocaleString()} m² facade`,
  },
  {
    benchmarkId: "structural",
    pattern: /στατικ|structural|θεμελ|foundation/i,
    getQuantity: (a) => a.totalBuildingArea,
    quantityLabel: (a) =>
      `${a.totalBuildingArea.toLocaleString()} m² building`,
  },
  {
    benchmarkId: "construction",
    pattern: /οικοδομικ|construction works/i,
    getQuantity: (a) => a.totalBuildingArea,
    quantityLabel: (a) =>
      `${a.totalBuildingArea.toLocaleString()} m² building`,
  },
  {
    benchmarkId: "roofing",
    pattern: /στέγη|roof/i,
    getQuantity: (a) => a.roofArea,
    quantityLabel: (a) => `${a.roofArea.toLocaleString()} m² roof`,
  },
  {
    benchmarkId: "mep",
    pattern: /η\/μ δωματίων|η\/μ.*κοιν|mep.*room|mep.*common/i,
    getQuantity: (a) => a.roomsOP1,
    quantityLabel: (a) => `${a.roomsOP1} rooms (OP I)`,
  },
  {
    benchmarkId: "landscaping",
    pattern: /περιβάλλοντ.*χώρ|landscap/i,
    getQuantity: (a) => a.surroundingArea,
    quantityLabel: (a) =>
      `${a.surroundingArea.toLocaleString()} m² outdoor`,
  },
  {
    benchmarkId: "pool",
    pattern: /πισίνα|pool/i,
    getQuantity: () => 1,
    quantityLabel: () => "lump sum",
  },
  {
    benchmarkId: "ffe_rooms",
    pattern: /ff&?e.*room|ff.e.*room/i,
    getQuantity: (a) => a.roomsOP1,
    quantityLabel: (a) => `${a.roomsOP1} rooms (OP I)`,
  },
  {
    benchmarkId: "ffe_common",
    pattern: /ff&?e.*common|ff.e.*common|ff&?e.*f&?b|ff.e.*f.b/i,
    getQuantity: (a) => a.commonAreaEstimate,
    quantityLabel: (a) =>
      `${a.commonAreaEstimate.toLocaleString()} m² common (est.)`,
  },
  {
    benchmarkId: "ose",
    pattern: /os&?e|os.e/i,
    getQuantity: (a) => a.roomsOP1,
    quantityLabel: (a) => `${a.roomsOP1} rooms (OP I)`,
  },
  {
    benchmarkId: "design_studies",
    pattern: /μελετ|εκπόνηση|interior design|landscape design|lighting design|acoustic|design.*stud/i,
    getQuantity: () => -1, // percentage-based, handled specially
    quantityLabel: () => "% of construction",
  },
  {
    benchmarkId: "pm_cm",
    pattern: /pm.?cm|project management|construction management/i,
    getQuantity: () => -1,
    quantityLabel: () => "% of construction",
  },
  {
    benchmarkId: "pre_opening",
    pattern: /signage|branding|pre.opening/i,
    getQuantity: (a) => a.rooms,
    quantityLabel: (a) => `${a.rooms} rooms (total)`,
  },
];

// ---------- Result Interface ----------

export interface BenchmarkResult {
  line: BudgetLine;
  benchmark: UnitRateBenchmark;
  quantity: number;
  quantityLabel: string;
  impliedRate: number;
  positionInRange: number; // 0-100%
  verdict: "below" | "within" | "above" | "well-above";
  verdictColor: string;
  verdictLabel: string;
  savingsOpportunity: number;
  riskExposure: number;
}

// ---------- Core Benchmarking Function ----------

function getVerdict(
  position: number,
): Pick<BenchmarkResult, "verdict" | "verdictColor" | "verdictLabel"> {
  if (position < 0) {
    return {
      verdict: "below",
      verdictColor: "text-red-700 bg-red-50 border-red-200",
      verdictLabel: "Below Range",
    };
  }
  if (position <= 25) {
    return {
      verdict: "within",
      verdictColor: "text-amber-700 bg-amber-50 border-amber-200",
      verdictLabel: "Low End",
    };
  }
  if (position <= 75) {
    return {
      verdict: "within",
      verdictColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      verdictLabel: "Within Range",
    };
  }
  if (position <= 100) {
    return {
      verdict: "above",
      verdictColor: "text-amber-700 bg-amber-50 border-amber-200",
      verdictLabel: "High End",
    };
  }
  return {
    verdict: "well-above",
    verdictColor: "text-red-700 bg-red-50 border-red-200",
    verdictLabel: "Above Range",
  };
}

export function benchmarkBudgetLine(
  line: BudgetLine,
  constructionTotal: number,
  areas: typeof PROJECT_AREAS = PROJECT_AREAS,
): BenchmarkResult | null {
  // Find matching mapping
  const mapping = BENCHMARK_MAPPINGS.find((m) =>
    m.pattern.test(line.description),
  );
  if (!mapping) return null;

  const benchmark = BENCHMARKS.find((b) => b.id === mapping.benchmarkId);
  if (!benchmark) return null;

  const amount = line.anicon_revised;
  if (amount <= 0) return null;

  let quantity: number;
  let quantityLabel: string;
  let impliedRate: number;

  // Handle percentage-based benchmarks
  if (benchmark.unit === "% of construction") {
    quantity = constructionTotal;
    quantityLabel = `${(constructionTotal / 1000).toFixed(0)}K construction base`;
    impliedRate = constructionTotal > 0 ? (amount / constructionTotal) * 100 : 0;
  } else {
    quantity = mapping.getQuantity(areas);
    quantityLabel = mapping.quantityLabel(areas);
    impliedRate = quantity > 0 ? amount / quantity : 0;
  }

  // Position in range: 0% = low, 50% = mid, 100% = high
  const range = benchmark.highRange - benchmark.lowRange;
  const positionInRange =
    range > 0 ? ((impliedRate - benchmark.lowRange) / range) * 100 : 50;

  const { verdict, verdictColor, verdictLabel } = getVerdict(positionInRange);

  // Savings opportunity: if above mid, how much could be saved
  const midCost = benchmark.midRange * quantity;
  const savingsOpportunity =
    impliedRate > benchmark.midRange ? amount - midCost : 0;

  // Risk exposure: if below mid, how much more it might cost
  const riskExposure =
    impliedRate < benchmark.midRange ? midCost - amount : 0;

  return {
    line,
    benchmark,
    quantity,
    quantityLabel,
    impliedRate,
    positionInRange,
    verdict,
    verdictColor,
    verdictLabel,
    savingsOpportunity,
    riskExposure,
  };
}

export function benchmarkAllLines(
  lines: BudgetLine[],
  areas: typeof PROJECT_AREAS = PROJECT_AREAS,
): BenchmarkResult[] {
  // Calculate construction total (Category A lines) for percentage benchmarks
  // We sum lines matching Category A benchmarks (scaffolding, structural, construction, roofing, mep, landscaping, pool)
  const catAPatterns = BENCHMARK_MAPPINGS.filter((m) => {
    const bm = BENCHMARKS.find((b) => b.id === m.benchmarkId);
    return bm && bm.category === "A";
  });

  const constructionTotal = lines
    .filter((l) =>
      l.anicon_revised > 0 &&
      catAPatterns.some((p) => p.pattern.test(l.description)),
    )
    .reduce((sum, l) => sum + l.anicon_revised, 0);

  // Aggregate design study lines before benchmarking
  const designStudyMapping = BENCHMARK_MAPPINGS.find(
    (m) => m.benchmarkId === "design_studies",
  );
  const designStudyLines = designStudyMapping
    ? lines.filter(
        (l) =>
          l.anicon_revised > 0 && designStudyMapping.pattern.test(l.description),
      )
    : [];

  const results: BenchmarkResult[] = [];
  const processedDesignStudies = new Set<string>();

  for (const line of lines) {
    if (line.anicon_revised <= 0) continue;

    // For design study lines, aggregate into a single result
    if (
      designStudyMapping &&
      designStudyMapping.pattern.test(line.description)
    ) {
      if (processedDesignStudies.size === 0) {
        // Create an aggregated pseudo-line
        const aggregatedAmount = designStudyLines.reduce(
          (sum, l) => sum + l.anicon_revised,
          0,
        );
        const aggregatedLine: BudgetLine = {
          ...line,
          description: "Design & Engineering Studies (aggregated)",
          anicon_revised: aggregatedAmount,
        };
        const result = benchmarkBudgetLine(
          aggregatedLine,
          constructionTotal,
          areas,
        );
        if (result) results.push(result);
      }
      processedDesignStudies.add(line.id);
      continue;
    }

    const result = benchmarkBudgetLine(line, constructionTotal, areas);
    if (result) results.push(result);
  }

  return results;
}

// ---------- Summary Helpers ----------

export interface BenchmarkSummary {
  totalBenchmarked: number;
  matchedCount: number;
  totalLines: number;
  withinRangeCount: number;
  totalOverbudgeted: number;
  totalUnderbudgeted: number;
  netPosition: "conservative" | "accurate" | "aggressive";
  weightedPosition: number; // weighted average position across all benchmarks
}

export function summarizeBenchmarks(
  results: BenchmarkResult[],
  totalLineCount: number,
): BenchmarkSummary {
  const totalBenchmarked = results.reduce(
    (sum, r) => sum + r.line.anicon_revised,
    0,
  );
  const withinRangeCount = results.filter(
    (r) => r.verdict === "within",
  ).length;
  const totalOverbudgeted = results.reduce(
    (sum, r) => sum + r.savingsOpportunity,
    0,
  );
  const totalUnderbudgeted = results.reduce(
    (sum, r) => sum + r.riskExposure,
    0,
  );

  // Weighted average position by spend
  const weightedPosition =
    totalBenchmarked > 0
      ? results.reduce(
          (sum, r) => sum + r.positionInRange * r.line.anicon_revised,
          0,
        ) / totalBenchmarked
      : 50;

  let netPosition: "conservative" | "accurate" | "aggressive";
  if (totalOverbudgeted > totalUnderbudgeted * 1.5) {
    netPosition = "conservative";
  } else if (totalUnderbudgeted > totalOverbudgeted * 1.5) {
    netPosition = "aggressive";
  } else {
    netPosition = "accurate";
  }

  return {
    totalBenchmarked,
    matchedCount: results.length,
    totalLines: totalLineCount,
    withinRangeCount,
    totalOverbudgeted,
    totalUnderbudgeted,
    netPosition,
    weightedPosition,
  };
}
