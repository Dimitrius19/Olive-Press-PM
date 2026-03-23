import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ShieldCheck,
  Ruler,
  Calculator,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  generateEstimate,
  KEY_VARIANCES,
  type BoQCategory,
  type BottomUpEstimate,
} from "../lib/bottom-up-estimate";
import { useMarketData, type MarketDataPoint } from "../hooks/useMarketData";
import { useBudgetLines } from "../hooks/useBudget";
import {
  validateBudgetLines,
  scenarioImpact,
  quartersForMidpoint,
  type IndexType,
} from "../lib/budget-validator";
import {
  benchmarkAllLines,
  summarizeBenchmarks,
  PROJECT_AREAS,
  type BenchmarkResult,
  type BenchmarkSummary,
} from "../lib/unit-rate-benchmarks";

// ---------- ANICON Budget Constants ----------

const ANICON = {
  constructionCostPerSqm: 1255,
  structuralRepairPerSqm: 355,
  surroundingAreaConstruction: 120,
  surroundingAreaMEP: 41,
  ffePerKey: 34000,
  contingency: 0.1,
  inflationAssumption: 4.0,
  elstatCPI: 2.7,
  constructionCostIndexGrowth: 2.1,
  totalBudget: 10_557_940,
  totalRooms: 48,
  costPerRoom: 219_957,
  reportDate: "2026-03",
  targetCompletion: "Q2 2028",
};

// Benchmarks
const COST_PER_SQM_RANGE = { min: 950, max: 2200 };
const COST_PER_ROOM_RANGE = { min: 150_000, max: 300_000 };

// ---------- Helpers ----------

function yoyGrowthRate(points: MarketDataPoint[]): number | null {
  if (points.length < 5) return null;
  const latest = points[points.length - 1];
  const yearAgo = points[points.length - 5]; // quarterly data, 4 quarters back
  if (!latest || !yearAgo || yearAgo.value === 0) return null;
  return ((latest.value - yearAgo.value) / yearAgo.value) * 100;
}

function latestValue(points: MarketDataPoint[]): number | null {
  if (points.length === 0) return null;
  return points[points.length - 1].value;
}

function latestDate(points: MarketDataPoint[]): string | null {
  if (points.length === 0) return null;
  return points[points.length - 1].date;
}

function trafficLight(
  value: number | null,
  greenMax: number,
  amberMax: number,
): "green" | "amber" | "red" | "unknown" {
  if (value == null) return "unknown";
  if (value <= greenMax) return "green";
  if (value <= amberMax) return "amber";
  return "red";
}

const trafficColors = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  unknown: "bg-stone-300",
};

const trafficTextColors = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  unknown: "text-stone-500",
};

const trafficBgColors = {
  green: "bg-emerald-50 border-emerald-200",
  amber: "bg-amber-50 border-amber-200",
  red: "bg-red-50 border-red-200",
  unknown: "bg-stone-50 border-stone-200",
};

function TrafficDot({ color }: { color: "green" | "amber" | "red" | "unknown" }) {
  return <span className={`inline-block w-3 h-3 rounded-full ${trafficColors[color]}`} />;
}

function pctPosition(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------- Sub-components ----------

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-amber-50/40 p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">{children}</h3>;
}

function RangeBar({
  value,
  min,
  max,
  label,
  formatFn = fmtEur,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  formatFn?: (n: number) => string;
}) {
  const pos = pctPosition(value, min, max);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-stone-400 mb-1">
        <span>{formatFn(min)}</span>
        <span>{formatFn(max)}</span>
      </div>
      <div className="relative h-4 rounded-full bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100">
        <div
          className="absolute top-0 h-4 w-1 bg-stone-800 rounded-full"
          style={{ left: `${pos}%` }}
        />
        <div
          className="absolute -top-6 text-xs font-semibold text-stone-800 whitespace-nowrap"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        >
          {label}: {formatFn(value)}
        </div>
      </div>
    </div>
  );
}

function BenchmarkRangeBar({
  low,
  mid,
  high,
  value,
  unit,
}: {
  low: number;
  mid: number;
  high: number;
  value: number;
  unit: string;
}) {
  const range = high - low;
  const midPos = range > 0 ? ((mid - low) / range) * 100 : 50;
  const valuePos = range > 0 ? Math.max(0, Math.min(110, ((value - low) / range) * 100)) : 50;
  const isPercent = unit === "% of construction";
  const formatVal = (n: number) =>
    isPercent
      ? `${n.toFixed(1)}%`
      : unit === "€/lump"
        ? fmtEur(n)
        : fmtEur(n);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-stone-400 mb-1">
        <span>Low: {formatVal(low)}</span>
        <span>Mid: {formatVal(mid)}</span>
        <span>High: {formatVal(high)}</span>
      </div>
      <div className="relative h-4 rounded-full bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100">
        {/* Mid marker */}
        <div
          className="absolute top-0 h-4 w-px bg-stone-400"
          style={{ left: `${midPos}%` }}
        />
        {/* Value marker */}
        <div
          className="absolute top-0 h-4 w-1.5 bg-stone-800 rounded-full"
          style={{ left: `${Math.min(valuePos, 100)}%` }}
        />
        <div
          className="absolute -top-5 text-[10px] font-bold text-stone-800 whitespace-nowrap"
          style={{
            left: `${Math.min(valuePos, 100)}%`,
            transform: "translateX(-50%)",
          }}
        >
          ANICON: {formatVal(value)}
        </div>
      </div>
    </div>
  );
}

function buildProjectionData(
  actuals: MarketDataPoint[],
  _reportDate: string,
  annualGrowthPct: number,
): { date: string; actual: number | null; projected: number | null }[] {
  if (actuals.length === 0) return [];

  // Take last 8 quarters of actuals
  const recent = actuals.slice(-8);
  const chartData: { date: string; actual: number | null; projected: number | null }[] =
    recent.map((p) => ({
      date: p.date,
      actual: p.value,
      projected: null as number | null,
    }));

  // Add projection from last actual going forward 8 quarters
  const lastActual = recent[recent.length - 1];
  if (lastActual) {
    const quarterlyGrowth = Math.pow(1 + annualGrowthPct / 100, 0.25);
    let currentVal = lastActual.value;
    // Parse last date to generate future quarters
    const lastDateStr = lastActual.date;
    // Eurostat dates look like "2025-Q4" or "2025Q4" or just "2025-12"
    let year: number;
    let quarter: number;

    const qMatch = lastDateStr.match(/(\d{4})-?Q(\d)/);
    if (qMatch) {
      year = parseInt(qMatch[1]);
      quarter = parseInt(qMatch[2]);
    } else {
      // Fallback: parse as date
      const d = new Date(lastDateStr);
      year = d.getFullYear();
      quarter = Math.ceil((d.getMonth() + 1) / 3);
    }

    // Mark the last actual point as also the start of projection
    chartData[chartData.length - 1].projected = currentVal;

    for (let i = 1; i <= 8; i++) {
      quarter++;
      if (quarter > 4) {
        quarter = 1;
        year++;
      }
      currentVal *= quarterlyGrowth;
      chartData.push({
        date: `${year}-Q${quarter}`,
        actual: null,
        projected: Math.round(currentVal * 100) / 100,
      });
    }
  }

  return chartData;
}

// ---------- Main Component ----------

const INDEX_LABELS: Record<IndexType, string> = {
  construction: "Construction",
  material: "Material",
  cpi: "CPI",
  blend: "Blend",
};

const MIDPOINT_OPTIONS = ["2026-Q4", "2027-Q1", "2027-Q2", "2027-Q3", "2027-Q4"];

function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function riskDotColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-500";
    case "high":
      return "bg-red-500";
  }
}

function riskRowBg(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "bg-emerald-50/40";
    case "medium":
      return "bg-amber-50/40";
    case "high":
      return "bg-red-50/40";
  }
}

export function MarketCheck() {
  const { data, isLoading, error } = useMarketData();
  const { data: budgetLines } = useBudgetLines();
  const [midpoint, setMidpoint] = useState("2027-Q2");

  const analysis = useMemo(() => {
    if (!data) return null;

    const cciGrowth = yoyGrowthRate(data.constructionCostIndex);
    const matGrowth = yoyGrowthRate(data.materialPriceIndex);
    const cpiLatest = latestValue(data.cpiGreece);
    const cpiDate = latestDate(data.cpiGreece);

    // YoY CPI growth
    let cpiGrowth: number | null = null;
    if (data.cpiGreece.length >= 13) {
      // Monthly data — compare 12 months apart
      const latest = data.cpiGreece[data.cpiGreece.length - 1];
      const yearAgo = data.cpiGreece[data.cpiGreece.length - 13];
      if (latest && yearAgo && yearAgo.value !== 0) {
        cpiGrowth = ((latest.value - yearAgo.value) / yearAgo.value) * 100;
      }
    } else if (data.cpiGreece.length >= 2) {
      // Fallback: compare last two available
      const latest = data.cpiGreece[data.cpiGreece.length - 1];
      const prev = data.cpiGreece[data.cpiGreece.length - 2];
      if (latest && prev && prev.value !== 0) {
        cpiGrowth = ((latest.value - prev.value) / prev.value) * 100;
      }
    }

    // Inflation traffic light
    const inflationSignal = trafficLight(
      Math.max(cciGrowth ?? 0, cpiGrowth ?? 0),
      ANICON.inflationAssumption,
      6,
    );

    // Cost per sqm position
    const sqmPos = pctPosition(
      ANICON.constructionCostPerSqm,
      COST_PER_SQM_RANGE.min,
      COST_PER_SQM_RANGE.max,
    );

    // Cost per room position
    const roomPos = pctPosition(
      ANICON.costPerRoom,
      COST_PER_ROOM_RANGE.min,
      COST_PER_ROOM_RANGE.max,
    );

    // Material alerts: check if any moved >5% (using latest available growth)
    const materialAlert = matGrowth != null && Math.abs(matGrowth) > 5;

    // Overall verdict
    let verdict: "REASONABLE" | "AT RISK" | "NEEDS REVIEW" = "REASONABLE";
    if (inflationSignal === "red" || materialAlert) {
      verdict = "AT RISK";
    } else if (inflationSignal === "amber" || sqmPos > 75 || roomPos > 75) {
      verdict = "NEEDS REVIEW";
    }

    return {
      cciGrowth,
      matGrowth,
      cpiGrowth,
      cpiLatest,
      cpiDate,
      inflationSignal,
      sqmPos,
      roomPos,
      materialAlert,
      verdict,
    };
  }, [data]);

  // Chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    return buildProjectionData(
      data.constructionCostIndex,
      ANICON.reportDate,
      ANICON.inflationAssumption,
    );
  }, [data]);

  // Budget validation
  const validatedLines = useMemo(() => {
    if (!data || !budgetLines) return null;
    return validateBudgetLines(
      budgetLines,
      data.constructionCostIndex,
      data.materialPriceIndex,
      data.cpiGreece,
      midpoint,
    );
  }, [data, budgetLines, midpoint]);

  const budgetSummary = useMemo(() => {
    if (!validatedLines || validatedLines.length === 0) return null;
    const totalAnicon = validatedLines.reduce((s, v) => s + v.line.anicon_revised, 0);
    const totalAdjusted = validatedLines.reduce((s, v) => s + v.adjustedEstimate, 0);
    const totalDelta = totalAdjusted - totalAnicon;
    const deltaPct = totalAnicon > 0 ? totalDelta / totalAnicon : 0;
    return { totalAnicon, totalAdjusted, totalDelta, deltaPct };
  }, [validatedLines]);

  const scenarios = useMemo(() => {
    if (!budgetLines) return null;
    const qtrs = quartersForMidpoint(midpoint);
    return [
      { rate: 0.02, label: "2% annual", isAnicon: false, ...scenarioImpact(budgetLines, 0.02, qtrs) },
      { rate: 0.04, label: "4% annual", isAnicon: true, ...scenarioImpact(budgetLines, 0.04, qtrs) },
      { rate: 0.06, label: "6% annual", isAnicon: false, ...scenarioImpact(budgetLines, 0.06, qtrs) },
    ];
  }, [budgetLines, midpoint]);

  // Unit rate benchmarking
  const benchmarkResults = useMemo<BenchmarkResult[]>(() => {
    if (!budgetLines) return [];
    return benchmarkAllLines(budgetLines, PROJECT_AREAS);
  }, [budgetLines]);

  const benchmarkSummary = useMemo<BenchmarkSummary | null>(() => {
    if (benchmarkResults.length === 0 || !budgetLines) return null;
    return summarizeBenchmarks(benchmarkResults, budgetLines.length);
  }, [benchmarkResults, budgetLines]);

  // Bottom-up cost estimate
  const bottomUpEstimate = useMemo<BottomUpEstimate>(() => generateEstimate(), []);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleCategory(name: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  // ---------- Render ----------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-stone-400">Loading market data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 flex items-center gap-2">
          <XCircle size={18} />
          Failed to load market data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <TrendingUp size={24} className="text-emerald-600" />
          Market Sanity Check
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Validating ANICON budget assumptions against current market data
        </p>
      </div>

      {/* API Errors Banner */}
      {data && data.errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Some data sources are unavailable:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                {data.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inflation Validation */}
        <Card>
          <CardTitle>Inflation Validation</CardTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">ANICON assumption</span>
              <span className="font-bold text-stone-800">{ANICON.inflationAssumption}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">CPI YoY (FRED)</span>
              <span className="font-semibold text-stone-700">
                {analysis?.cpiGrowth != null ? `${fmt(analysis.cpiGrowth)}%` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">Construction Cost Index YoY</span>
              <span className="font-semibold text-stone-700">
                {analysis?.cciGrowth != null ? `${fmt(analysis.cciGrowth)}%` : "N/A"}
              </span>
            </div>
            <div className="border-t border-stone-200 pt-3 flex items-center gap-2">
              <TrafficDot color={analysis?.inflationSignal ?? "unknown"} />
              <span className={`text-sm font-medium ${trafficTextColors[analysis?.inflationSignal ?? "unknown"]}`}>
                {analysis?.inflationSignal === "green" && "Within budget assumption"}
                {analysis?.inflationSignal === "amber" && "Slightly above assumption"}
                {analysis?.inflationSignal === "red" && "Exceeds budget assumption"}
                {(analysis?.inflationSignal === "unknown" || !analysis) && "Data unavailable"}
              </span>
            </div>
          </div>
        </Card>

        {/* Construction Cost Benchmark */}
        <Card>
          <CardTitle>Construction Cost / m2</CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">ANICON estimate</span>
              <span className="font-bold text-stone-800">{fmtEur(ANICON.constructionCostPerSqm)}/m2</span>
            </div>
            <div className="text-xs text-stone-400">
              4-star hotel renovation range (Greece)
            </div>
            <RangeBar
              value={ANICON.constructionCostPerSqm}
              min={COST_PER_SQM_RANGE.min}
              max={COST_PER_SQM_RANGE.max}
              label="ANICON"
            />
            <p className="text-xs text-stone-400 mt-4 flex items-start gap-1">
              <Info size={12} className="mt-0.5 shrink-0" />
              Heritage/preserved buildings typically 30-50% above standard construction
            </p>
          </div>
        </Card>

        {/* Cost Per Room Benchmark */}
        <Card>
          <CardTitle>Cost Per Room</CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">ANICON estimate</span>
              <span className="font-bold text-stone-800">{fmtEur(ANICON.costPerRoom)}/room</span>
            </div>
            <div className="text-xs text-stone-400">
              European 4-star hotel renovation benchmark
            </div>
            <RangeBar
              value={ANICON.costPerRoom}
              min={COST_PER_ROOM_RANGE.min}
              max={COST_PER_ROOM_RANGE.max}
              label="ANICON"
            />
            <p className="text-xs text-stone-400 mt-4">
              {ANICON.totalRooms} rooms | Total budget: {fmtEur(ANICON.totalBudget)}
            </p>
          </div>
        </Card>
      </div>

      {/* Construction Cost Index Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardTitle>Greece Construction Cost Index Trend</CardTitle>
          <p className="text-xs text-stone-400 mb-4">
            Base 2015 = 100 | Dashed line: ANICON 4% annual projection from report date
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fafaf9",
                    border: "1px solid #d6d3d1",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <ReferenceLine
                  x={ANICON.reportDate.replace("-", "-Q1 ").length > 0 ? undefined : undefined}
                  stroke="#78716c"
                  strokeDasharray="3 3"
                  label=""
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: "#059669", r: 3 }}
                  connectNulls={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#a8a29e"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ fill: "#a8a29e", r: 3 }}
                  connectNulls={false}
                  name="4% Projection"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Material Price Alerts */}
      <Card>
        <CardTitle>Material Price Alerts</CardTitle>
        {analysis?.matGrowth != null ? (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                analysis.materialAlert
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              {analysis.materialAlert ? (
                <AlertTriangle size={18} className="text-red-500" />
              ) : (
                <CheckCircle size={18} className="text-emerald-500" />
              )}
              <div>
                <p className="text-sm font-medium text-stone-800">
                  Overall Material Input Prices: {fmt(analysis.matGrowth)}% YoY
                </p>
                <p className="text-xs text-stone-500">
                  {analysis.materialAlert
                    ? "Material costs have moved significantly since budget preparation"
                    : "Material costs remain within expected range"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {[
                { name: "Overall", icon: TrendingUp },
                { name: "Steel/Metal", icon: TrendingUp },
                { name: "Concrete/Minerals", icon: TrendingUp },
                { name: "Wood/Insulation", icon: TrendingUp },
                { name: "Electromechanical", icon: TrendingUp },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-lg border border-stone-200 bg-white/60 p-2 text-center"
                >
                  <p className="text-stone-400 text-[10px] uppercase tracking-wide">{cat.name}</p>
                  <p className="font-semibold text-stone-600 mt-0.5">
                    {cat.name === "Overall" && analysis.matGrowth != null
                      ? `${fmt(analysis.matGrowth)}%`
                      : "--"}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-stone-400">
              Note: Detailed category breakdown requires individual Eurostat series. Only overall index is fetched.
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            Material price data unavailable. Eurostat API may be blocked by CORS.
          </p>
        )}
      </Card>

      {/* Summary Verdict */}
      <Card
        className={`${
          analysis?.verdict === "REASONABLE"
            ? trafficBgColors.green
            : analysis?.verdict === "AT RISK"
              ? trafficBgColors.red
              : analysis?.verdict === "NEEDS REVIEW"
                ? trafficBgColors.amber
                : trafficBgColors.unknown
        }`}
      >
        <CardTitle>Summary Verdict</CardTitle>
        <div className="flex items-center gap-3">
          {analysis?.verdict === "REASONABLE" && (
            <CheckCircle size={24} className="text-emerald-600" />
          )}
          {analysis?.verdict === "AT RISK" && <XCircle size={24} className="text-red-600" />}
          {analysis?.verdict === "NEEDS REVIEW" && (
            <AlertTriangle size={24} className="text-amber-600" />
          )}
          {!analysis && <Info size={24} className="text-stone-400" />}
          <div>
            <p className="text-lg font-bold text-stone-800">
              Budget appears{" "}
              <span
                className={
                  analysis?.verdict === "REASONABLE"
                    ? "text-emerald-700"
                    : analysis?.verdict === "AT RISK"
                      ? "text-red-700"
                      : analysis?.verdict === "NEEDS REVIEW"
                        ? "text-amber-700"
                        : "text-stone-500"
                }
              >
                {analysis?.verdict ?? "UNKNOWN"}
              </span>
            </p>
            <p className="text-sm text-stone-500 mt-1">
              Based on: inflation delta (
              {analysis?.inflationSignal === "green"
                ? "within range"
                : analysis?.inflationSignal === "amber"
                  ? "slightly above"
                  : analysis?.inflationSignal === "red"
                    ? "exceeds assumption"
                    : "unknown"}
              ), cost/m2 at {analysis ? `${Math.round(analysis.sqmPos)}%` : "--"} of benchmark
              range, cost/room at {analysis ? `${Math.round(analysis.roomPos)}%` : "--"} of
              benchmark range
            </p>
          </div>
        </div>
      </Card>

      {/* ===== Budget Line Validation ===== */}
      {validatedLines && budgetSummary && (
        <>
          {/* Section Header */}
          <div className="pt-4 border-t border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
              <ShieldCheck size={24} className="text-emerald-600" />
              Budget Line Validation
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Each budget line mapped to a relevant price index and time-adjusted to construction midpoint
            </p>
          </div>

          {/* Summary Bar */}
          <div
            className={`rounded-xl border p-5 ${
              Math.abs(budgetSummary.deltaPct) > 0.05
                ? "border-red-200 bg-red-50/60"
                : Math.abs(budgetSummary.deltaPct) > 0.02
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-emerald-200 bg-emerald-50/60"
            }`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">ANICON Budget</p>
                <p className="text-xl font-bold text-stone-800 mt-1">
                  &euro;{fmtK(budgetSummary.totalAnicon)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Time-Adjusted Total</p>
                <p className="text-xl font-bold text-stone-800 mt-1">
                  &euro;{fmtK(budgetSummary.totalAdjusted)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Total Exposure</p>
                <p className="text-xl font-bold text-stone-800 mt-1">
                  +&euro;{fmtK(budgetSummary.totalDelta)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Exposure %</p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    Math.abs(budgetSummary.deltaPct) > 0.05
                      ? "text-red-700"
                      : Math.abs(budgetSummary.deltaPct) > 0.02
                        ? "text-amber-700"
                        : "text-emerald-700"
                  }`}
                >
                  +{fmtPct(budgetSummary.deltaPct)}
                </p>
              </div>
            </div>
          </div>

          {/* Construction Midpoint Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-stone-600">
              Construction spending midpoint:
            </label>
            <select
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={midpoint}
              onChange={(e) => setMidpoint(e.target.value)}
            >
              {MIDPOINT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                  {opt === "2027-Q2" ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Heatmap Table */}
          <Card>
            <CardTitle>Risk Heatmap</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left">
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Budget Line
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      ANICON Est.
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Index
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      YoY Growth
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      Adjusted Est.
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      Delta
                    </th>
                    <th className="py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validatedLines.map((v) => (
                    <tr
                      key={v.line.id}
                      className={`border-b border-stone-100 ${riskRowBg(v.risk)}`}
                      title={v.rationale}
                    >
                      <td className="py-2 pr-3">
                        <div className="font-medium text-stone-700 truncate max-w-[220px]">
                          {v.line.description}
                        </div>
                        <div className="text-[10px] text-stone-400">{v.rationale}</div>
                      </td>
                      <td className="py-2 pr-3 text-right text-stone-700 tabular-nums">
                        &euro;{fmtK(v.line.anicon_revised)}
                      </td>
                      <td className="py-2 pr-3 text-stone-600">{INDEX_LABELS[v.indexType]}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                        {v.currentIndexGrowthYoy != null ? fmtPct(v.currentIndexGrowthYoy) : "4.0%*"}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                        &euro;{fmtK(v.adjustedEstimate)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                        +&euro;{fmtK(v.delta)} ({fmtPct(v.deltaPct)})
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${riskDotColor(v.risk)}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-stone-400 mt-3">
              * Lines marked 4.0%* use ANICON&apos;s default assumption (actual index data unavailable)
            </p>
          </Card>

          {/* Inflation Scenario Cards */}
          {scenarios && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((s) => (
                <Card
                  key={s.label}
                  className={
                    s.isAnicon
                      ? "ring-2 ring-emerald-500/40 border-emerald-300"
                      : ""
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <CardTitle>If {s.label}</CardTitle>
                    {s.isAnicon && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        ANICON assumption
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Adjusted total</span>
                      <span className="font-bold text-stone-800">&euro;{fmtK(s.totalAdjusted)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Delta from budget</span>
                      <span className="font-semibold text-stone-700">
                        +&euro;{fmtK(s.totalDelta)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Increase</span>
                      <span
                        className={`font-semibold ${
                          s.rate > 0.05
                            ? "text-red-700"
                            : s.rate > 0.03
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }`}
                      >
                        +{fmtPct(s.totalOriginal > 0 ? s.totalDelta / s.totalOriginal : 0)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== Unit Rate Benchmarking ===== */}
      {benchmarkResults.length > 0 && benchmarkSummary && (
        <>
          {/* Section Header */}
          <div className="pt-4 border-t border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Ruler size={24} className="text-emerald-600" />
              Unit Rate Benchmarking
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Comparing ANICON estimates against Greek construction market rates
              (PEDMEDE/ATEE 2025)
            </p>
          </div>

          {/* Overall Assessment */}
          <div
            className={`rounded-xl border p-5 ${
              benchmarkSummary.netPosition === "accurate"
                ? "border-emerald-200 bg-emerald-50/60"
                : benchmarkSummary.netPosition === "aggressive"
                  ? "border-red-200 bg-red-50/60"
                  : "border-amber-200 bg-amber-50/60"
            }`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">
                  Lines Matched
                </p>
                <p className="text-xl font-bold text-stone-800 mt-1">
                  {benchmarkSummary.matchedCount} of{" "}
                  {benchmarkSummary.totalLines}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">
                  Within Market Range
                </p>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {benchmarkSummary.withinRangeCount} of{" "}
                  {benchmarkSummary.matchedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">
                  Potential Overbudgeting
                </p>
                <p className="text-xl font-bold text-amber-700 mt-1">
                  {benchmarkSummary.totalOverbudgeted > 0
                    ? `€${fmtK(benchmarkSummary.totalOverbudgeted)}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">
                  Potential Underbudgeting
                </p>
                <p className="text-xl font-bold text-red-700 mt-1">
                  {benchmarkSummary.totalUnderbudgeted > 0
                    ? `€${fmtK(benchmarkSummary.totalUnderbudgeted)}`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center gap-3">
              {benchmarkSummary.netPosition === "accurate" && (
                <CheckCircle size={20} className="text-emerald-600" />
              )}
              {benchmarkSummary.netPosition === "aggressive" && (
                <AlertTriangle size={20} className="text-red-600" />
              )}
              {benchmarkSummary.netPosition === "conservative" && (
                <Info size={20} className="text-amber-600" />
              )}
              <p className="text-sm text-stone-700">
                Budget appears{" "}
                <span
                  className={`font-bold ${
                    benchmarkSummary.netPosition === "accurate"
                      ? "text-emerald-700"
                      : benchmarkSummary.netPosition === "aggressive"
                        ? "text-red-700"
                        : "text-amber-700"
                  }`}
                >
                  {benchmarkSummary.netPosition}
                </span>{" "}
                vs. market rates (weighted position:{" "}
                {Math.round(benchmarkSummary.weightedPosition)}% of range)
              </p>
            </div>
          </div>

          {/* Benchmark Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmarkResults.map((r) => {
              const verdictClasses = r.verdictColor.split(" ");
              const textClass = verdictClasses[0] || "";
              const bgClass = verdictClasses.slice(1).join(" ");
              return (
                <Card key={r.benchmark.id + r.line.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-stone-800 text-sm">
                        {r.line.description}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {r.benchmark.description}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bgClass} ${textClass}`}
                    >
                      {r.verdictLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-stone-400">ANICON Total</p>
                      <p className="font-bold text-stone-800">
                        {fmtEur(r.line.anicon_revised)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">
                        Implied Unit Rate
                      </p>
                      <p className="font-bold text-stone-800">
                        {r.benchmark.unit === "% of construction"
                          ? `${r.impliedRate.toFixed(1)}%`
                          : r.benchmark.unit === "€/lump"
                            ? fmtEur(r.impliedRate)
                            : `${fmtEur(r.impliedRate)}/${r.benchmark.unit.replace("€/", "")}`}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 mb-1">
                    Quantity: {r.quantityLabel}
                  </p>

                  {/* Range Bar */}
                  <BenchmarkRangeBar
                    low={r.benchmark.lowRange}
                    mid={r.benchmark.midRange}
                    high={r.benchmark.highRange}
                    value={r.impliedRate}
                    unit={r.benchmark.unit}
                  />

                  {/* Savings/Risk callout */}
                  {r.savingsOpportunity > 0 && (
                    <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                      <Info size={11} className="shrink-0" />
                      Potential savings: {fmtEur(r.savingsOpportunity)} if
                      negotiated to market mid
                    </p>
                  )}
                  {r.riskExposure > 0 && (
                    <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" />
                      Risk: {fmtEur(r.riskExposure)} underbudgeted vs. market
                      mid
                    </p>
                  )}

                  <p className="text-[10px] text-stone-400 mt-2">
                    Source: {r.benchmark.source}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {r.benchmark.notes}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Summary Table */}
          <Card>
            <CardTitle>Benchmark Summary</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left">
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Line
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      ANICON
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      Unit Rate
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      Market Mid
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                      Position
                    </th>
                    <th className="py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">
                      Verdict
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.map((r) => {
                    const verdictClasses = r.verdictColor.split(" ");
                    const textClass = verdictClasses[0] || "";
                    return (
                      <tr
                        key={r.benchmark.id + r.line.id}
                        className="border-b border-stone-100"
                      >
                        <td className="py-2 pr-3">
                          <div className="font-medium text-stone-700 truncate max-w-[200px]">
                            {r.line.description}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                          {fmtEur(r.line.anicon_revised)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                          {r.benchmark.unit === "% of construction"
                            ? `${r.impliedRate.toFixed(1)}%`
                            : fmtEur(r.impliedRate)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                          {r.benchmark.unit === "% of construction"
                            ? `${r.benchmark.midRange}%`
                            : fmtEur(r.benchmark.midRange)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-stone-700">
                          {Math.round(r.positionInRange)}%
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`text-[10px] font-semibold ${textClass}`}
                          >
                            {r.verdictLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="border-t-2 border-stone-300 font-bold">
                    <td className="py-2 pr-3 text-stone-800">Total Benchmarked</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-stone-800">
                      {fmtEur(benchmarkSummary.totalBenchmarked)}
                    </td>
                    <td className="py-2 pr-3 text-right text-stone-500" colSpan={2}>
                      Weighted avg position
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-stone-800">
                      {Math.round(benchmarkSummary.weightedPosition)}%
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`text-[10px] font-semibold ${
                          benchmarkSummary.netPosition === "accurate"
                            ? "text-emerald-700"
                            : benchmarkSummary.netPosition === "aggressive"
                              ? "text-red-700"
                              : "text-amber-700"
                        }`}
                      >
                        {benchmarkSummary.netPosition.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ===== Bottom-Up Cost Estimate ===== */}
      <div className="pt-4 border-t border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Calculator size={24} className="text-emerald-600" />
          Bottom-Up Cost Estimate
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Independent estimate from physical quantities, challenging ANICON numbers from first principles
        </p>
      </div>

      {/* Comparison Card */}
      <div
        className={`rounded-xl border p-5 ${
          bottomUpEstimate.comparisonWithAnicon.deltaPct > 20
            ? "border-amber-300 bg-amber-50/60"
            : "border-emerald-200 bg-emerald-50/60"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ANICON column */}
          <div className="rounded-lg border border-stone-200 bg-white/70 p-4">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-3">
              ANICON Estimate
            </p>
            <p className="text-3xl font-bold text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.comparisonWithAnicon.aniconTotal)}
            </p>
            <p className="text-xs text-stone-500 mt-1">Excl. VAT | March 2026 report</p>
          </div>
          {/* Bottom-up column */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-3">
              Bottom-Up Estimate
            </p>
            <p className="text-3xl font-bold text-emerald-800 font-mono">
              {fmtEur(bottomUpEstimate.totalExclVat)}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Excl. VAT | Incl. 10% contingency + 4% inflation
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-200 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-stone-700">
            The bottom-up estimate is{" "}
            <span className="font-bold text-amber-700">
              {fmtEur(bottomUpEstimate.comparisonWithAnicon.delta)} (
              {bottomUpEstimate.comparisonWithAnicon.deltaPct.toFixed(0)}%) lower
            </span>{" "}
            than ANICON&apos;s sanity check. Key drivers: FF&E specification level,
            pre-opening scope, and structural contingency assumptions.
          </p>
        </div>
      </div>

      {/* Summary Breakdown */}
      <Card>
        <CardTitle>Cost Summary</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-stone-400">Construction (1-7)</p>
            <p className="text-lg font-bold text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.constructionSubtotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">OP II (8)</p>
            <p className="text-lg font-bold text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.opIISubtotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">FF&E + OS&E (9-10)</p>
            <p className="text-lg font-bold text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.ffeSubtotal + bottomUpEstimate.oseSubtotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Soft Costs + Pre-Opening (11-12)</p>
            <p className="text-lg font-bold text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.softCostsSubtotal + bottomUpEstimate.preOpeningSubtotal)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-stone-200">
          <div>
            <p className="text-xs text-stone-400">Base Total</p>
            <p className="text-sm font-bold text-stone-700 font-mono">
              {fmtEur(bottomUpEstimate.baseTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Contingency (10%)</p>
            <p className="text-sm font-bold text-stone-700 font-mono">
              {fmtEur(bottomUpEstimate.contingency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Inflation (4%)</p>
            <p className="text-sm font-bold text-stone-700 font-mono">
              {fmtEur(bottomUpEstimate.inflation)}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">VAT (24%)</p>
            <p className="text-sm font-bold text-stone-700 font-mono">
              {fmtEur(bottomUpEstimate.vat)}
            </p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown Table */}
      <Card>
        <CardTitle>Detailed Bill of Quantities</CardTitle>
        <div className="space-y-0">
          {bottomUpEstimate.categories.map((cat: BoQCategory) => {
            const isExpanded = expandedCategories.has(cat.name);
            return (
              <div key={cat.name} className="border-b border-stone-100 last:border-b-0">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="w-full flex items-center justify-between py-3 px-2 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-stone-400" />
                    ) : (
                      <ChevronRight size={16} className="text-stone-400" />
                    )}
                    <span className="font-semibold text-sm text-stone-800">{cat.name}</span>
                    <span className="text-xs text-stone-400">
                      ({cat.lines.length} items)
                    </span>
                  </div>
                  <span className="font-bold text-sm text-stone-800 font-mono">
                    {fmtEur(cat.subtotal)}
                  </span>
                </button>
                {isExpanded && (
                  <div className="overflow-x-auto pb-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 text-left">
                          <th className="py-1.5 px-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="py-1.5 px-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider text-right">
                            Qty
                          </th>
                          <th className="py-1.5 px-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider text-center">
                            Unit
                          </th>
                          <th className="py-1.5 px-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider text-right">
                            Rate
                          </th>
                          <th className="py-1.5 px-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.lines.map((l) => (
                          <tr
                            key={l.id}
                            className="border-b border-stone-50 hover:bg-stone-50/50"
                          >
                            <td className="py-1.5 px-2 text-stone-700">
                              <div>{l.description}</div>
                              <div className="text-[10px] text-stone-400">{l.notes}</div>
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums text-stone-700 font-mono">
                              {l.unit === "ls"
                                ? "1"
                                : l.quantity.toLocaleString("en-IE")}
                            </td>
                            <td className="py-1.5 px-2 text-center text-stone-500 text-xs">
                              {l.unit}
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums text-stone-700 font-mono">
                              {l.unit === "ls"
                                ? "--"
                                : fmtEur(l.unitRate)}
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums text-stone-800 font-mono font-semibold">
                              {fmtEur(l.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {/* Grand total row */}
          <div className="flex items-center justify-between py-3 px-2 border-t-2 border-stone-300 bg-stone-50/50">
            <span className="font-bold text-stone-800">
              Total (excl. contingency, inflation, VAT)
            </span>
            <span className="font-bold text-lg text-stone-800 font-mono">
              {fmtEur(bottomUpEstimate.baseTotal)}
            </span>
          </div>
        </div>
      </Card>

      {/* Key Differences */}
      <Card>
        <CardTitle>Key Differences vs ANICON</CardTitle>
        <div className="space-y-3">
          {KEY_VARIANCES.map((v) => (
            <div
              key={v.category}
              className="rounded-lg border border-stone-200 bg-white/60 p-3"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-semibold text-sm text-stone-800">{v.category}</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-mono">
                  {fmtEur(v.delta)} gap
                </span>
              </div>
              <div className="flex gap-4 text-xs text-stone-500 mb-2">
                <span>
                  Bottom-up: <span className="font-semibold text-stone-700 font-mono">{fmtEur(v.bottomUp)}</span>
                </span>
                <span>
                  ANICON: <span className="font-semibold text-stone-700 font-mono">{fmtEur(v.anicon)}</span>
                </span>
              </div>
              <p className="text-xs text-stone-600">{v.explanation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Methodology Note */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-stone-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Methodology
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Bottom-up estimate based on physical quantities from ANICON architectural report
              (March 2026), multiplied by current Greek construction unit rates (PEDMEDE/ATEE
              2025-2026, +15% island logistics premium). Quantities are estimated from available
              drawings and may differ from final design. This estimate is indicative — a full
              BoQ requires detailed design drawings.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-stone-400 text-center">
        Data sources: Eurostat STS_COPI_Q, FRED GRCPIALLMINMEI & OPCNRE01GRQ661N |
        Last fetched: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "N/A"} |
        Target completion: {ANICON.targetCompletion}
      </p>
    </div>
  );
}
