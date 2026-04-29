import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sparkles,
  Hotel,
  Waves,
  Sprout,
  Utensils,
  Palette,
  Flame,
  Sun,
  Volleyball,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { SliderInput } from "../components/SliderInput";
import { runScenario, SCENARIOS } from "../lib/financial-model";

// ---------- Types ----------

type FfeQuality = "lean" | "mid" | "premium";

interface Amenities {
  infinityPool: boolean;
  spaPod: boolean;
  fbUpgrade: boolean;
  brandPositioning: boolean;
  chimneySuite: boolean;
  courtyardLighting: boolean;
  yogaDeck: boolean;
  beachVolley: boolean;
}

interface OptimizerState {
  capexCap: number; // €K
  totalKeys: number;
  suiteRatio: number; // %
  seaViewRatio: number; // %
  ffeQuality: FfeQuality;
  includeOpII: boolean;
  occupancyMature: number; // %
  stateSubsidy: number; // €K
  amenities: Amenities;
}

const DEFAULT_STATE: OptimizerState = {
  capexCap: 8000,
  totalKeys: 33,
  suiteRatio: 25,
  seaViewRatio: 70,
  ffeQuality: "mid",
  includeOpII: false,
  occupancyMature: 70,
  stateSubsidy: 3000,
  amenities: {
    infinityPool: true,
    spaPod: true,
    fbUpgrade: true,
    brandPositioning: true,
    chimneySuite: true,
    courtyardLighting: true,
    yogaDeck: true,
    beachVolley: false,
  },
};

interface Preset {
  name: string;
  description: string;
  state: OptimizerState;
}

const PRESETS: Preset[] = [
  {
    name: "Conservative 36",
    description: "Hold ANICON spec, defer OP II, mid-tier FF&E",
    state: {
      ...DEFAULT_STATE,
      totalKeys: 36,
      suiteRatio: 11,
      seaViewRatio: 50,
      ffeQuality: "mid",
      includeOpII: false,
      occupancyMature: 65,
      amenities: {
        ...DEFAULT_STATE.amenities,
        infinityPool: false,
        spaPod: false,
        fbUpgrade: false,
        brandPositioning: false,
        chimneySuite: false,
      },
    },
  },
  {
    name: "Premium 33 (recommended)",
    description: "Adult-only heritage luxury, suites-heavy, signature pool + spa",
    state: DEFAULT_STATE,
  },
  {
    name: "All 48 keys",
    description: "Original programme — open OP I + OP II together",
    state: {
      ...DEFAULT_STATE,
      totalKeys: 36,
      includeOpII: true,
      suiteRatio: 11,
      ffeQuality: "lean",
      amenities: {
        ...DEFAULT_STATE.amenities,
        spaPod: false,
        infinityPool: false,
        brandPositioning: false,
      },
    },
  },
];

// ---------- ADR & capex formulas ----------

const FFE_PER_KEY: Record<FfeQuality, number> = {
  lean: 12,
  mid: 18,
  premium: 26,
};

const FFE_ADR_DELTA: Record<FfeQuality, number> = {
  lean: -15,
  mid: 0,
  premium: 30,
};

const AMENITY_META: Record<
  keyof Amenities,
  { label: string; capex: number; adr: number; icon: typeof Waves }
> = {
  infinityPool: { label: "Infinity-edge pool (castle view)", capex: 80, adr: 30, icon: Waves },
  spaPod: { label: "Spa pod (2 rooms + sauna)", capex: 250, adr: 25, icon: Sparkles },
  fbUpgrade: { label: "Destination F&B upgrade (Elia)", capex: 80, adr: 15, icon: Utensils },
  brandPositioning: { label: "Brand positioning + PR launch", capex: 165, adr: 25, icon: Palette },
  chimneySuite: { label: "Signature 'Chimney Suite' build-out", capex: 45, adr: 8, icon: Flame },
  courtyardLighting: { label: "Courtyard + kiln lighting/staging", capex: 40, adr: 10, icon: Sparkles },
  yogaDeck: { label: "Sea-facing yoga deck", capex: 25, adr: 8, icon: Sun },
  beachVolley: { label: "Beach volley + floating platforms", capex: 55, adr: 2, icon: Volleyball },
};

interface CapexBreakdown {
  rows: { name: string; value: number; section: string }[];
  base: number;
  contingency: number;
  total: number;
  effectiveKeys: number;
  blendedAdr: number;
}

function compute(state: OptimizerState): CapexBreakdown {
  const effectiveKeys = state.totalKeys + (state.includeOpII ? 12 : 0);
  const a = state.amenities;

  // Construction (Category A) ----------------------------------
  const preliminaries = 100;
  const structural = 1030;
  const buildingWorks =
    700 +
    state.totalKeys * 22 +
    (state.ffeQuality === "premium" ? 150 : state.ffeQuality === "lean" ? -100 : 0);
  const roofing = 400;
  const mep = 300 + state.totalKeys * 14;
  const landscape =
    500 +
    (a.beachVolley ? 50 : 0) +
    (a.yogaDeck ? 25 : 0) +
    (a.courtyardLighting ? 40 : 0);
  const pool = 330 + (a.infinityPool ? 80 : 0);
  const opII = state.includeOpII ? 1000 : 0;
  const spa = a.spaPod ? 250 : 0;
  const fb = 100 + (a.fbUpgrade ? 80 : 0);

  const constructionA =
    preliminaries +
    structural +
    buildingWorks +
    roofing +
    mep +
    landscape +
    pool +
    opII +
    spa +
    fb;

  // FF&E + OS&E (Category B/C) ---------------------------------
  const suiteCount = Math.round(state.totalKeys * (state.suiteRatio / 100));
  const ffeBase = effectiveKeys * FFE_PER_KEY[state.ffeQuality];
  const suitePremium = suiteCount * 5; // each suite adds €5K extra
  const ffe = ffeBase + suitePremium + (a.chimneySuite ? 45 : 0);
  const ose = effectiveKeys * 4;

  // Soft costs (Category D) ------------------------------------
  const softCosts = Math.round(constructionA * 0.13);

  // Pre-opening (Category E) -----------------------------------
  const preOpening = 295 + (a.brandPositioning ? 165 : 0);

  const base =
    constructionA + ffe + ose + softCosts + preOpening;
  const contingency = Math.round(base * 0.1);
  const total = base + contingency;

  // ADR computation --------------------------------------------
  let adr = 180;
  adr += Math.max(0, state.suiteRatio - 11) * 4;
  adr += Math.max(0, state.seaViewRatio - 50) * 0.8;
  adr += FFE_ADR_DELTA[state.ffeQuality];
  for (const k of Object.keys(a) as (keyof Amenities)[]) {
    if (a[k]) adr += AMENITY_META[k].adr;
  }
  if (state.includeOpII) adr -= 20; // OP II studios pull blended ADR down
  const blendedAdr = Math.round(adr);

  const rows: CapexBreakdown["rows"] = [
    { name: "1. Preliminaries", value: preliminaries, section: "Construction" },
    { name: "2. Structural (OP I)", value: structural, section: "Construction" },
    { name: "3. Building works (OP I)", value: buildingWorks, section: "Construction" },
    { name: "4. Roofing", value: roofing, section: "Construction" },
    { name: "5. MEP", value: mep, section: "Construction" },
    { name: "6. Landscape & surrounding", value: landscape, section: "Construction" },
    { name: "7. Pool", value: pool, section: "Construction" },
    { name: "8. OP II (12 studios)", value: opII, section: "Construction" },
    { name: "9. Spa pod", value: spa, section: "Construction" },
    { name: "10. F&B (Elia)", value: fb, section: "Construction" },
    { name: "11. FF&E", value: ffe, section: "Furnishing" },
    { name: "12. OS&E", value: ose, section: "Furnishing" },
    { name: "13. Soft costs", value: softCosts, section: "Soft costs" },
    { name: "14. Pre-opening + brand", value: preOpening, section: "Soft costs" },
    { name: "15. Contingency 10%", value: contingency, section: "Reserve" },
  ];

  return { rows, base, contingency, total, effectiveKeys, blendedAdr };
}

// ---------- Formatters ----------

const fmtK = (v: number) => `€${v.toLocaleString("en-IE")}K`;
const fmtM = (v: number) => `€${(v / 1000).toFixed(2)}M`;
const fmtPct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

// ---------- Verdict logic ----------

interface Verdict {
  level: "good" | "warn" | "bad";
  headline: string;
  notes: string[];
}

function verdictFor(state: OptimizerState, breakdown: CapexBreakdown, adr: number): Verdict {
  const notes: string[] = [];
  let level: Verdict["level"] = "good";
  const overBudget = breakdown.total > state.capexCap;
  const headroom = state.capexCap - breakdown.total;

  if (overBudget) {
    level = "bad";
    notes.push(`Over budget by ${fmtK(-headroom)} — descope or raise the cap.`);
  } else if (headroom < state.capexCap * 0.02) {
    level = level === "good" ? "warn" : level;
    notes.push(`Only ${fmtK(headroom)} headroom — heritage discovery risk uncovered.`);
  } else {
    notes.push(`${fmtK(headroom)} headroom inside the cap.`);
  }

  if (adr > 320) {
    level = level === "good" ? "warn" : level;
    notes.push(`ADR €${adr} is above Lesvos comp set — needs strong demand validation.`);
  } else if (adr < 170) {
    level = level === "good" ? "warn" : level;
    notes.push(`ADR €${adr} sits in 3★ band — ANICON flagged this as inadequate.`);
  }

  if (state.suiteRatio < 15 && state.ffeQuality === "premium") {
    level = level === "good" ? "warn" : level;
    notes.push("Premium FF&E without suite ratio uplift — diminishing ADR returns.");
  }

  if (state.includeOpII && breakdown.total > state.capexCap * 0.95) {
    level = level === "good" ? "warn" : level;
    notes.push("Including OP II at this cap leaves no contingency buffer.");
  }

  if (!state.amenities.brandPositioning && adr > 250) {
    level = level === "good" ? "warn" : level;
    notes.push("Targeting €250+ ADR without brand positioning spend is unrealistic.");
  }

  const headline =
    level === "bad"
      ? "Not feasible at this budget"
      : level === "warn"
        ? "Feasible with caveats"
        : "Feasible and well-balanced";

  return { level, headline, notes };
}

// ---------- Component ----------

export function StrategyOptimizer() {
  const [state, setState] = useState<OptimizerState>(DEFAULT_STATE);

  const breakdown = useMemo(() => compute(state), [state]);

  const verdict = useMemo(
    () => verdictFor(state, breakdown, breakdown.blendedAdr),
    [state, breakdown],
  );

  // Run financial scenario with state-derived inputs ---------------
  const scenarioResult = useMemo(() => {
    const base = SCENARIOS.find((s) => s.name === "Base") ?? SCENARIOS[1];
    const occMature = state.occupancyMature / 100;
    const inputs = {
      ...base,
      adrYear1: breakdown.blendedAdr,
      occupancyYear1: Math.max(0.3, occMature - 0.1),
      occupancyMature: occMature,
      gopMargin: 0.38 + (state.ffeQuality === "premium" ? 0.05 : 0) + (state.amenities.spaPod ? 0.02 : 0),
      fbPerNight: 35 + (state.amenities.fbUpgrade ? 25 : 0),
      otherRevenuePct: 0.1 + (state.amenities.spaPod ? 0.05 : 0),
    };
    return runScenario(
      inputs,
      breakdown.total * 1000,
      breakdown.effectiveKeys,
      180,
      10,
      state.stateSubsidy * 1000,
    );
  }, [state, breakdown]);

  const updateAmenity = (k: keyof Amenities) =>
    setState((s) => ({ ...s, amenities: { ...s.amenities, [k]: !s.amenities[k] } }));

  const applyPreset = (p: Preset) => setState(p.state);
  const reset = () => setState(DEFAULT_STATE);

  // ---------- Chart data ----------

  const capexChartData = breakdown.rows
    .filter((r) => r.value > 0)
    .map((r) => ({ name: r.name.replace(/^\d+\.\s*/, ""), value: r.value }));

  const cashflowChartData = scenarioResult.projections.map((p) => ({
    year: p.year,
    NOI: Math.round(p.noi / 1000),
    Cumulative: Math.round(p.cumulativeNoi / 1000),
  }));

  const aniconBaseline = {
    capex: 10558,
    keys: 48,
    adr: 180,
    yoc: 0.049,
  };

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Hotel className="w-6 h-6 text-emerald-700" />
            Strategy Optimizer
          </h2>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Tune room count, suite mix, sea-view ratio, FF&amp;E quality, and amenities to find the
            capex allocation that maximizes ADR and stabilized yield. All financial outputs recompute live.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 rounded-lg transition-colors border border-stone-200"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-600 rounded-lg transition-colors border border-stone-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiTile
          label="Total capex"
          value={fmtM(breakdown.total)}
          sub={`Cap ${fmtM(state.capexCap)} · ${
            breakdown.total <= state.capexCap ? "✓" : "over"
          }`}
          tone={breakdown.total <= state.capexCap ? "good" : "bad"}
        />
        <KpiTile
          label="Blended ADR"
          value={`€${breakdown.blendedAdr}`}
          sub={`${state.suiteRatio}% suites · ${state.seaViewRatio}% sea`}
          tone={breakdown.blendedAdr >= 220 ? "good" : "warn"}
        />
        <KpiTile
          label="Stabilized NOI"
          value={fmtM(scenarioResult.stabilizedNoi / 1000)}
          sub={`Year 3 · ${breakdown.effectiveKeys} keys`}
          tone="good"
        />
        <KpiTile
          label="Yield on cost"
          value={fmtPct(scenarioResult.yieldOnCost)}
          sub={`Net ${fmtPct(scenarioResult.netYieldOnCost)} (post-subsidy)`}
          tone={scenarioResult.netYieldOnCost > 0.1 ? "good" : "warn"}
        />
        <KpiTile
          label="IRR (10y, gross)"
          value={fmtPct(scenarioResult.irr)}
          sub={`Net ${fmtPct(scenarioResult.netIrr)}`}
          tone={scenarioResult.netIrr > 0.15 ? "good" : "warn"}
        />
      </div>

      {/* Verdict */}
      <VerdictCard verdict={verdict} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CONTROLS */}
        <div className="lg:col-span-1 space-y-4">
          <Section title="Programme">
            <SliderInput
              label="Total capex cap (€K)"
              value={state.capexCap}
              onChange={(v) => setState((s) => ({ ...s, capexCap: v }))}
              min={5000}
              max={12000}
              step={100}
            />
            <SliderInput
              label="Total keys (OP I)"
              value={state.totalKeys}
              onChange={(v) => setState((s) => ({ ...s, totalKeys: v }))}
              min={25}
              max={48}
              step={1}
            />
            <SliderInput
              label="Suite ratio (%)"
              value={state.suiteRatio}
              onChange={(v) => setState((s) => ({ ...s, suiteRatio: v }))}
              min={5}
              max={40}
              step={1}
              suffix="%"
            />
            <SliderInput
              label="Sea-view ratio (%)"
              value={state.seaViewRatio}
              onChange={(v) => setState((s) => ({ ...s, seaViewRatio: v }))}
              min={20}
              max={100}
              step={5}
              suffix="%"
            />
            <SliderInput
              label="Mature occupancy (%)"
              value={state.occupancyMature}
              onChange={(v) => setState((s) => ({ ...s, occupancyMature: v }))}
              min={50}
              max={85}
              step={1}
              suffix="%"
            />
            <SliderInput
              label="State subsidy (€K)"
              value={state.stateSubsidy}
              onChange={(v) => setState((s) => ({ ...s, stateSubsidy: v }))}
              min={0}
              max={4000}
              step={100}
            />

            <div className="pt-2">
              <p className="text-xs text-stone-500 mb-1.5">FF&amp;E quality tier</p>
              <div className="grid grid-cols-3 gap-1">
                {(["lean", "mid", "premium"] as FfeQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setState((s) => ({ ...s, ffeQuality: q }))}
                    className={`text-xs py-1.5 rounded-md border transition-colors capitalize ${
                      state.ffeQuality === q
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {q} (€{FFE_PER_KEY[q]}K/key)
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 text-xs text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={state.includeOpII}
                onChange={() => setState((s) => ({ ...s, includeOpII: !s.includeOpII }))}
                className="w-4 h-4 accent-emerald-600"
              />
              Include OP II in Phase 1 (+12 studios, +€1.0M, blended ADR −€20)
            </label>
          </Section>

          <Section title="Amenity & ADR levers">
            {(Object.keys(AMENITY_META) as (keyof Amenities)[]).map((k) => {
              const meta = AMENITY_META[k];
              const Icon = meta.icon;
              const active = state.amenities[k];
              return (
                <button
                  key={k}
                  onClick={() => updateAmenity(k)}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg border text-left transition-colors ${
                    active
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? "text-emerald-700" : "text-stone-400"
                      }`}
                    />
                    <span className="text-xs text-stone-700 truncate">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                    <span className="text-stone-500">+{fmtK(meta.capex)}</span>
                    <span className="text-emerald-700">+€{meta.adr} ADR</span>
                  </div>
                </button>
              );
            })}
          </Section>
        </div>

        {/* OUTPUTS */}
        <div className="lg:col-span-2 space-y-4">
          {/* Capex breakdown */}
          <Section title={`Capex allocation — ${fmtM(breakdown.total)} total`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-stone-400 uppercase border-b border-stone-200">
                    <th className="text-left py-1.5 font-medium">Line</th>
                    <th className="text-right py-1.5 font-medium">€K</th>
                    <th className="text-right py-1.5 font-medium">% total</th>
                    <th className="text-right py-1.5 font-medium">€/key</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.rows
                    .filter((r) => r.value > 0)
                    .map((r) => {
                      const pct = (r.value / breakdown.total) * 100;
                      return (
                        <tr key={r.name} className="border-b border-stone-100">
                          <td className="py-1.5 text-stone-700">{r.name}</td>
                          <td className="py-1.5 text-right font-mono text-stone-700">
                            {r.value.toLocaleString("en-IE")}
                          </td>
                          <td className="py-1.5 text-right font-mono text-stone-500">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 text-right font-mono text-stone-500">
                            {Math.round(r.value / breakdown.effectiveKeys)}K
                          </td>
                          <td className="py-1.5 w-32 pl-3">
                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600/70 rounded-full"
                                style={{ width: `${Math.min(100, pct * 3)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  <tr className="border-t-2 border-stone-300 bg-stone-50">
                    <td className="py-2 font-semibold text-stone-800">Total capex</td>
                    <td className="py-2 text-right font-mono font-bold text-stone-800">
                      {breakdown.total.toLocaleString("en-IE")}
                    </td>
                    <td className="py-2 text-right font-mono text-stone-500">100%</td>
                    <td className="py-2 text-right font-mono text-stone-500">
                      {Math.round(breakdown.total / breakdown.effectiveKeys)}K
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capexChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f4" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#78716c" }}
                    tickFormatter={(v) => `${v}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#57534e" }}
                    width={150}
                  />
                  <Tooltip
                    formatter={(value) => [fmtK(Number(value)), "Capex"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#047857" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Financial output */}
          <Section title="Returns vs ANICON baseline">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CompareTile
                label="Capex"
                a={fmtM(breakdown.total)}
                b={fmtM(aniconBaseline.capex)}
                better={breakdown.total < aniconBaseline.capex}
              />
              <CompareTile
                label="Keys"
                a={`${breakdown.effectiveKeys}`}
                b={`${aniconBaseline.keys}`}
                better={breakdown.effectiveKeys <= aniconBaseline.keys}
              />
              <CompareTile
                label="ADR"
                a={`€${breakdown.blendedAdr}`}
                b={`€${aniconBaseline.adr}`}
                better={breakdown.blendedAdr > aniconBaseline.adr}
              />
              <CompareTile
                label="YoC"
                a={fmtPct(scenarioResult.yieldOnCost)}
                b={fmtPct(aniconBaseline.yoc)}
                better={scenarioResult.yieldOnCost > aniconBaseline.yoc}
              />
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowChartData} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid stroke="#f1f5f4" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#78716c" }}
                    tickFormatter={(v) => `${v}K`}
                  />
                  <Tooltip
                    formatter={(value) => `€${Number(value).toLocaleString("en-IE")}K`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="NOI" fill="#10b981" name="Annual NOI" radius={[3, 3, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Cumulative"
                    stroke="#0f766e"
                    strokeWidth={2}
                    name="Cumulative NOI"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <Metric label="Year 1 ADR" value={`€${breakdown.blendedAdr}`} />
              <Metric
                label="Year 1 occupancy"
                value={fmtPct(Math.max(0.3, state.occupancyMature / 100 - 0.1))}
              />
              <Metric
                label="Payback"
                value={
                  scenarioResult.paybackYear ? `Year ${scenarioResult.paybackYear - 2028}` : ">10y"
                }
              />
              <Metric
                label="Terminal value"
                value={fmtM(scenarioResult.terminalValue / 1000)}
              />
              <Metric
                label="Owner equity"
                value={fmtM(scenarioResult.ownerEquity / 1000)}
              />
              <Metric
                label="Yield on equity"
                value={fmtPct(scenarioResult.yieldOnEquity)}
              />
              <Metric
                label="Total return (10y)"
                value={fmtM(scenarioResult.totalReturn / 1000)}
              />
              <Metric label="After-tax IRR" value={fmtPct(scenarioResult.afterTaxIrr)} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
        <Sprout className="w-4 h-4 text-emerald-700" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "good" | "warn" | "bad";
}) {
  const tones = {
    good: "border-emerald-200 bg-emerald-50/60",
    warn: "border-amber-200 bg-amber-50/60",
    bad: "border-red-200 bg-red-50/60",
  };
  const accent = {
    good: "text-emerald-800",
    warn: "text-amber-800",
    bad: "text-red-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${accent[tone]}`}>{value}</p>
      {sub && <p className="text-[10px] text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const styles = {
    good: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", Icon: CheckCircle2 },
    warn: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", Icon: AlertTriangle },
    bad: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", Icon: XCircle },
  }[verdict.level];
  const Icon = styles.Icon;
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${styles.text}`} />
      <div className="flex-1">
        <h3 className={`font-semibold ${styles.text}`}>{verdict.headline}</h3>
        <ul className="mt-1.5 space-y-0.5 text-sm text-stone-700">
          {verdict.notes.map((n, i) => (
            <li key={i}>· {n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompareTile({
  label,
  a,
  b,
  better,
}: {
  label: string;
  a: string;
  b: string;
  better: boolean;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-[10px] text-stone-400 uppercase tracking-wider">{label}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <span
          className={`text-base font-bold ${
            better ? "text-emerald-700" : "text-stone-700"
          }`}
        >
          {a}
        </span>
        <span className="text-[10px] text-stone-400">vs {b}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 px-3 py-2 border border-stone-100">
      <p className="text-[10px] text-stone-500">{label}</p>
      <p className="text-sm font-semibold text-stone-800 mt-0.5">{value}</p>
    </div>
  );
}
