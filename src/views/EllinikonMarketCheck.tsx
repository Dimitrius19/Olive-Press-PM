import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

// ---------- Self-contained market data (indicative, Athens Riviera) ----------
// Sale-price comparables and demand context compiled to validate the
// build-to-sell model's pricing assumptions. Figures are indicative market
// ranges (Lamda Development / Athens Riviera prime market, 2025–26), not
// transaction records — they sense-check the €30,000/m² headline assumption.

const VILLA_MAIN_PRICE = 30_000; // model assumption, €/m² main built area
const VILLA_BLENDED_PRICE = 26_250; // €52.5M GDV ÷ 2,000 m² built
const EFFECTIVE_BUILD_PSM = 6_500; // base construction €13.0M ÷ 2,000 m²

interface Comp {
  name: string;
  low: number;
  high: number;
  mid: number;
  tier: "ellinikon" | "prime" | "core";
}

const COMPS: Comp[] = [
  { name: "Ellinikon — Cove villas (waterfront)", low: 25_000, high: 35_000, mid: 30_000, tier: "ellinikon" },
  { name: "Ellinikon — Riviera Tower", low: 20_000, high: 28_000, mid: 24_000, tier: "ellinikon" },
  { name: "Vouliagmeni (prime waterfront)", low: 11_000, high: 16_000, mid: 13_500, tier: "prime" },
  { name: "Glyfada (Golden Coast)", low: 7_000, high: 10_000, mid: 8_500, tier: "core" },
  { name: "Voula", low: 6_000, high: 8_500, mid: 7_250, tier: "core" },
];

const TIER_FILL: Record<Comp["tier"], string> = {
  ellinikon: "#0ea5e9",
  prime: "#38bdf8",
  core: "#a8a29e",
};

// Athens prime residential price index (2015 = 100, indicative). Reflects the
// Bank of Greece apartment index trend, with prime/Riviera running ahead.
const PRICE_TREND = [
  { year: "2015", index: 100 },
  { year: "2017", index: 105 },
  { year: "2019", index: 122 },
  { year: "2021", index: 137 },
  { year: "2023", index: 175 },
  { year: "2024", index: 191 },
  { year: "2025", index: 205 },
];

const DEMAND_DRIVERS = [
  {
    title: "Golden Visa concentration",
    body: "The 2024 threshold rise to €800k in Attica funnels foreign capital into higher-value homes — squarely the villa's segment.",
  },
  {
    title: "The Ellinikon catalyst",
    body: "An €8bn+ flagship regeneration (Riviera Tower, Marina, Galleria, the Park) is re-rating the whole submarket around the site.",
  },
  {
    title: "Foreign UHNW demand",
    body: "Non-EU and EU buyers take a large share of prime Athens transactions; branded, turnkey waterfront stock is scarce.",
  },
  {
    title: "New-build scarcity",
    body: "Very limited delivery of ultra-prime, new-build waterfront product keeps competition for trophy assets thin.",
  },
];

type Verdict = "ok" | "watch" | "stretch";

const ASSUMPTION_CHECKS: {
  label: string;
  value: string;
  verdict: Verdict;
  note: string;
}[] = [
  {
    label: "Main sale €30,000/m²",
    value: "Top of range",
    verdict: "stretch",
    note: "Matches the Ellinikon Cove waterfront tier — the highest in Greece. Achievable only for best-in-class branded product.",
  },
  {
    label: "Blended GDV €26,250/m²",
    value: "Premium, supportable",
    verdict: "watch",
    note: "Above Riviera Tower, below pure Cove — reasonable for a standalone ultra-prime villa if positioning and finish match.",
  },
  {
    label: "Effective build ≈ €6,500/m²",
    value: "Elevated",
    verdict: "watch",
    note: "At the top of the €4,000–6,000/m² prime-villa benchmark; justified only by ultra-lux spec. Watch cost on the CAPEX page.",
  },
  {
    label: "Land basis €13.0M",
    value: "Committed",
    verdict: "ok",
    note: "Already paid in. The return is driven by sale price and build cost, not further land risk.",
  },
];

const VERDICT_STYLE: Record<Verdict, { dot: string; text: string; bg: string }> = {
  ok: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  watch: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  stretch: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const fmtPsm = (v: number) => `€${v.toLocaleString("en-US")}`;

function Tile({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-2xl font-bold text-stone-800 tabular-nums leading-tight">{value}</p>
      <p className="text-sm font-medium text-stone-600 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function EllinikonMarketCheck() {
  const chartData = COMPS.map((c) => ({ name: c.name, mid: c.mid, tier: c.tier }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <TrendingUp className="text-sky-600" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">Market Check</h2>
        </div>
        <p className="text-stone-500 mt-1 ml-10">
          Ellinikon Villa &middot; Athens Riviera &mdash; sale-price comparables, demand drivers &amp; assumption validation
        </p>
      </div>

      {/* Positioning callout */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-900 leading-relaxed">
        <strong className="font-semibold">Positioning: </strong>
        the model's €30,000/m² main sale price sits at the very top of the Greek market &mdash; the Ellinikon
        Cove waterfront tier. That is achievable for best-in-class branded product, but it leaves little
        pricing upside, so pre-sales and build quality become the critical levers.
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile value="€52.5M" label="Gross development value" sub="2,000 m² built" />
        <Tile value={`${fmtPsm(VILLA_MAIN_PRICE)}/m²`} label="Main sale assumption" sub="1,500 m² main area" />
        <Tile value={`${fmtPsm(VILLA_BLENDED_PRICE)}/m²`} label="Blended GDV / m²" sub="main + secondary" />
        <Tile value={`${fmtPsm(EFFECTIVE_BUILD_PSM)}/m²`} label="Effective build cost" sub="base, from CAPEX plan" />
      </div>

      {/* Comparables chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Sale-price comparables (€/m²)</h3>
        <p className="text-xs text-stone-400 mb-4">
          Indicative mid-point prices. The dashed line marks the villa's €30,000/m² main assumption.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#a8a29e" interval={0} angle={-12} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => [`${fmtPsm(Number(value))} /m²`]} />
            <ReferenceLine y={VILLA_MAIN_PRICE} stroke="#0284c7" strokeDasharray="5 4" label={{ value: "Villa €30k/m²", position: "insideTopRight", fontSize: 11, fill: "#0284c7" }} />
            <Bar dataKey="mid" radius={[4, 4, 0, 0]}>
              {chartData.map((d) => (
                <Cell key={d.name} fill={TIER_FILL[d.tier]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparables table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">Comparable price ranges</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-[11px] text-stone-400 uppercase tracking-wider">
                <th className="py-2.5 px-5 text-left font-semibold">Comparable</th>
                <th className="py-2.5 px-3 text-right font-semibold">Low</th>
                <th className="py-2.5 px-3 text-right font-semibold">Mid</th>
                <th className="py-2.5 px-5 text-right font-semibold">High</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {COMPS.map((c) => (
                <tr key={c.name} className="hover:bg-sky-50/30">
                  <td className="py-2.5 px-5 font-medium text-stone-800">{c.name}</td>
                  <td className="py-2.5 px-3 text-right text-stone-500 tabular-nums">{fmtPsm(c.low)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-stone-800 tabular-nums">{fmtPsm(c.mid)}</td>
                  <td className="py-2.5 px-5 text-right text-stone-500 tabular-nums">{fmtPsm(c.high)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price trend */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Athens prime price trend</h3>
        <p className="text-xs text-stone-400 mb-4">Indicative residential price index (2015 = 100); prime / Riviera has run ahead of the city average.</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={PRICE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#a8a29e" />
            <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" domain={[80, 220]} />
            <Tooltip formatter={(value) => [`${Number(value)}`, "Index"]} />
            <Line type="monotone" dataKey="index" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Demand drivers */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Demand drivers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEMAND_DRIVERS.map((d) => (
            <div key={d.title} className="rounded-xl border border-stone-200 bg-white p-5">
              <h4 className="text-sm font-bold text-stone-800">{d.title}</h4>
              <p className="text-[13px] text-stone-500 leading-relaxed mt-1.5">{d.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assumption check */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Model assumption check</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ASSUMPTION_CHECKS.map((a) => {
            const s = VERDICT_STYLE[a.verdict];
            return (
              <div key={a.label} className={`rounded-xl border p-4 ${s.bg}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-stone-800">{a.label}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.text}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
                    {a.value}
                  </span>
                </div>
                <p className="text-[13px] text-stone-600 leading-relaxed mt-2">{a.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h3 className="font-semibold text-stone-800 mb-2">Basis &amp; methodology</h3>
        <p className="text-sm text-stone-600 leading-relaxed">
          Comparable €/m² ranges are indicative figures for the Athens Riviera prime market (Lamda Development /
          market, 2025&ndash;26), compiled to validate the build-to-sell model rather than as transaction records.
          The €30,000/m² main and €15,000/m² secondary assumptions and the €13.0M base construction cost flow from
          the <span className="font-medium text-stone-700">Build-Sell Model</span> and{" "}
          <span className="font-medium text-stone-700">Construction CAPEX</span> pages &mdash; edit them there and the
          implied €/m² metrics above move with them. Effective build cost shown is the base estimate before
          escalation, contingency and VAT treatment.
        </p>
      </div>
    </div>
  );
}
