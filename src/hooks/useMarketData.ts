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

  return {
    constructionCostIndex,
    materialPriceIndex,
    labourCostIndex,
    cpiGreece,
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
