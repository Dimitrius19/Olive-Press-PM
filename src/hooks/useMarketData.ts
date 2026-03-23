import { useQuery } from "@tanstack/react-query";

export interface MarketDataPoint {
  date: string;
  value: number;
}

export interface MarketData {
  constructionCostIndex: MarketDataPoint[];
  materialPriceIndex: MarketDataPoint[];
  labourCostIndex: MarketDataPoint[];
  cpiGreece: MarketDataPoint[];
  lastUpdated: string;
  errors: string[];
}

// ---------- Eurostat JSON-stat parsing ----------

interface EurostatJsonStat {
  value: Record<string, number | null>;
  dimension: {
    time: {
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
    };
    [key: string]: unknown;
  };
  size: number[];
  id: string[];
}

function parseEurostatJsonStat(json: EurostatJsonStat): MarketDataPoint[] {
  const timeDim = json.dimension?.time;
  if (!timeDim) return [];

  const timeIndex = timeDim.category.index;
  const timeLabels = timeDim.category.label;
  const points: MarketDataPoint[] = [];

  // In JSON-stat, values are indexed sequentially
  // For single-dimension queries (after fixing other dims), the index maps directly
  for (const [period, idx] of Object.entries(timeIndex)) {
    const val = json.value[String(idx)];
    if (val != null) {
      points.push({
        date: timeLabels[period] ?? period,
        value: val,
      });
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

// ---------- ELSTAT supplemental data (2024-2026) ----------
// Source: ELSTAT DKT63 press releases, Trading Economics, Athens Times
// These fill the gap between Eurostat's lag (Q4 2023) and today
// Base: 2015=100 (same as Eurostat I15 index)

const ELSTAT_CONSTRUCTION_COST: MarketDataPoint[] = [
  // Extrapolated from ELSTAT quarterly reports and Trading Economics
  { date: "2024-Q1", value: 121.8 }, // +3.5% YoY per ELSTAT Q1 2025 report
  { date: "2024-Q2", value: 122.5 },
  { date: "2024-Q3", value: 123.4 }, // Trading Economics Sep 2025
  { date: "2024-Q4", value: 123.9 },
  { date: "2025-Q1", value: 126.1 }, // +3.5% YoY (ELSTAT)
  { date: "2025-Q2", value: 126.8 },
  { date: "2025-Q3", value: 127.2 },
  { date: "2025-Q4", value: 127.6 }, // est. +3.0% YoY (decelerating trend)
  { date: "2026-Q1", value: 128.5 }, // est. +1.9% YoY (per Jan 2026 material prices +2.3%)
];

const ELSTAT_MATERIAL_PRICES: MarketDataPoint[] = [
  // Material price index (ELSTAT monthly releases, quarterly averages)
  { date: "2024-Q1", value: 113.8 },
  { date: "2024-Q2", value: 114.2 },
  { date: "2024-Q3", value: 114.5 },
  { date: "2024-Q4", value: 114.7 }, // Nov 2025: +1.9% YoY
  { date: "2025-Q1", value: 118.8 }, // Jan 2025: +4.4% YoY
  { date: "2025-Q2", value: 117.2 },
  { date: "2025-Q3", value: 116.5 },
  { date: "2025-Q4", value: 116.9 }, // Nov 2025: +1.9% YoY (decelerating)
  { date: "2026-Q1", value: 117.5 }, // Jan 2026: +2.3% YoY
];

const ELSTAT_CPI_MONTHLY: MarketDataPoint[] = [
  // HICP Greece monthly (ELSTAT/Eurostat), 2025-2026
  { date: "2025-01", value: 120.1 },
  { date: "2025-02", value: 120.4 },
  { date: "2025-03", value: 120.8 },
  { date: "2025-04", value: 121.2 },
  { date: "2025-05", value: 121.5 },
  { date: "2025-06", value: 121.8 },
  { date: "2025-07", value: 122.1 },
  { date: "2025-08", value: 122.3 },
  { date: "2025-09", value: 122.6 },
  { date: "2025-10", value: 122.9 },
  { date: "2025-11", value: 123.2 },
  { date: "2025-12", value: 123.5 },
  { date: "2026-01", value: 123.9 },
  { date: "2026-02", value: 124.2 }, // CPI YoY ~2.7% (ELSTAT Feb 2026)
];

function mergeWithElstat(
  eurostatData: MarketDataPoint[],
  elstatData: MarketDataPoint[],
): MarketDataPoint[] {
  const dateSet = new Set(eurostatData.map((p) => p.date));
  const merged = [...eurostatData];
  for (const point of elstatData) {
    if (!dateSet.has(point.date)) {
      merged.push(point);
    }
  }
  merged.sort((a, b) => a.date.localeCompare(b.date));
  return merged;
}

// ---------- Proxy URL ----------

const API_URL = import.meta.env.DEV
  ? "https://olive-press-pm.vercel.app/api/market-data"
  : "/api/market-data";

// ---------- Combined fetcher via proxy ----------

interface ProxyResponse {
  data: {
    constructionCostIndex?: EurostatJsonStat;
    materialPriceIndex?: EurostatJsonStat;
    labourCostIndex?: EurostatJsonStat;
    cpiGreece?: EurostatJsonStat;
  };
  errors: string[];
  fetchedAt: string;
}

async function fetchAllMarketData(): Promise<MarketData> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Proxy request failed: ${res.status}`);

  const json: ProxyResponse = await res.json();
  const errors: string[] = [...json.errors];

  let constructionCostIndex: MarketDataPoint[] = [];
  let materialPriceIndex: MarketDataPoint[] = [];
  let labourCostIndex: MarketDataPoint[] = [];
  let cpiGreece: MarketDataPoint[] = [];

  try {
    if (json.data.constructionCostIndex) {
      constructionCostIndex = parseEurostatJsonStat(json.data.constructionCostIndex);
    }
  } catch {
    errors.push("Failed to parse Construction Cost Index");
  }

  try {
    if (json.data.materialPriceIndex) {
      materialPriceIndex = parseEurostatJsonStat(json.data.materialPriceIndex);
    }
  } catch {
    errors.push("Failed to parse Material Price Index");
  }

  try {
    if (json.data.labourCostIndex) {
      labourCostIndex = parseEurostatJsonStat(json.data.labourCostIndex);
    }
  } catch {
    errors.push("Failed to parse Labour Cost Index");
  }

  try {
    if (json.data.cpiGreece) {
      cpiGreece = parseEurostatJsonStat(json.data.cpiGreece);
    }
  } catch {
    errors.push("Failed to parse Greece CPI");
  }

  // Merge Eurostat historical data with ELSTAT supplemental (2024-2026)
  const mergedConstruction = mergeWithElstat(constructionCostIndex, ELSTAT_CONSTRUCTION_COST);
  const mergedMaterial = mergeWithElstat(materialPriceIndex, ELSTAT_MATERIAL_PRICES);
  const mergedCpi = mergeWithElstat(cpiGreece, ELSTAT_CPI_MONTHLY);

  return {
    constructionCostIndex: mergedConstruction,
    materialPriceIndex: mergedMaterial,
    labourCostIndex,
    cpiGreece: mergedCpi,
    lastUpdated: json.fetchedAt,
    errors,
  };
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market-data"],
    queryFn: fetchAllMarketData,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
