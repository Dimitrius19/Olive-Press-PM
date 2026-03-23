import type { BudgetLine } from "./types";
import type { MarketDataPoint } from "../hooks/useMarketData";

// Maps budget line descriptions to their relevant price index
export type IndexType = "construction" | "material" | "cpi" | "blend";

export interface BudgetLineMapping {
  pattern: RegExp;
  indexType: IndexType;
  rationale: string;
}

// Mapping rules — match budget line descriptions to relevant indices
export const BUDGET_LINE_MAPPINGS: BudgetLineMapping[] = [
  {
    pattern: /σκαλωσιές|scaffolding/i,
    indexType: "construction",
    rationale: "Equipment rental tracks construction costs",
  },
  {
    pattern: /στατικ|structural|θεμελ|foundation/i,
    indexType: "construction",
    rationale: "Heavy construction — concrete, steel, labor",
  },
  {
    pattern: /οικοδομικ|construction works/i,
    indexType: "construction",
    rationale: "General building works",
  },
  {
    pattern: /στέγη|roof/i,
    indexType: "material",
    rationale: "Material-intensive — timber, tiles, insulation",
  },
  {
    pattern: /η\/μ|mep|ηλεκτρο|μηχαν/i,
    indexType: "blend",
    rationale: "50/50 materials + labor",
  },
  {
    pattern: /περιβάλλοντ|landscap|πισίνα|pool/i,
    indexType: "construction",
    rationale: "Outdoor construction works",
  },
  { pattern: /mock.?up/i, indexType: "material", rationale: "Fit-out materials" },
  {
    pattern: /ff&e|ff.e/i,
    indexType: "cpi",
    rationale: "Furniture & equipment tracks consumer prices",
  },
  {
    pattern: /os&e|os.e/i,
    indexType: "cpi",
    rationale: "Operating supplies track consumer prices",
  },
  {
    pattern: /μελετ|design|landscape|lighting|acoustic|pm.cm|αρχαιολ|επιβλέψ/i,
    indexType: "cpi",
    rationale: "Professional services track CPI",
  },
  {
    pattern: /signage|branding|pre.opening/i,
    indexType: "cpi",
    rationale: "Services & supplies",
  },
];

export function getIndexTypeForLine(description: string): {
  indexType: IndexType;
  rationale: string;
} {
  for (const mapping of BUDGET_LINE_MAPPINGS) {
    if (mapping.pattern.test(description)) {
      return { indexType: mapping.indexType, rationale: mapping.rationale };
    }
  }
  return { indexType: "construction", rationale: "Default: general construction index" };
}

// Get the YoY growth rate from a data series
export function getLatestYoyGrowth(data: MarketDataPoint[]): number | null {
  if (data.length < 5) return null; // need at least ~1 year of data
  const latest = data[data.length - 1];
  // Find the point ~4 quarters (or 12 months) earlier
  const latestDate = latest.date;
  const isQuarterly = latestDate.includes("Q");
  const lookback = isQuarterly ? 4 : 12;
  const compareIdx = data.length - 1 - lookback;
  if (compareIdx < 0) return null;
  const compare = data[compareIdx];
  return (latest.value - compare.value) / compare.value;
}

// Calculate projected cost at construction midpoint
// Estimate date: Q1 2026 (ANICON report)
// Construction midpoint: Q2 2027 (when bulk of spending occurs)
// Time delta: ~5 quarters
export interface ValidatedBudgetLine {
  line: BudgetLine;
  indexType: IndexType;
  rationale: string;
  currentIndexGrowthYoy: number | null; // latest YoY % from relevant index
  projectedAnnualGrowth: number; // growth rate used for projection
  quartersToMidpoint: number; // Q1 2026 to construction midpoint
  adjustedEstimate: number; // ANICON revised * (1 + growth)^(quarters/4)
  delta: number; // adjustedEstimate - aniconRevised
  deltaPct: number; // delta / aniconRevised
  risk: "low" | "medium" | "high"; // based on delta magnitude
}

const MIDPOINT_QUARTERS: Record<string, number> = {
  "2026-Q4": 3,
  "2027-Q1": 4,
  "2027-Q2": 5,
  "2027-Q3": 6,
  "2027-Q4": 7,
};

export function quartersForMidpoint(midpoint: string): number {
  return MIDPOINT_QUARTERS[midpoint] ?? 5;
}

export function validateBudgetLines(
  lines: BudgetLine[],
  constructionIndex: MarketDataPoint[],
  materialIndex: MarketDataPoint[],
  cpiData: MarketDataPoint[],
  constructionMidpoint: string = "2027-Q2",
): ValidatedBudgetLine[] {
  const constructionGrowth = getLatestYoyGrowth(constructionIndex);
  const materialGrowth = getLatestYoyGrowth(materialIndex);
  const cpiGrowth = getLatestYoyGrowth(cpiData);

  const quartersToMidpoint = quartersForMidpoint(constructionMidpoint);

  return lines
    .filter((l) => l.anicon_revised > 0)
    .map((line) => {
      const { indexType, rationale } = getIndexTypeForLine(line.description);

      let currentIndexGrowthYoy: number | null;
      switch (indexType) {
        case "construction":
          currentIndexGrowthYoy = constructionGrowth;
          break;
        case "material":
          currentIndexGrowthYoy = materialGrowth;
          break;
        case "cpi":
          currentIndexGrowthYoy = cpiGrowth;
          break;
        case "blend":
          currentIndexGrowthYoy =
            (constructionGrowth ?? 0) * 0.5 + (materialGrowth ?? 0) * 0.5 || null;
          break;
      }

      // Use actual growth rate if available, otherwise ANICON's 4% assumption
      const projectedAnnualGrowth = currentIndexGrowthYoy ?? 0.04;

      // Compound growth from estimate date to construction midpoint
      const growthFactor = Math.pow(1 + projectedAnnualGrowth, quartersToMidpoint / 4);
      const adjustedEstimate = line.anicon_revised * growthFactor;
      const delta = adjustedEstimate - line.anicon_revised;
      const deltaPct = line.anicon_revised > 0 ? delta / line.anicon_revised : 0;

      const risk: "low" | "medium" | "high" =
        Math.abs(deltaPct) > 0.05 ? "high" : Math.abs(deltaPct) > 0.02 ? "medium" : "low";

      return {
        line,
        indexType,
        rationale,
        currentIndexGrowthYoy,
        projectedAnnualGrowth,
        quartersToMidpoint,
        adjustedEstimate,
        delta,
        deltaPct,
        risk,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)); // highest exposure first
}

// Scenario: what if inflation is X% annually?
export function scenarioImpact(
  lines: BudgetLine[],
  annualRate: number,
  quartersToMidpoint: number = 5,
): { totalOriginal: number; totalAdjusted: number; totalDelta: number } {
  const growthFactor = Math.pow(1 + annualRate, quartersToMidpoint / 4);
  let totalOriginal = 0;
  let totalAdjusted = 0;
  for (const line of lines) {
    if (line.anicon_revised > 0) {
      totalOriginal += line.anicon_revised;
      totalAdjusted += line.anicon_revised * growthFactor;
    }
  }
  return {
    totalOriginal,
    totalAdjusted,
    totalDelta: totalAdjusted - totalOriginal,
  };
}
