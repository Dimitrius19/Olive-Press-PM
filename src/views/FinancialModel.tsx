import { useCallback, useMemo, useState } from "react";
import {
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
  Line,
  ComposedChart,
} from "recharts";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  SCENARIOS,
  INVESTMENT,
  ROOMS,
  OPERATING_DAYS_FULL,
  MODEL_YEARS,
  runScenario,
  solveAdrForTargetYield,
  solveOccupancyForTargetYield,
  type ScenarioInputs,
  type ScenarioResult,
} from "../lib/financial-model";
import { SliderInput } from "../components/SliderInput";

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
    headerBg: "bg-red-50",
    chart: "#f87171",
  },
  {
    name: "Base",
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    headerBg: "bg-amber-50",
    chart: "#fbbf24",
  },
  {
    name: "Optimistic",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    headerBg: "bg-emerald-50",
    chart: "#10b981",
  },
];

// ---------- Main Component ----------

// ---------- Target Yield Solver ----------

function TargetYieldSolver({
  baseInputs,
  investment,
  rooms,
  operatingDays,
  modelYears,
}: {
  baseInputs: ScenarioInputs;
  investment: number;
  rooms: number;
  operatingDays: number;
  modelYears: number;
}) {
  const [targetYield, setTargetYield] = useState(6);

  const target = targetYield / 100;
  const requiredAdr = useMemo(
    () => solveAdrForTargetYield(baseInputs, target, investment, rooms, operatingDays, modelYears),
    [baseInputs, target, investment, rooms, operatingDays, modelYears],
  );
  const requiredOcc = useMemo(
    () => solveOccupancyForTargetYield(baseInputs, target, investment, rooms, operatingDays, modelYears),
    [baseInputs, target, investment, rooms, operatingDays, modelYears],
  );

  const requiredNoi = investment * target;
  // Pre-tax equivalent: what pre-tax yield would produce this after-tax yield
  const preTaxEquivalent = baseInputs.corporateTaxRate < 1
    ? target / (1 - baseInputs.corporateTaxRate) + baseInputs.propertyTaxAnnual / investment
    : target;

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-amber-50/30 rounded-xl border border-emerald-200/60 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-800">Target Yield Solver</h3>
          <p className="text-xs text-stone-500">What does it take to hit your target after-tax return?</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">Target After-Tax Yield:</span>
          <input
            type="number"
            value={targetYield}
            onChange={(e) => setTargetYield(Number(e.target.value))}
            min={1}
            max={20}
            step={0.5}
            className="w-16 text-center text-lg font-bold text-emerald-700 border border-emerald-300 rounded-lg px-2 py-1 bg-white"
          />
          <span className="text-lg font-bold text-emerald-700">%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-stone-200/60">
          <p className="text-xs text-stone-500 uppercase tracking-wide">Required After-Tax NOI</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">
            €{(requiredNoi / 1000).toFixed(0)}K<span className="text-sm font-normal text-stone-400">/year</span>
          </p>
          <p className="text-xs text-stone-400 mt-1">= {targetYield}% x €{(investment / 1_000_000).toFixed(1)}M investment</p>
          <p className="text-xs text-stone-400 mt-0.5">Pre-tax equivalent: ~{fmtPct(preTaxEquivalent)} YoC</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-stone-200/60">
          <p className="text-xs text-stone-500 uppercase tracking-wide">Required ADR</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">
            €{requiredAdr}<span className="text-sm font-normal text-stone-400">/night</span>
          </p>
          <p className="text-xs text-stone-400 mt-1">
            at {Math.round(baseInputs.occupancyMature * 100)}% occupancy, {Math.round(baseInputs.gopMargin * 100)}% GOP
          </p>
          <p className={`text-xs mt-1 ${requiredAdr <= 250 ? "text-emerald-600" : requiredAdr <= 350 ? "text-amber-600" : "text-red-600"}`}>
            {requiredAdr <= 200 ? "Achievable" : requiredAdr <= 300 ? "Ambitious" : "Very challenging"} for Lesvos market
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-stone-200/60">
          <p className="text-xs text-stone-500 uppercase tracking-wide">Required Occupancy</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">
            {requiredOcc}%<span className="text-sm font-normal text-stone-400"> mature</span>
          </p>
          <p className="text-xs text-stone-400 mt-1">
            at €{baseInputs.adrYear1} ADR, {Math.round(baseInputs.gopMargin * 100)}% GOP
          </p>
          <p className={`text-xs mt-1 ${requiredOcc <= 65 ? "text-emerald-600" : requiredOcc <= 80 ? "text-amber-600" : "text-red-600"}`}>
            {requiredOcc <= 60 ? "Achievable" : requiredOcc <= 75 ? "Ambitious" : requiredOcc <= 90 ? "Very challenging" : "Not feasible"} for seasonal operation
          </p>
        </div>
      </div>
    </div>
  );
}

export function FinancialModel() {
  // Editable global parameters
  const [investment, setInvestment] = useState(INVESTMENT);
  const [rooms, setRooms] = useState(ROOMS);
  const [operatingDays, setOperatingDays] = useState(OPERATING_DAYS_FULL);
  const [modelYears, setModelYears] = useState(MODEL_YEARS);

  // Global tax & financing parameters (same across all scenarios)
  const [corporateTaxRate, setCorporateTaxRate] = useState(0.22);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(15000);
  const [ltvPct, setLtvPct] = useState(0);
  const [interestRate, setInterestRate] = useState(0.045);
  const [loanTermYears, setLoanTermYears] = useState(15);

  // Editable scenario inputs (deep clone defaults)
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs[]>(
    () => SCENARIOS.map((s) => ({ ...s })),
  );

  // Assumptions panel open/closed
  const [assumptionsOpen, setAssumptionsOpen] = useState(true);

  // Detailed projections accordion
  const [expandedScenario, setExpandedScenario] = useState<number>(1);

  // Helper to update a single field on one scenario
  const updateScenario = useCallback(
    (idx: number, field: keyof ScenarioInputs, value: number) => {
      setScenarioInputs((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
      );
    },
    [],
  );

  // Reset everything to defaults
  const resetDefaults = useCallback(() => {
    setScenarioInputs(SCENARIOS.map((s) => ({ ...s })));
    setInvestment(INVESTMENT);
    setRooms(ROOMS);
    setOperatingDays(OPERATING_DAYS_FULL);
    setModelYears(MODEL_YEARS);
    setCorporateTaxRate(0.22);
    setPropertyTaxAnnual(15000);
    setLtvPct(0);
    setInterestRate(0.045);
    setLoanTermYears(15);
  }, []);

  // Merge global tax/debt into each scenario before running
  const results = useMemo<ScenarioResult[]>(
    () =>
      scenarioInputs.map((s) =>
        runScenario(
          {
            ...s,
            corporateTaxRate,
            propertyTaxAnnual,
            ltvPct,
            interestRate,
            loanTermYears,
          },
          investment,
          rooms,
          operatingDays,
          modelYears,
        ),
      ),
    [scenarioInputs, investment, rooms, operatingDays, modelYears, corporateTaxRate, propertyTaxAnnual, ltvPct, interestRate, loanTermYears],
  );

  // Cash flow chart data
  const cashFlowData = useMemo(() => {
    const years = results[0].projections.map((p) => p.year);
    return years.map((year, i) => ({
      year: year.toString(),
      Pessimistic: results[0].projections[i].cumulativeNoi / 1_000_000,
      Base: results[1].projections[i].cumulativeNoi / 1_000_000,
      Optimistic: results[2].projections[i].cumulativeNoi / 1_000_000,
      "Pessimistic (After-Tax)": results[0].projections[i].cumulativeLeveragedCf / 1_000_000,
      "Base (After-Tax)": results[1].projections[i].cumulativeLeveragedCf / 1_000_000,
      "Optimistic (After-Tax)": results[2].projections[i].cumulativeLeveragedCf / 1_000_000,
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

  // Build base inputs for the solver (with global tax/debt merged)
  const baseInputsForSolver = useMemo<ScenarioInputs>(
    () => ({
      ...scenarioInputs[1],
      corporateTaxRate,
      propertyTaxAnnual,
      ltvPct,
      interestRate,
      loanTermYears,
    }),
    [scenarioInputs, corporateTaxRate, propertyTaxAnnual, ltvPct, interestRate, loanTermYears],
  );

  // Collapsed summary text (Base scenario values)
  const base = scenarioInputs[1];
  const collapsedSummary = `ADR €${base.adrYear1} | Occ ${(base.occupancyYear1 * 100).toFixed(0)}% | GOP ${(base.gopMargin * 100).toFixed(0)}% | Cap Rate ${(base.terminalCapRate * 100).toFixed(1)}% (Base)`;

  const hasDebt = ltvPct > 0;

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
          {modelYears}-year investment return analysis — 3 scenarios
        </p>
      </div>

      {/* B. Adjust Assumptions Panel */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <button
          onClick={() => setAssumptionsOpen(!assumptionsOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {assumptionsOpen ? (
              <ChevronDown size={16} className="text-stone-400" />
            ) : (
              <ChevronRight size={16} className="text-stone-400" />
            )}
            <h3 className="text-sm font-semibold text-stone-700">
              Adjust Assumptions
            </h3>
          </div>
          {!assumptionsOpen && (
            <span className="text-xs text-stone-400 font-mono">
              {collapsedSummary}
            </span>
          )}
        </button>

        {assumptionsOpen && (
          <div className="px-5 pb-5 space-y-5">
            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={resetDefaults}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <RotateCcw size={12} />
                Reset to Defaults
              </button>
            </div>

            {/* Global Parameters */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Global Parameters
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">
                    Total Investment
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-400">€</span>
                    <input
                      type="number"
                      value={parseFloat((investment / 1_000_000).toFixed(2))}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v))
                          setInvestment(
                            Math.min(20_000_000, Math.max(5_000_000, v * 1_000_000)),
                          );
                      }}
                      min={5}
                      max={20}
                      step={0.1}
                      className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-stone-400">M</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v))
                        setRooms(Math.min(100, Math.max(20, v)));
                    }}
                    min={20}
                    max={100}
                    step={1}
                    className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">
                    Operating Days/Year
                  </label>
                  <input
                    type="number"
                    value={operatingDays}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v))
                        setOperatingDays(Math.min(365, Math.max(90, v)));
                    }}
                    min={90}
                    max={365}
                    step={10}
                    className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">
                    Model Duration
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={modelYears}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v))
                          setModelYears(Math.min(20, Math.max(5, v)));
                      }}
                      min={5}
                      max={20}
                      step={1}
                      className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-stone-400">years</span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Global Tax & Financing Parameters */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Tax & Financing
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SliderInput
                  label="Corporate Tax Rate"
                  value={parseFloat((corporateTaxRate * 100).toFixed(1))}
                  onChange={(v) => setCorporateTaxRate(v / 100)}
                  min={0}
                  max={35}
                  step={1}
                  suffix="%"
                  compact
                />
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">Property Tax (ENFIA)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-400">€</span>
                    <input
                      type="number"
                      value={propertyTaxAnnual}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v))
                          setPropertyTaxAnnual(Math.min(50000, Math.max(0, v)));
                      }}
                      min={0}
                      max={50000}
                      step={1000}
                      className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-stone-400">/yr</span>
                  </div>
                </div>
                <SliderInput
                  label="LTV (Debt %)"
                  value={parseFloat((ltvPct * 100).toFixed(0))}
                  onChange={(v) => setLtvPct(v / 100)}
                  min={0}
                  max={80}
                  step={5}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Interest Rate"
                  value={parseFloat((interestRate * 100).toFixed(2))}
                  onChange={(v) => setInterestRate(v / 100)}
                  min={0}
                  max={10}
                  step={0.25}
                  suffix="%"
                  compact
                />
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">Loan Term</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={loanTermYears}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v))
                          setLoanTermYears(Math.min(30, Math.max(5, v)));
                      }}
                      min={5}
                      max={30}
                      step={1}
                      className="w-20 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-stone-400">years</span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Per-scenario inputs: 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {scenarioInputs.map((scenario, idx) => {
                const style = SCENARIO_STYLES[idx];
                return (
                  <div key={scenario.name} className="space-y-4">
                    <h4
                      className={`text-sm font-semibold ${style.text} px-2 py-1 rounded ${style.headerBg}`}
                    >
                      {scenario.name}
                    </h4>

                    {/* Revenue inputs */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                        Revenue
                      </p>
                      <SliderInput
                        label="ADR Year 1"
                        value={scenario.adrYear1}
                        onChange={(v) =>
                          updateScenario(idx, "adrYear1", v)
                        }
                        min={80}
                        max={400}
                        step={10}
                        suffix="€"
                        compact
                      />
                      <SliderInput
                        label="Occupancy Year 1"
                        value={parseFloat(
                          (scenario.occupancyYear1 * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "occupancyYear1", v / 100)
                        }
                        min={20}
                        max={90}
                        step={1}
                        suffix="%"
                        compact
                      />
                      <SliderInput
                        label="Mature Occupancy"
                        value={parseFloat(
                          (scenario.occupancyMature * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "occupancyMature", v / 100)
                        }
                        min={30}
                        max={95}
                        step={1}
                        suffix="%"
                        compact
                      />
                      <SliderInput
                        label="ADR Annual Growth"
                        value={parseFloat(
                          (scenario.adrGrowth * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "adrGrowth", v / 100)
                        }
                        min={0}
                        max={8}
                        step={0.5}
                        suffix="%"
                        compact
                      />
                      <SliderInput
                        label="F&B per Night"
                        value={scenario.fbPerNight}
                        onChange={(v) =>
                          updateScenario(idx, "fbPerNight", v)
                        }
                        min={0}
                        max={100}
                        step={5}
                        suffix="€"
                        compact
                      />
                      <SliderInput
                        label="Other Revenue"
                        value={parseFloat(
                          (scenario.otherRevenuePct * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "otherRevenuePct", v / 100)
                        }
                        min={0}
                        max={25}
                        step={1}
                        suffix="%"
                        compact
                      />
                    </div>

                    {/* Cost inputs */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                        Costs
                      </p>
                      <SliderInput
                        label="GOP Margin"
                        value={parseFloat(
                          (scenario.gopMargin * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "gopMargin", v / 100)
                        }
                        min={15}
                        max={60}
                        step={1}
                        suffix="%"
                        compact
                      />
                      <SliderInput
                        label="CapEx Reserve"
                        value={parseFloat(
                          (scenario.capexReservePct * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "capexReservePct", v / 100)
                        }
                        min={1}
                        max={10}
                        step={0.5}
                        suffix="%"
                        compact
                      />
                      <SliderInput
                        label="OpEx Growth"
                        value={parseFloat(
                          (scenario.opexGrowth * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "opexGrowth", v / 100)
                        }
                        min={0}
                        max={6}
                        step={0.5}
                        suffix="%"
                        compact
                      />
                    </div>

                    {/* Exit inputs */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                        Exit
                      </p>
                      <SliderInput
                        label="Terminal Cap Rate"
                        value={parseFloat(
                          (scenario.terminalCapRate * 100).toFixed(1),
                        )}
                        onChange={(v) =>
                          updateScenario(idx, "terminalCapRate", v / 100)
                        }
                        min={4}
                        max={12}
                        step={0.5}
                        suffix="%"
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* C. Scenario Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((result, i) => {
          const style = SCENARIO_STYLES[i];
          const dscrColor = result.debtServiceCoverageRatio >= 1.5
            ? "text-emerald-600"
            : result.debtServiceCoverageRatio >= 1.2
              ? "text-amber-600"
              : "text-red-600";
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
                      : `>${modelYears} years`}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Yr 3 RevPAR</p>
                  <p className="font-semibold text-stone-700">
                    {result.projections[2]
                      ? `€${result.projections[2].revpar.toFixed(0)}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Terminal Value</p>
                  <p className="font-semibold text-stone-700">
                    {fmtEuroM(result.terminalValue)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-stone-400">Yield on Cost</p>
                    <p className={`text-xl font-bold ${result.yieldOnCost >= 0.06 ? "text-emerald-600" : result.yieldOnCost >= 0.04 ? "text-amber-600" : "text-red-600"}`}>
                      {fmtPct(result.yieldOnCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Stabilized NOI</p>
                    <p className="font-semibold text-stone-700 text-sm">
                      {fmtEuroK(result.stabilizedNoi)}/yr
                    </p>
                  </div>
                </div>
              </div>

              {/* After-Tax section */}
              <div className="mt-3 pt-3 border-t border-stone-200/60">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-stone-400">After-Tax Yield on Cost</p>
                    <p className={`text-lg font-bold ${result.afterTaxYieldOnCost >= 0.04 ? "text-emerald-600" : result.afterTaxYieldOnCost >= 0.025 ? "text-amber-600" : "text-red-600"}`}>
                      {fmtPct(result.afterTaxYieldOnCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">After-Tax NOI</p>
                    <p className="font-semibold text-stone-700 text-sm">
                      {result.projections[2]
                        ? `${fmtEuroK(result.projections[2].afterTaxNoi)}/yr`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leveraged section (only if LTV > 0) */}
              {hasDebt && (
                <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-stone-400">Leveraged IRR</p>
                      <p className={`text-lg font-bold ${style.text}`}>
                        {fmtPct(result.leveragedIrr)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">DSCR</p>
                      <p className={`text-lg font-bold ${dscrColor}`}>
                        {result.debtServiceCoverageRatio === Infinity
                          ? "N/A"
                          : result.debtServiceCoverageRatio.toFixed(2) + "x"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Equity: {fmtEuroM(result.equityInvested)}</span>
                    <span>Loan: {fmtEuroM(result.loanAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* D. Target Yield Solver */}
      <TargetYieldSolver
        baseInputs={baseInputsForSolver}
        investment={investment}
        rooms={rooms}
        operatingDays={operatingDays}
        modelYears={modelYears}
      />

      {/* E. Cash Flow Chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">
          Cumulative Cash Flow
        </h3>
        <p className="text-xs text-stone-400 mb-4">
          Solid lines: pre-tax NOI | Dashed lines: after-tax{hasDebt ? " (less debt service)" : ""}
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={cashFlowData}>
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
              y={investment / 1_000_000}
              stroke="#78716c"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Investment €${(investment / 1_000_000).toFixed(1)}M`,
                position: "right",
                fill: "#78716c",
                fontSize: 11,
              }}
            />
            {/* Pre-tax solid area lines */}
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
            {/* After-tax dashed lines */}
            <Line
              type="monotone"
              dataKey="Pessimistic (After-Tax)"
              stroke={SCENARIO_STYLES[0].chart}
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Base (After-Tax)"
              stroke={SCENARIO_STYLES[1].chart}
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Optimistic (After-Tax)"
              stroke={SCENARIO_STYLES[2].chart}
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
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
                IRR {fmtPct(result.irr)} | After-Tax IRR {fmtPct(result.afterTaxIrr)}
                {hasDebt && ` | Leveraged IRR ${fmtPct(result.leveragedIrr)}`}
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
                        Tax
                      </th>
                      <th className="text-right px-3 py-2 text-stone-500 font-medium">
                        After-Tax NOI
                      </th>
                      {hasDebt && (
                        <>
                          <th className="text-right px-3 py-2 text-stone-500 font-medium">
                            Debt Svc
                          </th>
                          <th className="text-right px-3 py-2 text-stone-500 font-medium">
                            Lev. CF
                          </th>
                        </>
                      )}
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
                        <td className="px-3 py-2 text-right font-mono text-red-500">
                          {fmtEuroK(p.incomeTax + p.propertyTax)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-stone-700">
                          {fmtEuroK(p.afterTaxNoi)}
                        </td>
                        {hasDebt && (
                          <>
                            <td className="px-3 py-2 text-right font-mono text-red-500">
                              {fmtEuroK(p.debtService)}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono font-semibold ${p.leveragedCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {fmtEuroK(p.leveragedCashFlow)}
                            </td>
                          </>
                        )}
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold ${
                            p.cumulativeNoi >= investment
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

      {/* G. Assumptions Methodology */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-semibold text-stone-800">How Assumptions Were Derived</h3>
        <div className="text-sm text-stone-600 space-y-3 leading-relaxed">
          <div>
            <span className="font-medium text-stone-700">ADR (€140–€220):</span>{" "}
            Based on Lesvos 4-star hotel market rates from Booking.com and Expedia for 2025-2026 season.
            Molyvos premium properties range €120–€250/night. The base case €180 reflects a renovated
            4-star heritage hotel with pool and beach access. Pessimistic assumes limited brand recognition
            in Year 1; optimistic reflects strong positioning as a boutique destination.
          </div>
          <div>
            <span className="font-medium text-stone-700">Occupancy (45–75%):</span>{" "}
            Greek island hotels average 55–65% annual occupancy for seasonal properties (INSETE/SETE data).
            Lesvos is a developing destination compared to Santorini/Mykonos, with growing tourism (+12% YoY
            2023-2025). Year 1 is lower due to ramp-up and limited booking pipeline. Mature occupancy
            reached by Year 3 per industry standard.
          </div>
          <div>
            <span className="font-medium text-stone-700">GOP Margin (30–45%):</span>{" "}
            STR Global and HotStats benchmarks for European 4-star seasonal hotels show GOP margins of
            32–42%. Heritage properties have higher maintenance costs but command premium rates. The base
            38% aligns with well-managed Greek boutique hotels (Katikies, Grace, Cavo Tagoo benchmarks).
          </div>
          <div>
            <span className="font-medium text-stone-700">ADR Growth (2–5%):</span>{" "}
            Greek hotel ADR grew 4.2% CAGR 2019-2025 (STR). Base case 3.5% assumes continued recovery
            and Lesvos tourism development. Pessimistic 2% matches inflation only; optimistic 5% assumes
            strong brand positioning and Lesvos becoming a premium destination.
          </div>
          <div>
            <span className="font-medium text-stone-700">F&B Revenue (€25–€45/night):</span>{" "}
            Based on the Elia Restaurant Molyvos (on-site restaurant) performance benchmarks.
            Greek hotel F&B capture rate is typically 25-40% of ADR. Base €35 = 19% of ADR, conservative
            given the beachfront restaurant and pool bar.
          </div>
          <div>
            <span className="font-medium text-stone-700">Terminal Cap Rate (6–9%):</span>{" "}
            Greek hotel cap rates range 6.5–9.5% (JLL, Cushman & Wakefield 2025 reports). Heritage
            properties in prime locations command lower cap rates. Base 7.5% reflects a stabilized
            4-star asset in a developing but attractive market.
          </div>
          <div>
            <span className="font-medium text-stone-700">Operating Season (180 days):</span>{" "}
            Lesvos tourism season runs mid-April to mid-October. Some properties extend to November.
            180 days is standard for seasonal Aegean island hotels. Year 1 partial (120 days) assumes
            April 2029 opening with limited pre-season bookings.
          </div>
          <div>
            <span className="font-medium text-stone-700">Corporate Tax (22%):</span>{" "}
            Greek corporate income tax rate is 22% (Law 4799/2021). Applied to NOI before property tax.
            ENFIA property tax estimated at €15K/year for a 48-room heritage hotel property in Lesvos.
          </div>
        </div>
      </div>

      {/* H. Sensitivity Note */}
      <p className="text-xs text-stone-400 leading-relaxed">
        Model assumes seasonal operation ({operatingDays} days/year){hasDebt
          ? `, ${(ltvPct * 100).toFixed(0)}% LTV at ${(interestRate * 100).toFixed(1)}% over ${loanTermYears} years`
          : ", no debt financing"}.
        Corporate tax rate: {(corporateTaxRate * 100).toFixed(0)}%. ENFIA: €{propertyTaxAnnual.toLocaleString()}/yr.
        Terminal value calculated using NOI / Cap Rate method. IRR
        includes terminal value at Year {modelYears}. Investment total:{" "}
        {fmtEuroM(investment)} excl. VAT. Partial first year (2029):{" "}
        {Math.round(operatingDays * (120 / 180))} operating days.
      </p>
    </div>
  );
}
