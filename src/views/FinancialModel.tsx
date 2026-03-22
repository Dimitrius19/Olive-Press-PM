import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Calculator, ChevronDown, ChevronRight } from "lucide-react";
import {
  SCENARIOS,
  INVESTMENT,
  runScenario,
  type ScenarioResult,
} from "../lib/financial-model";

// ---------- Formatting Helpers ----------

function fmtEuroK(v: number): string {
  if (Math.abs(v) >= 1_000_000) {
    return `€${(v / 1_000_000).toFixed(2)}M`;
  }
  return `€${(v / 1_000).toFixed(0)}K`;
}

function fmtEuroM(v: number): string {
  return `€${(v / 1_000_000).toFixed(2)}M`;
}

function fmtPct(v: number, decimals = 1): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

// ---------- Scenario Colors ----------

const SCENARIO_STYLES = [
  {
    name: "Pessimistic",
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    chart: "#f87171", // red-400
  },
  {
    name: "Base",
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    chart: "#fbbf24", // amber-400
  },
  {
    name: "Optimistic",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    chart: "#10b981", // emerald-500
  },
];

// ---------- Main Component ----------

export function FinancialModel() {
  const results = useMemo<ScenarioResult[]>(
    () => SCENARIOS.map(runScenario),
    [],
  );

  const [expandedScenario, setExpandedScenario] = useState<number>(1); // Base default

  // Cash flow chart data
  const cashFlowData = useMemo(() => {
    const years = results[0].projections.map((p) => p.year);
    return years.map((year, i) => ({
      year: year.toString(),
      Pessimistic: results[0].projections[i].cumulativeNoi / 1_000_000,
      Base: results[1].projections[i].cumulativeNoi / 1_000_000,
      Optimistic: results[2].projections[i].cumulativeNoi / 1_000_000,
    }));
  }, [results]);

  // Revenue breakdown for Base scenario
  const revenueData = useMemo(() => {
    return results[1].projections.map((p) => ({
      year: p.year.toString(),
      "Room Revenue": Math.round(p.roomRevenue / 1_000),
      "F&B Revenue": Math.round(p.fbRevenue / 1_000),
      "Other Revenue": Math.round(p.otherRevenue / 1_000),
    }));
  }, [results]);

  return (
    <div className="space-y-8">
      {/* A. Header */}
      <div>
        <div className="flex items-center gap-3">
          <Calculator className="text-amber-600" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">
            Financial Model
          </h2>
        </div>
        <p className="text-stone-500 mt-1 ml-10">
          10-year investment return analysis — 3 scenarios
        </p>
      </div>

      {/* B. Scenario Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((result, i) => {
          const style = SCENARIO_STYLES[i];
          return (
            <div
              key={result.inputs.name}
              className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}
                >
                  {result.inputs.name}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs text-stone-500 uppercase tracking-wide">
                  IRR
                </p>
                <p className={`text-3xl font-bold ${style.text}`}>
                  {fmtPct(result.irr)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-stone-400 text-xs">ROI</p>
                  <p className="font-semibold text-stone-700">
                    {fmtPct(result.roi, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Payback</p>
                  <p className="font-semibold text-stone-700">
                    {result.paybackYear
                      ? `${result.paybackYear}`
                      : ">10 years"}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Yr 3 RevPAR</p>
                  <p className="font-semibold text-stone-700">
                    €{result.projections[2].revpar.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Terminal Value</p>
                  <p className="font-semibold text-stone-700">
                    {fmtEuroM(result.terminalValue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* C. Key Assumptions Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">
            Key Assumptions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-5 py-2 text-stone-500 font-medium">
                  Parameter
                </th>
                {SCENARIOS.map((s, i) => (
                  <th
                    key={s.name}
                    className={`text-right px-5 py-2 font-medium ${SCENARIO_STYLES[i].text}`}
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {[
                {
                  label: "ADR Year 1",
                  values: SCENARIOS.map((s) => `€${s.adrYear1}`),
                },
                {
                  label: "Occupancy Year 1",
                  values: SCENARIOS.map((s) => fmtPct(s.occupancyYear1, 0)),
                },
                {
                  label: "Occupancy Mature (Yr 3+)",
                  values: SCENARIOS.map((s) => fmtPct(s.occupancyMature, 0)),
                },
                {
                  label: "ADR Annual Growth",
                  values: SCENARIOS.map((s) => fmtPct(s.adrGrowth, 1)),
                },
                {
                  label: "GOP Margin",
                  values: SCENARIOS.map((s) => fmtPct(s.gopMargin, 0)),
                },
                {
                  label: "F&B per Room Night",
                  values: SCENARIOS.map((s) => `€${s.fbPerNight}`),
                },
                {
                  label: "Other Revenue (% of Room)",
                  values: SCENARIOS.map((s) => fmtPct(s.otherRevenuePct, 0)),
                },
                {
                  label: "CapEx Reserve",
                  values: SCENARIOS.map((s) => fmtPct(s.capexReservePct, 0)),
                },
                {
                  label: "Terminal Cap Rate",
                  values: SCENARIOS.map((s) => fmtPct(s.terminalCapRate, 1)),
                },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-stone-50/50">
                  <td className="px-5 py-2 text-stone-600">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className="px-5 py-2 text-right font-mono text-stone-700"
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. Cash Flow Chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">
          Cumulative Net Operating Income
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#a8a29e" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#a8a29e"
              tickFormatter={(v: number) => `€${v.toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => [`€${Number(value).toFixed(2)}M`]}
              labelFormatter={(label) => `Year ${String(label)}`}
            />
            <Legend />
            <ReferenceLine
              y={INVESTMENT / 1_000_000}
              stroke="#78716c"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Investment €${(INVESTMENT / 1_000_000).toFixed(1)}M`,
                position: "right",
                fill: "#78716c",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="Pessimistic"
              stroke={SCENARIO_STYLES[0].chart}
              fill={SCENARIO_STYLES[0].chart}
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Base"
              stroke={SCENARIO_STYLES[1].chart}
              fill={SCENARIO_STYLES[1].chart}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Optimistic"
              stroke={SCENARIO_STYLES[2].chart}
              fill={SCENARIO_STYLES[2].chart}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* E. Revenue Breakdown (Base Scenario) */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">
          Revenue Breakdown — Base Scenario
        </h3>
        <p className="text-xs text-stone-400 mb-4">In thousands (€K)</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#a8a29e" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#a8a29e"
              tickFormatter={(v: number) => `€${v}K`}
            />
            <Tooltip
              formatter={(value, name) => [
                `€${Number(value)}K`,
                String(name),
              ]}
              labelFormatter={(label) => `Year ${String(label)}`}
            />
            <Legend />
            <Bar
              dataKey="Room Revenue"
              stackId="rev"
              fill="#d97706"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="F&B Revenue"
              stackId="rev"
              fill="#059669"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="Other Revenue"
              stackId="rev"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* F. Detailed Projections Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">
            Detailed Projections
          </h3>
        </div>
        {results.map((result, idx) => (
          <div key={result.inputs.name}>
            <button
              onClick={() =>
                setExpandedScenario(expandedScenario === idx ? -1 : idx)
              }
              className={`w-full flex items-center gap-2 px-5 py-3 text-sm font-medium hover:bg-stone-50 transition-colors ${
                SCENARIO_STYLES[idx].text
              } ${idx > 0 ? "border-t border-stone-100" : ""}`}
            >
              {expandedScenario === idx ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {result.inputs.name} Scenario
              <span className="text-stone-400 font-normal ml-2">
                IRR {fmtPct(result.irr)} | ROI {fmtPct(result.roi, 0)}
              </span>
            </button>

            {expandedScenario === idx && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left px-4 py-2 text-stone-500 font-medium">
                        Year
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        Occ%
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        ADR
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        RevPAR
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        Room Rev
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        F&B
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        Other
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        Total Rev
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        GOP
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        NOI
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        Cumulative
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {result.projections.map((p) => (
                      <tr key={p.year} className="hover:bg-stone-50/50">
                        <td className="px-4 py-2 font-medium text-stone-700">
                          {p.year}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtPct(p.occupancy, 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          €{p.adr.toFixed(0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          €{p.revpar.toFixed(0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtEuroK(p.roomRevenue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtEuroK(p.fbRevenue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtEuroK(p.otherRevenue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-stone-700">
                          {fmtEuroK(p.totalRevenue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtEuroK(p.gop)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-stone-600">
                          {fmtEuroK(p.noi)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold ${
                            p.cumulativeNoi >= 10_557_940
                              ? "text-emerald-600"
                              : "text-stone-700"
                          }`}
                        >
                          {fmtEuroM(p.cumulativeNoi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* G. Sensitivity Note */}
      <p className="text-xs text-stone-400 leading-relaxed">
        Model assumes seasonal operation (180 days/year), no debt financing.
        Terminal value calculated using NOI / Cap Rate method. IRR includes
        terminal value at Year 10. Investment total: €10,557,940 excl. VAT.
        Partial first year (2029): 120 operating days.
      </p>
    </div>
  );
}
