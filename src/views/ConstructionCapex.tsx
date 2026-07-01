import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  ChevronRight,
  HardHat,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { CAPEX_DEFAULT_LINE_ITEMS } from "../lib/construction-capex-model";
import { useCapex } from "../lib/capex-context";
import { SliderInput } from "../components/SliderInput";

// ---------- Formatting helpers ----------

function fmtEuro(v: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtEuroM(v: number): string {
  return `€${(v / 1_000_000).toFixed(2)}M`;
}

function fmtPct(v: number, decimals = 1): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

function fmtPerSqm(v: number): string {
  return `€${Math.round(v).toLocaleString("el-GR")}/m²`;
}

// Category accent colours (chart + table headers), in canonical order.
const CATEGORY_COLORS: Record<string, string> = {
  Substructure: "#0ea5e9",
  Superstructure: "#6366f1",
  "Building Envelope & Openings": "#8b5cf6",
  "Internal Finishes": "#ec4899",
  "MEP / Services": "#f59e0b",
  "External Works": "#10b981",
  Preliminaries: "#78716c",
  Other: "#a8a29e",
};

function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#a8a29e";
}

// ---------- Small toggle ----------

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

// ---------- KPI card ----------

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? "text-stone-800"}`}>{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ---------- Main component ----------

export function ConstructionCapex() {
  // Construction state lives in a shared context (see lib/capex-context) so the plan and its
  // build-up persist across navigation and drive the Ellinikon Villa model directly.
  const { inputs, result, setGlobal, updateItem, addItem, removeItem, reset } =
    useCapex();
  const [adjustOpen, setAdjustOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const chartData = useMemo(
    () =>
      result.categories.map((c) => ({
        category: c.category,
        cost: c.cost / 1_000_000,
        fill: colorFor(c.category),
      })),
    [result],
  );

  const buildUpBar = useMemo(
    () => [
      {
        name: "build-up",
        Base: result.baseCost / 1_000_000,
        Escalation: result.escalationAmount / 1_000_000,
        Contingency: result.contingencyAmount / 1_000_000,
        VAT: result.vatAmount / 1_000_000,
      },
    ],
    [result],
  );

  return (
    <div className="space-y-8">
      {/* A. Header */}
      <div>
        <div className="flex items-center gap-3">
          <HardHat className="text-amber-500" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">Construction CAPEX</h2>
        </div>
        <p className="text-stone-500 mt-1 ml-10">
          Supernatural AE &mdash; Ellinikon villa &middot; bottom-up elemental cost plan,
          editable line-by-line &middot; drives the Ellinikon Villa model&rsquo;s construction cost
        </p>
      </div>

      {/* B. KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Base Construction"
          value={fmtEuroM(result.baseCost)}
          sub={`${fmtPerSqm(result.baseCostPerSqm)} · today's prices`}
        />
        <Kpi
          label="All-in Construction"
          value={fmtEuroM(result.allInCost)}
          sub={`${fmtPerSqm(result.allInCostPerSqm)} · esc + cont${
            inputs.vatRecoverable ? "" : " + VAT"
          }`}
          accent="text-amber-600"
        />
        <Kpi
          label="Escalation + Contingency"
          value={fmtEuroM(result.escalationAmount + result.contingencyAmount)}
          sub={`${fmtPct(inputs.costEscalationPct, 1)}/yr · ${fmtPct(
            inputs.contingencyPct,
            1,
          )} contingency`}
        />
        <Kpi
          label={inputs.vatRecoverable ? "VAT (recoverable)" : "VAT (added to cost)"}
          value={inputs.vatRecoverable ? "—" : fmtEuroM(result.vatAmount)}
          sub={`${fmtPct(inputs.vatRate, 0)} on ${fmtEuroM(result.subtotalExVat)}`}
        />
      </div>

      {/* C. Global adjustments */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <button
          onClick={() => setAdjustOpen(!adjustOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {adjustOpen ? (
              <ChevronDown size={16} className="text-stone-400" />
            ) : (
              <ChevronRight size={16} className="text-stone-400" />
            )}
            <h3 className="text-sm font-semibold text-stone-700">
              Global Adjustments &amp; Build-up
            </h3>
          </div>
          {!adjustOpen && (
            <span className="text-xs text-stone-400 font-mono">
              Base {fmtEuroM(result.baseCost)} → All-in {fmtEuroM(result.allInCost)}
            </span>
          )}
        </button>

        {adjustOpen && (
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

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <NumberField
                label="Built Area (m²)"
                value={inputs.builtArea}
                onChange={(v) => setGlobal("builtArea", v)}
                min={0}
                max={20000}
                step={50}
              />
              <SliderInput
                label="Escalation /yr"
                value={parseFloat((inputs.costEscalationPct * 100).toFixed(1))}
                onChange={(v) => setGlobal("costEscalationPct", v / 100)}
                min={0}
                max={15}
                step={0.5}
                suffix="%"
                compact
              />
              <NumberField
                label="Escalation Period"
                value={inputs.escalationYears}
                onChange={(v) => setGlobal("escalationYears", v)}
                min={0}
                max={6}
                step={0.25}
                suffix="yr"
              />
              <SliderInput
                label="Contingency"
                value={parseFloat((inputs.contingencyPct * 100).toFixed(1))}
                onChange={(v) => setGlobal("contingencyPct", v / 100)}
                min={0}
                max={25}
                step={0.5}
                suffix="%"
                compact
              />
              <SliderInput
                label="VAT Rate"
                value={parseFloat((inputs.vatRate * 100).toFixed(0))}
                onChange={(v) => setGlobal("vatRate", v / 100)}
                min={0}
                max={30}
                step={1}
                suffix="%"
                compact
              />
              <Toggle
                label="VAT Treatment"
                value={inputs.vatRecoverable}
                onChange={(v) => setGlobal("vatRecoverable", v)}
                onLabel="Recoverable"
                offLabel="Added to cost"
              />
            </div>

            {/* Build-up strip */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 px-4 py-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs">
                <div>
                  <p className="text-stone-400">Base (today)</p>
                  <p className="font-mono font-semibold text-stone-700">
                    {fmtEuro(result.baseCost)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">+ Escalation</p>
                  <p className="font-mono font-semibold text-stone-700">
                    {fmtEuro(result.escalationAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">+ Contingency</p>
                  <p className="font-mono font-semibold text-stone-700">
                    {fmtEuro(result.contingencyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">+ VAT{inputs.vatRecoverable ? " (recov.)" : ""}</p>
                  <p className="font-mono font-semibold text-stone-700">
                    {fmtEuro(result.vatAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">= All-in</p>
                  <p className="font-mono font-semibold text-amber-600">
                    {fmtEuro(result.allInCost)}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={48}>
                <BarChart
                  data={buildUpBar}
                  layout="vertical"
                  margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}M`]} />
                  <Bar dataKey="Base" stackId="a" fill="#78716c" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="Escalation" stackId="a" fill="#d6d3d1" />
                  <Bar dataKey="Contingency" stackId="a" fill="#fcd34d" />
                  <Bar dataKey="VAT" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* D. Category breakdown chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">
          Cost by Elemental Category
        </h3>
        <p className="text-xs text-stone-400 mb-4">
          Base construction {fmtEuroM(result.baseCost)} split across{" "}
          {result.categories.length} categories (€M)
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              stroke="#a8a29e"
              tickFormatter={(v: number) => `€${v.toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fontSize: 11 }}
              stroke="#a8a29e"
              width={150}
            />
            <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}M`, "Cost"]} />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="cost"
                position="right"
                formatter={(value) => `€${Number(value).toFixed(2)}M`}
                style={{ fontSize: 11, fill: "#78716c" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* E. Editable line items by category */}
      <div className="space-y-4">
        {result.categories.map((cat) => {
          const isCollapsed = collapsed[cat.category];
          return (
            <div
              key={cat.category}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-5 py-3 border-b border-stone-100"
                style={{ borderLeft: `4px solid ${colorFor(cat.category)}` }}
              >
                <button
                  onClick={() =>
                    setCollapsed((p) => ({ ...p, [cat.category]: !p[cat.category] }))
                  }
                  className="flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-900"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-stone-400" />
                  ) : (
                    <ChevronDown size={16} className="text-stone-400" />
                  )}
                  {cat.category}
                </button>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-stone-400">{fmtPerSqm(cat.costPerSqm)}</span>
                  <span className="text-stone-400">{fmtPct(cat.pctOfBase)}</span>
                  <span className="font-mono font-semibold text-stone-700">
                    {fmtEuro(cat.cost)}
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
                        <th className="text-left px-5 py-2 font-medium">Line item</th>
                        <th className="text-right px-3 py-2 font-medium">Cost (€000)</th>
                        <th className="text-right px-3 py-2 font-medium">€/m²</th>
                        <th className="text-right px-3 py-2 font-medium">% of base</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {cat.items.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50/50">
                          <td className="px-5 py-1.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="w-full max-w-md px-1.5 py-0.5 text-sm text-stone-700 bg-transparent border border-transparent rounded hover:border-stone-200 focus:border-emerald-400 focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <input
                              type="number"
                              value={Math.round(item.cost / 1000)}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v))
                                  updateItem(item.id, { cost: Math.max(0, v) * 1000 });
                              }}
                              min={0}
                              step={25}
                              className="w-24 px-1.5 py-0.5 text-right font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-stone-500">
                            {fmtPerSqm(item.costPerSqm)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-stone-500">
                            {fmtPct(item.pctOfBase)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-stone-300 hover:text-red-500 transition-colors"
                              title="Remove line item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-5 py-2">
                    <button
                      onClick={() => addItem(cat.category)}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-600 transition-colors"
                    >
                      <Plus size={14} />
                      Add line item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* F. Grand total */}
      <div className="bg-stone-800 rounded-xl p-5 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">Base Construction</p>
            <p className="text-xl font-bold">{fmtEuro(result.baseCost)}</p>
            <p className="text-xs text-stone-400">{fmtPerSqm(result.baseCostPerSqm)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">
              Escalation + Contingency
            </p>
            <p className="text-xl font-bold">
              {fmtEuro(result.escalationAmount + result.contingencyAmount)}
            </p>
            <p className="text-xs text-stone-400">to spend midpoint</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">
              {inputs.vatRecoverable ? "VAT (recoverable)" : "VAT (irrecoverable)"}
            </p>
            <p className="text-xl font-bold">{fmtEuro(result.vatAmount)}</p>
            <p className="text-xs text-stone-400">{fmtPct(inputs.vatRate, 0)} rate</p>
          </div>
          <div>
            <p className="text-xs text-amber-300 uppercase tracking-wide">
              All-in Construction
            </p>
            <p className="text-2xl font-bold text-amber-300">{fmtEuro(result.allInCost)}</p>
            <p className="text-xs text-stone-400">{fmtPerSqm(result.allInCostPerSqm)}</p>
          </div>
        </div>
      </div>

      {/* G. Methodology */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-semibold text-stone-800">Methodology</h3>
        <div className="text-sm text-stone-600 space-y-3 leading-relaxed">
          <div>
            <span className="font-medium text-stone-700">Bottom-up elemental plan:</span>{" "}
            Construction is broken into {CAPEX_DEFAULT_LINE_ITEMS.length} editable line items
            across seven elemental categories (substructure → preliminaries). Edit any line's
            name or cost, add or delete lines, and the category subtotals, €/m², percentage
            mix and charts update live. The default plan totals{" "}
            {fmtEuro(13_000_000)} ({fmtPerSqm(6_500)}) for a ~2,000 m² ultra-prime villa.
          </div>
          <div>
            <span className="font-medium text-stone-700">Build-up to all-in:</span>{" "}
            The base (today's prices) is escalated forward at {fmtPct(inputs.costEscalationPct, 1)}
            /yr across {inputs.escalationYears} yr to the cost-weighted spend midpoint, a{" "}
            {fmtPct(inputs.contingencyPct, 1)} contingency is added, and input VAT is{" "}
            {inputs.vatRecoverable
              ? "treated as recoverable (netted out)"
              : `added as an irrecoverable cost at ${fmtPct(inputs.vatRate, 0)}`}
            .
          </div>
          <div>
            <span className="font-medium text-stone-700">Drives the Ellinikon Villa model:</span>{" "}
            This page is the live source of truth for construction cost. The base
            ({fmtEuro(result.baseCost)}) feeds straight into the Ellinikon Villa (build-to-sell)
            model as its construction cost, and the escalation / contingency / VAT assumptions
            set here are the same ones it applies &mdash; so the all-in total here
            ({fmtEuro(result.allInCost)}) equals that model's &ldquo;effective construction
            cost&rdquo; exactly. Edit a line item and the villa model&rsquo;s returns move with it.
          </div>
        </div>
      </div>
    </div>
  );
}

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
