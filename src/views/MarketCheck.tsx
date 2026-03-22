import { useMemo } from "react";
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
} from "lucide-react";
import { useMarketData, type MarketDataPoint } from "../hooks/useMarketData";

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

export function MarketCheck() {
  const { data, isLoading, error } = useMarketData();

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

      {/* Footer */}
      <p className="text-[11px] text-stone-400 text-center">
        Data sources: Eurostat STS_COPI_Q, FRED GRCPIALLMINMEI & OPCNRE01GRQ661N |
        Last fetched: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "N/A"} |
        Target completion: {ANICON.targetCompletion}
      </p>
    </div>
  );
}
