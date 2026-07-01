import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  BUILD_SELL_DEFAULTS,
  BUILD_SELL_SCENARIOS,
  buildDrawdownSchedule,
  runBuildSellScenario,
  type BuildSellInputs,
  type BuildSellResult,
} from "../lib/build-sell-model";
import {
  runEllinikonRiskScenarios,
  type RiskScenarioOutcome,
} from "../lib/ellinikon-risk-scenarios";
import { SliderInput } from "../components/SliderInput";
import { StatusBadge } from "../components/StatusBadge";
import { useCapex } from "../lib/capex-context";

// ---------- Formatting Helpers ----------

function fmtEuroM(v: number): string {
  return `€${(v / 1_000_000).toFixed(2)}M`;
}

function fmtEuro(v: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPct(v: number, decimals = 1): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

function fmtMult(v: number): string {
  return `${v.toFixed(2)}x`;
}

// ---------- Scenario Colors ----------

const SCENARIO_STYLES = [
  {
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-800",
    headerBg: "bg-sky-50",
    chart: "#0ea5e9",
  },
  {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    headerBg: "bg-emerald-50",
    chart: "#10b981",
  },
];

// ---------- Small editable number field ----------

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-stone-500">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-stone-400">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          min={min}
          max={max}
          step={step}
          className="w-24 px-1.5 py-0.5 font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        {suffix && <span className="text-xs text-stone-400">{suffix}</span>}
      </div>
    </div>
  );
}

// ---------- Small boolean toggle ----------

function Toggle({
  label,
  value,
  onChange,
  onLabel = "Yes",
  offLabel = "No",
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-stone-500">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`flex items-center gap-2 px-2 py-1 rounded border text-xs font-medium transition-colors ${
          value
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        <span
          className={`inline-block w-8 h-4 rounded-full relative transition-colors ${
            value ? "bg-emerald-400" : "bg-amber-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
              value ? "left-[1.125rem]" : "left-0.5"
            }`}
          />
        </span>
        {value ? onLabel : offLabel}
      </button>
    </div>
  );
}

// ---------- Detailed breakdown table ----------

function Row({
  label,
  value,
  note,
  bold,
  negative,
  positive,
  indent,
}: {
  label: string;
  value: string;
  note?: string;
  bold?: boolean;
  negative?: boolean;
  positive?: boolean;
  indent?: boolean;
}) {
  return (
    <tr className="hover:bg-stone-50/50">
      <td
        className={`px-4 py-1.5 ${indent ? "pl-8" : ""} ${
          bold ? "font-semibold text-stone-800" : "text-stone-600"
        }`}
      >
        {label}
      </td>
      <td
        className={`px-4 py-1.5 text-right font-mono ${
          bold ? "font-semibold" : ""
        } ${
          negative
            ? "text-red-500"
            : positive
              ? "text-emerald-600"
              : "text-stone-700"
        }`}
      >
        {value}
      </td>
      <td className="px-4 py-1.5 text-xs text-stone-400">{note ?? ""}</td>
    </tr>
  );
}

function ScenarioBreakdown({ r }: { r: BuildSellResult }) {
  const op = r.operating;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-stone-50">
          {op && (
            <>
              <tr className="bg-stone-50">
                <td
                  colSpan={3}
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400"
                >
                  A. Operating Year (Year 3)
                </td>
              </tr>
              <Row label="Revenue" value={fmtEuro(op.revenue)} note="Weekly rate × weeks × occupancy" />
              <Row label="Management Fee" value={fmtEuro(-op.managementFee)} negative indent />
              <Row label="Payroll" value={fmtEuro(-op.payroll)} negative indent />
              <Row label="Utilities" value={fmtEuro(-op.utilities)} negative indent />
              <Row label="Other Operating Expenses" value={fmtEuro(-op.otherOpex)} negative indent />
              <Row label="ENFIA Property Tax" value={fmtEuro(-op.enfia)} negative indent />
              <Row label="EBITDA" value={fmtEuro(op.ebitda)} bold />
              <Row label="Loan Interest" value={fmtEuro(-op.interest)} negative indent />
              <Row label="Profit Before Tax" value={fmtEuro(op.pbt)} />
              <Row label="Operating Income Tax" value={fmtEuro(-op.tax)} negative indent />
              <Row label="Less: Capex Reserve" value={fmtEuro(-op.capexReserve)} negative indent />
              <Row label="Operating Cash Flow (after tax)" value={fmtEuro(op.cashFlowAfterTax)} bold positive />
            </>
          )}

          <tr className="bg-stone-50">
            <td
              colSpan={3}
              className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400"
            >
              {op ? "B." : "A."} Sale of Asset
            </td>
          </tr>
          <Row label="Gross Sale Price" value={fmtEuro(r.grossSalePrice)} note="GBA × price/m²" />
          <Row label="Total Selling Costs" value={fmtEuro(-r.sellingCosts)} note={fmtPct(r.sellingCostPct)} negative indent />
          <Row label="Net Sale Proceeds" value={fmtEuro(r.netSaleProceeds)} bold />
          <Row label="Less: Land + Construction Cost" value={fmtEuro(-(r.totalProjectCost))} negative indent />
          <Row label="Less: Total Interest (equity-funded)" value={fmtEuro(-r.totalInterest)} negative indent />
          <Row label="Gross Profit on Sale" value={fmtEuro(r.grossProfitOnSale)} bold positive />
          <Row
            label="Less: Tax on Sale Gain"
            value={fmtEuro(-r.saleGainTax)}
            note={r.grossProfitOnSale > 0 ? `${fmtPct(r.saleGainTax / r.grossProfitOnSale, 0)} corporate` : "—"}
            negative
            indent
          />
          <Row label="Net Profit on Sale (after tax)" value={fmtEuro(r.netProfitOnSale)} bold positive />

          <tr className="bg-stone-50">
            <td
              colSpan={3}
              className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400"
            >
              {op ? "C." : "B."} Returns to Equity
            </td>
          </tr>
          <Row label="Total Equity Deployed" value={fmtEuro(r.totalEquityDeployed)} note="Cost gap + accrued interest" />
          {op && <Row label="Operating Cash Flow After Tax" value={fmtEuro(r.operatingCashFlow)} indent positive />}
          <Row label="Total Profit to Equity (after tax)" value={fmtEuro(r.totalProfitToEquity)} bold positive />
          <Row label="Return on Equity" value={fmtPct(r.roe, 1)} />
          <Row label="Equity Multiple" value={fmtMult(r.equityMultiple)} />
          <Row label="Holding Period" value={`${r.scenario.holdingPeriodYears} years`} />
          <Row label="Annualised IRR (dated cash flows)" value={fmtPct(r.annualisedIrr)} bold positive />
          <Row label="IRR (equity-multiple proxy)" value={fmtPct(r.simpleAnnualisedIrr)} note="multiple ^ (1 / years)" indent />

          <tr className="bg-stone-50">
            <td
              colSpan={3}
              className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400"
            >
              {op ? "D." : "C."} Sources & Uses at Exit
            </td>
          </tr>
          {op && <Row label="Operating Cash Flow After Tax" value={fmtEuro(r.operatingCashFlow)} indent />}
          <Row label="Net Sale Proceeds (cash in)" value={fmtEuro(r.netSaleProceeds)} indent />
          <Row label="Less: Loan Repayment" value={fmtEuro(-r.loanRepayment)} note="Facility I repaid in full, no penalty" indent negative />
          <Row label="Less: Tax on Sale Gain" value={fmtEuro(-r.saleGainTax)} indent negative />
          <Row label="Net Cash to Equity at Exit" value={fmtEuro(r.netCashToEquityAtExit)} bold positive />
        </tbody>
      </table>
    </div>
  );
}

// ---------- Risk Scenarios (register → financial model) ----------

// Signed deltas vs the base case, for the stress-test panel.
function fmtPp(d: number): string {
  const pp = d * 100;
  return `${pp >= 0 ? "+" : "−"}${Math.abs(pp).toFixed(1)}pp`;
}

function fmtEuroMSigned(v: number): string {
  return `${v >= 0 ? "+" : "−"}€${Math.abs(v / 1_000_000).toFixed(2)}M`;
}

function DeltaChip({ text, negative }: { text: string; negative: boolean }) {
  return (
    <span
      className={`ml-2 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        negative ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
      }`}
    >
      {text}
    </span>
  );
}

function RiskScenarios({
  base,
  outcomes,
}: {
  base: BuildSellResult;
  outcomes: RiskScenarioOutcome[];
}) {
  // Tornado: IRR impact (percentage points) per risk, worst at the top.
  const chartData = useMemo(
    () =>
      [...outcomes]
        .sort((a, b) => a.dIrr - b.dIrr)
        .map((o) => ({ label: o.def.label, dIrr: o.dIrr * 100 })),
    [outcomes],
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-stone-700">
            Risk Scenarios &mdash; how each register risk hits the model
          </h3>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Each major item from the <span className="font-medium text-stone-500">Risks</span> tab is
          run as a pre-set stress on the live assumptions. Base case = sell at completion
          (IRR {fmtPct(base.annualisedIrr)}, {fmtMult(base.equityMultiple)}, net profit{" "}
          {fmtEuroM(base.totalProfitToEquity)}). Deltas are vs that base; edits on this page and the
          Construction CAPEX plan flow straight through.
        </p>
      </div>

      {/* Tornado chart: IRR sensitivity by risk */}
      <div className="px-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
          IRR impact by risk (percentage points vs base)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              stroke="#a8a29e"
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}pp`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="#a8a29e"
              width={108}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(1)}pp IRR`,
              ]}
            />
            <ReferenceLine x={0} stroke="#a8a29e" />
            <Bar dataKey="dIrr" radius={[0, 4, 4, 0]}>
              {chartData.map((e) => (
                <Cell key={e.label} fill={e.dIrr < 0 ? "#ef4444" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-y border-stone-100 text-[10px] uppercase tracking-widest text-stone-400">
              <th className="text-left px-5 py-2 font-semibold">Risk scenario</th>
              <th className="text-right px-3 py-2 font-semibold">Exit</th>
              <th className="text-right px-3 py-2 font-semibold">IRR</th>
              <th className="text-right px-3 py-2 font-semibold">Multiple</th>
              <th className="text-right px-3 py-2 font-semibold">Net profit to equity</th>
              <th className="text-right px-5 py-2 font-semibold">Net cash at exit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {/* Base case */}
            <tr className="bg-sky-50/40">
              <td className="px-5 py-3">
                <span className="text-sm font-bold text-stone-800">Base case</span>
                <span className="block text-[11px] text-stone-400">
                  Headline assumptions &middot; sell at completion
                </span>
              </td>
              <td className="px-3 py-3 text-right text-xs text-stone-500">2 yr</td>
              <td className="px-3 py-3 text-right font-mono font-semibold text-sky-700">
                {fmtPct(base.annualisedIrr)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-stone-700">
                {fmtMult(base.equityMultiple)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-stone-700">
                {fmtEuroM(base.totalProfitToEquity)}
              </td>
              <td className="px-5 py-3 text-right font-mono text-stone-700">
                {fmtEuroM(base.netCashToEquityAtExit)}
              </td>
            </tr>

            {outcomes.map((o) => (
              <tr key={o.def.id} className="hover:bg-stone-50/60 align-top">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={o.def.severity} />
                    <span className="text-sm font-semibold text-stone-800">{o.def.risk}</span>
                  </div>
                  <span className="block text-[11px] text-stone-400 mt-1 leading-snug max-w-md">
                    {o.def.driver}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-xs text-stone-500 whitespace-nowrap">
                  {o.result.scenario.holdingPeriodYears} yr
                  <span className="block text-[10px] text-stone-400">
                    {o.def.exit === "ops" ? "ops + sale" : "completion"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-stone-700 whitespace-nowrap">
                  {fmtPct(o.result.annualisedIrr)}
                  <DeltaChip text={fmtPp(o.dIrr)} negative={o.dIrr < 0} />
                </td>
                <td className="px-3 py-3 text-right font-mono text-stone-700">
                  {fmtMult(o.result.equityMultiple)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-stone-700 whitespace-nowrap">
                  {fmtEuroM(o.result.totalProfitToEquity)}
                  <DeltaChip text={fmtEuroMSigned(o.dProfit)} negative={o.dProfit < 0} />
                </td>
                <td className="px-5 py-3 text-right font-mono text-stone-700 whitespace-nowrap">
                  {fmtEuroM(o.result.netCashToEquityAtExit)}
                  <DeltaChip text={fmtEuroMSigned(o.dNetCash)} negative={o.dNetCash < 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-stone-100 text-[11px] text-stone-400 leading-relaxed">
        Scenarios are defined defaults, each guarded to stay a stress relative to the live base.
        Liquidity risks (slow sale, debt beyond grace) run the operate-one-year-then-sell exit:
        absolute profit can hold up because that extra year books rental income, but IRR falls
        sharply as equity stays locked a year longer and interest turns cash-paying &mdash; IRR is
        the metric that matters for a build-to-sell. Permitting risk is captured inside programme
        slippage; Golden-Visa / foreign-buyer demand sits inside price compression and slow-sale;
        clean title is resolved and not modelled.
      </div>
    </div>
  );
}

// ---------- Main Component ----------

export function BuildSell() {
  const [inputs, setInputs] = useState<BuildSellInputs>({ ...BUILD_SELL_DEFAULTS });
  const [assumptionsOpen, setAssumptionsOpen] = useState(true);
  const [expandedScenario, setExpandedScenario] = useState<number>(0);

  // The construction cost build-up is owned by the Construction CAPEX page (shared context).
  // We overlay it onto the local inputs so the base cost (sum of CAPEX line items) and the
  // escalation / contingency / VAT assumptions come from there — edit a line item on that
  // page and these scenarios recompute. Everything else (land, debt, sale, operating) stays
  // local to this view.
  const capex = useCapex();

  const set = useCallback(
    <K extends keyof BuildSellInputs>(field: K, value: BuildSellInputs[K]) => {
      setInputs((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const reset = useCallback(() => setInputs({ ...BUILD_SELL_DEFAULTS }), []);

  const linkedInputs = useMemo<BuildSellInputs>(
    () => ({
      ...inputs,
      constructionCost: capex.result.baseCost,
      costEscalationPct: capex.inputs.costEscalationPct,
      escalationYears: capex.inputs.escalationYears,
      contingencyPct: capex.inputs.contingencyPct,
      constructionVatRate: capex.inputs.vatRate,
      vatRecoverable: capex.inputs.vatRecoverable,
    }),
    [inputs, capex.inputs, capex.result.baseCost],
  );

  const results = useMemo<BuildSellResult[]>(
    () => BUILD_SELL_SCENARIOS.map((s) => runBuildSellScenario(linkedInputs, s)),
    [linkedInputs],
  );

  const drawdown = useMemo(() => buildDrawdownSchedule(linkedInputs), [linkedInputs]);

  // Risk register → financial scenarios. Each major risk is a pre-set stress on the live base.
  const { base: riskBase, outcomes: riskOutcomes } = useMemo(
    () => runEllinikonRiskScenarios(linkedInputs),
    [linkedInputs],
  );

  const comparisonData = useMemo(
    () => [
      {
        metric: "Equity Deployed",
        [BUILD_SELL_SCENARIOS[0].name]: results[0].totalEquityDeployed / 1_000_000,
        [BUILD_SELL_SCENARIOS[1].name]: results[1].totalEquityDeployed / 1_000_000,
      },
      {
        metric: "Profit to Equity",
        [BUILD_SELL_SCENARIOS[0].name]: results[0].totalProfitToEquity / 1_000_000,
        [BUILD_SELL_SCENARIOS[1].name]: results[1].totalProfitToEquity / 1_000_000,
      },
      {
        metric: "Net Cash at Exit",
        [BUILD_SELL_SCENARIOS[0].name]: results[0].netCashToEquityAtExit / 1_000_000,
        [BUILD_SELL_SCENARIOS[1].name]: results[1].netCashToEquityAtExit / 1_000_000,
      },
    ],
    [results],
  );

  // Build cost vs sale value bridge (uses scenario 1 cost basis)
  const bridgeData = useMemo(() => {
    const r = results[0];
    return [
      { name: "Land + Soft", value: inputs.landCost / 1_000_000, fill: "#a8a29e" },
      { name: "Construction", value: r.effectiveConstructionCost / 1_000_000, fill: "#78716c" },
      { name: "Interest", value: r.totalInterest / 1_000_000, fill: "#d6d3d1" },
      { name: "Net Profit", value: r.netProfitOnSale / 1_000_000, fill: "#0ea5e9" },
      { name: "Tax on Gain", value: r.saleGainTax / 1_000_000, fill: "#f59e0b" },
      { name: "Selling Costs", value: r.sellingCosts / 1_000_000, fill: "#fca5a5" },
    ];
  }, [results, inputs]);

  const totalSellingPct =
    inputs.agentCommissionPct + inputs.marketingPct + inputs.legalPct;

  const builtArea = inputs.mainArea + inputs.secondaryArea;

  return (
    <div className="space-y-8">
      {/* A. Header */}
      <div>
        <div className="flex items-center gap-3">
          <Building2 className="text-sky-600" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">Ellinikon Villa</h2>
        </div>
        <p className="text-stone-500 mt-1 ml-10">
          Supernatural AE &mdash; Ellinikon / Athens Riviera &middot; build-to-sell model with two exit scenarios
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
            <h3 className="text-sm font-semibold text-stone-700">Adjust Assumptions</h3>
          </div>
          {!assumptionsOpen && (
            <span className="text-xs text-stone-400 font-mono">
              Cost {fmtEuroM(results[0].totalProjectCost)} | Sale {fmtEuroM(results[0].grossSalePrice)} | LTC {fmtPct(results[0].ltc, 0)}
            </span>
          )}
        </button>

        {assumptionsOpen && (
          <div className="px-5 pb-5 space-y-5">
            <div className="flex justify-end">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <RotateCcw size={12} />
                Reset to Defaults
              </button>
            </div>

            {/* Project Cost & Debt */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Project Cost &amp; Debt
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <NumberField
                  label="Land + Soft Cost"
                  value={parseFloat((inputs.landCost / 1_000_000).toFixed(2))}
                  onChange={(v) => set("landCost", v * 1_000_000)}
                  min={0}
                  max={50}
                  step={0.5}
                  prefix="€"
                  suffix="M"
                />
                <div className="space-y-1">
                  <label className="text-xs text-stone-500">Construction (base)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-400">€</span>
                    <div
                      className="w-24 px-1.5 py-0.5 font-mono text-xs text-stone-500 bg-stone-50 border border-dashed border-stone-300 rounded"
                      title="Sum of the Construction CAPEX line items — edit it on the Construction CAPEX page"
                    >
                      {(capex.result.baseCost / 1_000_000).toFixed(2)}
                    </div>
                    <span className="text-xs text-stone-400">M</span>
                  </div>
                  <p className="text-[10px] text-stone-400">↳ from CAPEX plan</p>
                </div>
                <NumberField
                  label="Debt Facility"
                  value={parseFloat((inputs.debt / 1_000_000).toFixed(2))}
                  onChange={(v) => set("debt", v * 1_000_000)}
                  min={0}
                  max={50}
                  step={0.5}
                  prefix="€"
                  suffix="M"
                />
                <SliderInput
                  label="Euribor 3M"
                  value={parseFloat((inputs.euribor * 100).toFixed(2))}
                  onChange={(v) => set("euribor", v / 100)}
                  min={0}
                  max={6}
                  step={0.01}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Bank Spread"
                  value={parseFloat((inputs.spread * 100).toFixed(2))}
                  onChange={(v) => set("spread", v / 100)}
                  min={0}
                  max={5}
                  step={0.05}
                  suffix="%"
                  compact
                />
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Construction Cost Build-up (Sep 2027 timing) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                  Construction Cost Build-up &mdash; Sep 2027 start
                </p>
                <span className="text-[10px] text-stone-400 italic">
                  shared with Construction CAPEX
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <SliderInput
                  label="Escalation /yr"
                  value={parseFloat((capex.inputs.costEscalationPct * 100).toFixed(1))}
                  onChange={(v) => capex.setGlobal("costEscalationPct", v / 100)}
                  min={0}
                  max={15}
                  step={0.5}
                  suffix="%"
                  compact
                />
                <NumberField
                  label="Escalation Period"
                  value={capex.inputs.escalationYears}
                  onChange={(v) => capex.setGlobal("escalationYears", v)}
                  min={0}
                  max={6}
                  step={0.25}
                  suffix="yr"
                />
                <SliderInput
                  label="Contingency"
                  value={parseFloat((capex.inputs.contingencyPct * 100).toFixed(1))}
                  onChange={(v) => capex.setGlobal("contingencyPct", v / 100)}
                  min={0}
                  max={25}
                  step={0.5}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Construction VAT"
                  value={parseFloat((capex.inputs.vatRate * 100).toFixed(0))}
                  onChange={(v) => capex.setGlobal("vatRate", v / 100)}
                  min={0}
                  max={30}
                  step={1}
                  suffix="%"
                  compact
                />
                <Toggle
                  label="VAT Treatment"
                  value={capex.inputs.vatRecoverable}
                  onChange={(v) => capex.setGlobal("vatRecoverable", v)}
                  onLabel="Recoverable"
                  offLabel="Added to cost"
                />
              </div>

              {/* Build-up readout */}
              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50/60 px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <p className="text-stone-400">Base (today)</p>
                    <p className="font-mono font-semibold text-stone-700">
                      {fmtEuro(results[0].baseConstructionCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">+ Escalation</p>
                    <p className="font-mono font-semibold text-stone-700">
                      {fmtEuro(
                        results[0].escalatedConstructionCost - results[0].baseConstructionCost,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">+ Contingency</p>
                    <p className="font-mono font-semibold text-stone-700">
                      {fmtEuro(results[0].contingencyAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">
                      + VAT{capex.inputs.vatRecoverable ? " (recov.)" : ""}
                    </p>
                    <p className="font-mono font-semibold text-stone-700">
                      {fmtEuro(results[0].constructionVat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">= Effective</p>
                    <p className="font-mono font-semibold text-sky-700">
                      {fmtEuro(results[0].effectiveConstructionCost)}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Base {fmtEuro(results[0].baseConstructionCost)} is the sum of the{" "}
                  <span className="font-medium text-stone-500">Construction CAPEX</span> line
                  items. Implied{" "}
                  {fmtEuro(
                    builtArea > 0 ? results[0].effectiveConstructionCost / builtArea : 0,
                  )}
                  /m² over {builtArea.toLocaleString()} m² built. Escalation compounds{" "}
                  {fmtPct(capex.inputs.costEscalationPct, 1)}/yr across{" "}
                  {capex.inputs.escalationYears} yr to the cost-weighted spend midpoint (≈
                  mid-2028 for a Sep 2027 start). Debt is fixed at {fmtEuroM(inputs.debt)}, so any
                  uplift is equity-funded: total project cost{" "}
                  {fmtEuroM(results[0].totalProjectCost)}, equity gap{" "}
                  {fmtEuroM(results[0].equityCostGap)}.
                </p>
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Sale / Exit */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Sale / Exit
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <NumberField
                  label="Main Area (m²)"
                  value={inputs.mainArea}
                  onChange={(v) => set("mainArea", v)}
                  min={0}
                  max={10000}
                  step={50}
                />
                <NumberField
                  label="Main €/m²"
                  value={inputs.mainPricePerSqm}
                  onChange={(v) => set("mainPricePerSqm", v)}
                  min={0}
                  max={60000}
                  step={500}
                  prefix="€"
                />
                <NumberField
                  label="Secondary Area (m²)"
                  value={inputs.secondaryArea}
                  onChange={(v) => set("secondaryArea", v)}
                  min={0}
                  max={10000}
                  step={50}
                />
                <NumberField
                  label="Secondary €/m²"
                  value={inputs.secondaryPricePerSqm}
                  onChange={(v) => set("secondaryPricePerSqm", v)}
                  min={0}
                  max={60000}
                  step={500}
                  prefix="€"
                />
                <SliderInput
                  label="Agent Commission"
                  value={parseFloat((inputs.agentCommissionPct * 100).toFixed(2))}
                  onChange={(v) => set("agentCommissionPct", v / 100)}
                  min={0}
                  max={6}
                  step={0.1}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Tax on Sale Gain"
                  value={parseFloat((inputs.saleTaxRate * 100).toFixed(0))}
                  onChange={(v) => set("saleTaxRate", v / 100)}
                  min={0}
                  max={35}
                  step={1}
                  suffix="%"
                  compact
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-2">
                Total selling costs {fmtPct(totalSellingPct)} (agent + marketing 0.2% + legal 0.2%).
                Gross sale price {fmtEuro(results[0].grossSalePrice)}. The development gain is then
                taxed at {fmtPct(inputs.saleTaxRate, 0)} (Greek corporate rate).
              </p>
            </div>

            <hr className="border-stone-100" />

            {/* Operating (Scenario 2) */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Operating Year &mdash; Scenario 2 only
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <NumberField
                  label="Weekly Rate"
                  value={inputs.weeklyRate}
                  onChange={(v) => set("weeklyRate", v)}
                  min={0}
                  max={500000}
                  step={5000}
                  prefix="€"
                />
                <NumberField
                  label="Weeks of Operation"
                  value={inputs.weeksOfOperation}
                  onChange={(v) => set("weeksOfOperation", v)}
                  min={0}
                  max={52}
                  step={1}
                />
                <SliderInput
                  label="Occupancy"
                  value={parseFloat((inputs.occupancyRate * 100).toFixed(0))}
                  onChange={(v) => set("occupancyRate", v / 100)}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Management Fee"
                  value={parseFloat((inputs.managementFeePct * 100).toFixed(0))}
                  onChange={(v) => set("managementFeePct", v / 100)}
                  min={0}
                  max={30}
                  step={1}
                  suffix="%"
                  compact
                />
                <SliderInput
                  label="Operating Tax"
                  value={parseFloat((inputs.operatingTaxRate * 100).toFixed(0))}
                  onChange={(v) => set("operatingTaxRate", v / 100)}
                  min={0}
                  max={35}
                  step={1}
                  suffix="%"
                  compact
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* C. Scenario Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r, i) => {
          const style = SCENARIO_STYLES[i];
          return (
            <div
              key={r.scenario.name}
              className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                  Scenario {i + 1} &mdash; {r.scenario.name}
                </span>
                <span className="text-xs text-stone-400">{r.scenario.holdingPeriodYears} yr hold</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Annualised IRR</p>
                  <p className={`text-3xl font-bold ${style.text}`}>{fmtPct(r.annualisedIrr)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Equity Multiple</p>
                  <p className="text-3xl font-bold text-stone-800">{fmtMult(r.equityMultiple)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                <div>
                  <p className="text-stone-400 text-xs">Total Profit to Equity</p>
                  <p className="font-semibold text-stone-700">{fmtEuroM(r.totalProfitToEquity)}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Return on Equity</p>
                  <p className="font-semibold text-stone-700">{fmtPct(r.roe, 0)}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Gross Profit on Sale</p>
                  <p className="font-semibold text-stone-700">{fmtEuroM(r.grossProfitOnSale)}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Equity Deployed</p>
                  <p className="font-semibold text-stone-700">{fmtEuroM(r.totalEquityDeployed)}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-400">Net Cash to Equity at Exit</p>
                  <p className={`text-xl font-bold ${style.text}`}>{fmtEuroM(r.netCashToEquityAtExit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400">{r.operating ? "Operating CF (Yr)" : "Dev. Margin"}</p>
                  <p className="font-semibold text-stone-700 text-sm">
                    {r.operating ? fmtEuroM(r.operatingCashFlow) : fmtPct(r.developmentMargin)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* D. Comparison Chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Scenario Comparison</h3>
        <p className="text-xs text-stone-400 mb-4">In millions (€M)</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#a8a29e" />
            <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" tickFormatter={(v: number) => `€${v.toFixed(0)}M`} />
            <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}M`]} />
            <Legend />
            <Bar dataKey={BUILD_SELL_SCENARIOS[0].name} fill={SCENARIO_STYLES[0].chart} radius={[4, 4, 0, 0]} />
            <Bar dataKey={BUILD_SELL_SCENARIOS[1].name} fill={SCENARIO_STYLES[1].chart} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* E. Cost-to-Value Bridge */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Cost &rarr; Sale Value (Scenario 1)</h3>
        <p className="text-xs text-stone-400 mb-4">
          How {fmtEuroM(results[0].grossSalePrice)} gross sale splits into cost, selling costs and profit (€M)
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bridgeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a8a29e" />
            <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" tickFormatter={(v: number) => `€${v.toFixed(0)}M`} />
            <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}M`]} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {bridgeData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* F. Risk Scenarios — register risks translated into the model */}
      <RiskScenarios base={riskBase} outcomes={riskOutcomes} />

      {/* G. Detailed Breakdown */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">Detailed Breakdown</h3>
        </div>
        {results.map((r, idx) => (
          <div key={r.scenario.name}>
            <button
              onClick={() => setExpandedScenario(expandedScenario === idx ? -1 : idx)}
              className={`w-full flex items-center gap-2 px-5 py-3 text-sm font-medium hover:bg-stone-50 transition-colors ${
                SCENARIO_STYLES[idx].text
              } ${idx > 0 ? "border-t border-stone-100" : ""}`}
            >
              {expandedScenario === idx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Scenario {idx + 1} &mdash; {r.scenario.name}
              <span className="text-stone-400 font-normal ml-2">
                IRR {fmtPct(r.annualisedIrr)} | {fmtMult(r.equityMultiple)} | Profit {fmtEuroM(r.totalProfitToEquity)}
              </span>
            </button>
            {expandedScenario === idx && <ScenarioBreakdown r={r} />}
          </div>
        ))}
      </div>

      {/* H. Drawdown Schedule */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">Construction Draw-down Schedule</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {fmtEuroM(inputs.debt)} facility &middot; {inputs.constructionQuarters} quarterly tranches &middot; interest-free grace
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="text-left px-4 py-2 text-stone-500 font-medium">Quarter</th>
                <th className="text-right px-3 py-2 text-stone-500 font-medium">Drawdown</th>
                <th className="text-right px-3 py-2 text-stone-500 font-medium">Cumulative Loan</th>
                <th className="text-right px-3 py-2 text-stone-500 font-medium">Accrued Interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {drawdown.map((q) => (
                <tr key={q.index} className="hover:bg-stone-50/50">
                  <td className="px-4 py-2 font-medium text-stone-700">Q{q.index}</td>
                  <td className="px-3 py-2 text-right font-mono text-stone-600">{fmtEuro(q.drawdown)}</td>
                  <td className="px-3 py-2 text-right font-mono text-stone-600">{fmtEuro(q.cumulativeLoan)}</td>
                  <td className="px-3 py-2 text-right font-mono text-stone-600">{fmtEuro(q.interest)}</td>
                </tr>
              ))}
              <tr className="bg-stone-50 font-semibold">
                <td className="px-4 py-2 text-stone-700">Total</td>
                <td className="px-3 py-2 text-right font-mono text-stone-700">{fmtEuro(inputs.debt)}</td>
                <td className="px-3 py-2 text-right font-mono text-stone-400">&mdash;</td>
                <td className="px-3 py-2 text-right font-mono text-stone-700">{fmtEuro(results[0].constructionInterest)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* I. Methodology & Comparables */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-semibold text-stone-800">Methodology &amp; Market Comparables</h3>
        <div className="text-sm text-stone-600 space-y-3 leading-relaxed">
          <div>
            <span className="font-medium text-stone-700">Two exit scenarios:</span>{" "}
            Scenario 1 sells at construction completion (end of Year 2); Scenario 2 operates the
            asset for one year then sells at the end of Year 3. Both sales fall within the loan's
            3-year interest-free grace, so the facility is repaid in full with no penalty.
          </div>
          <div>
            <span className="font-medium text-stone-700">Sale pricing (€30,000/m² main):</span>{" "}
            Anchored to the Ellinikon Cove waterfront villa range. Athens Riviera / Ellinikon
            comparables (Lamda Development / market 2025&ndash;26): beach-front maisonettes avg
            €30,000/m², Riviera tower flats (secondary market) avg €24,000/m².
          </div>
          <div>
            <span className="font-medium text-stone-700">Construction cost &amp; Sep 2027 start:</span>{" "}
            The base estimate ({fmtEuro(results[0].baseConstructionCost)}, today's prices) is the
            sum of the detailed elemental plan on the{" "}
            <span className="font-medium text-stone-700">Construction CAPEX</span> page &mdash; edit
            a line item there and this model updates. It is escalated forward at{" "}
            {fmtPct(capex.inputs.costEscalationPct, 1)}/yr across {capex.inputs.escalationYears} yr
            to the cost-weighted spend midpoint (construction begins Sep 2027, so most spend lands
            2028&ndash;29), then a {fmtPct(capex.inputs.contingencyPct, 1)} contingency is added.
            Input VAT is{" "}
            {capex.inputs.vatRecoverable
              ? "treated as recoverable (netted out)"
              : `treated as irrecoverable and added to cost (${fmtPct(capex.inputs.vatRate, 0)})`}
            . The result &mdash; effective construction {fmtEuro(results[0].effectiveConstructionCost)}{" "}
            ({fmtEuro(builtArea > 0 ? results[0].effectiveConstructionCost / builtArea : 0)}/m²)
            &mdash; is funded by equity, since the {fmtEuroM(inputs.debt)} facility is fixed.
            Dial these on either page to stress-test the capex assumption against the build timeline.
          </div>
          <div>
            <span className="font-medium text-stone-700">Interest treatment:</span>{" "}
            The grace period is interest-free against cash flow, but accrued interest
            ({fmtEuro(results[0].constructionInterest)} construction-period;
            {" "}{fmtEuro(results[1].operatingYearInterest)} for the extra operating year) is
            treated as equity-funded and added to equity deployed, consistent with the source model.
          </div>
          <div>
            <span className="font-medium text-stone-700">Taxation of the gain:</span>{" "}
            The development gain on sale is taxed at the Greek corporate rate
            ({fmtPct(inputs.saleTaxRate, 0)}, adjustable above) &mdash;
            {" "}{fmtEuro(results[0].saleGainTax)} in Scenario 1 &mdash; on top of the
            operating-year income tax in Scenario 2. Buyer-side transfer tax / VAT is not
            modelled, as it is borne by the purchaser.
          </div>
          <div>
            <span className="font-medium text-stone-700">IRR method:</span>{" "}
            The headline IRR is solved from dated quarterly equity cash flows (land/soft costs
            funded at t0, construction debt drawn over the build, sale proceeds at exit), then
            annualised. A simpler equity-multiple proxy &mdash; multiple^(1/years) &mdash; is
            shown alongside it for reference; the two are close when most equity is the land
            paid upfront.
          </div>
          <div>
            <span className="font-medium text-stone-700">Trade-off:</span>{" "}
            Scenario 2 earns more absolute profit (the extra operating cash flow) but ties up equity
            for an additional year, so its annualised IRR is lower. Scenario 1 maximises annualised
            return; Scenario 2 maximises absolute euro profit.
          </div>
        </div>
      </div>
    </div>
  );
}
