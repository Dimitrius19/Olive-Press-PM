import { useQuery } from "@tanstack/react-query";

export interface MarketDataPoint {
  date: string;
  value: number;
}

export interface MarketData {
  constructionCostIndex: MarketDataPoint[];
  materialPriceIndex: MarketDataPoint[];
  cpiGreece: MarketDataPoint[];
  residentialCostIndex: MarketDataPoint[];
  lastUpdated: string;
  errors: string[];
}

// ---------- Eurostat SDMX JSON parsing ----------

interface EurostatDimension {
  id: string;
  label: string;
  category: {
    index: Record<string, number>;
    label: Record<string, string>;
  };
}

interface EurostatResponse {
  value: Record<string, number>;
  dimension: Record<string, EurostatDimension>;
  id: string[];
}

function parseEurostatResponse(json: EurostatResponse): MarketDataPoint[] {
  const timeDim = json.dimension.time ?? json.dimension.TIME_PERIOD;
  if (!timeDim) return [];

  const timeIndex = timeDim.category.index;
  const timeLabels = timeDim.category.label;
  const points: MarketDataPoint[] = [];

  for (const [key, idx] of Object.entries(timeIndex)) {
    const val = json.value[String(idx)];
    if (val != null) {
      points.push({
        date: timeLabels[key] ?? key,
        value: val,
      });
    }
  }

  // Sort chronologically
  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

async function fetchEurostatSeries(url: string): Promise<MarketDataPoint[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat ${res.status}`);
  const json = await res.json();
  return parseEurostatResponse(json);
}

// ---------- FRED parsing ----------

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

async function fetchFredSeries(seriesId: string): Promise<MarketDataPoint[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=DEMO_KEY&file_type=json&sort_order=desc&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${res.status}`);
  const json: FredResponse = await res.json();

  return json.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Combined fetcher ----------

async function fetchAllMarketData(): Promise<MarketData> {
  const errors: string[] = [];

  const eurostatCCI = fetchEurostatSeries(
    "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/STS_COPI_Q/Q.I15.CC.F.EL/?format=JSON&lang=en",
  ).catch((e) => {
    errors.push(`Construction Cost Index: ${e instanceof Error ? e.message : "unavailable (CORS)"}`);
    return [] as MarketDataPoint[];
  });

  const eurostatMaterial = fetchEurostatSeries(
    "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/STS_COPI_Q/Q.I15.CC_E01.F.EL/?format=JSON&lang=en",
  ).catch((e) => {
    errors.push(`Material Price Index: ${e instanceof Error ? e.message : "unavailable (CORS)"}`);
    return [] as MarketDataPoint[];
  });

  const fredCPI = fetchFredSeries("GRCPIALLMINMEI").catch((e) => {
    errors.push(`Greece CPI: ${e instanceof Error ? e.message : "unavailable"}`);
    return [] as MarketDataPoint[];
  });

  const fredResidential = fetchFredSeries("OPCNRE01GRQ661N").catch((e) => {
    errors.push(`Residential Cost Index: ${e instanceof Error ? e.message : "unavailable"}`);
    return [] as MarketDataPoint[];
  });

  const [constructionCostIndex, materialPriceIndex, cpiGreece, residentialCostIndex] =
    await Promise.all([eurostatCCI, eurostatMaterial, fredCPI, fredResidential]);

  return {
    constructionCostIndex,
    materialPriceIndex,
    cpiGreece,
    residentialCostIndex,
    lastUpdated: new Date().toISOString(),
    errors,
  };
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market-data"],
    queryFn: fetchAllMarketData,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}
