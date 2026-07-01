import { clamp, fmtPct, type Scorecard, type ScoreAxis } from "../projects/cases/model";
import type { SimStats } from "../lib/simulate";

// Presentational risk-adjusted scorecard — a composite grade hero plus the three
// axis bars (IRR / development risk / operational) that compose it. Self-contained
// and context-free: it takes a finished Scorecard plus optional accent classes, so
// it renders identically inside an opportunity case (themed by the case accent) and
// inside a standalone flagship view (which has no case context).

// Colour band for a 0–100 score: green (strong) → amber (fair) → rose (weak).
function band(score: number) {
  if (score >= 70) return { bar: "bg-emerald-500", text: "text-emerald-700" };
  if (score >= 45) return { bar: "bg-amber-500", text: "text-amber-700" };
  return { bar: "bg-rose-500", text: "text-rose-600" };
}

// Return-distribution fan: a P10–P90 band with the P50 marker and the hurdle
// tick, on a shared scale. Renders under the IRR axis when the score came from a
// Monte-Carlo distribution — so the reader sees dispersion and the bar the deal
// must clear, not just a single grade.
function DistFan({ dist }: { dist: SimStats }) {
  const { p10, p50, p90, hurdle } = dist;
  const lo = Math.min(p10, hurdle);
  const hi = Math.max(p90, hurdle);
  const pad = (hi - lo) * 0.12 || 0.01;
  const dLo = lo - pad;
  const span = hi + pad - dLo || 1;
  const pos = (x: number) => clamp(((x - dLo) / span) * 100, 0, 100);
  const beats = p50 >= hurdle;
  const prob = Math.round(clamp(dist.probAtLeastHurdle, 0, 1) * 100);
  return (
    <div className="mt-2">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-stone-100" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-stone-300"
          style={{ left: `${pos(p10)}%`, width: `${pos(p90) - pos(p10)}%` }}
        />
        {/* hurdle tick */}
        <div
          className="absolute top-0 bottom-0 w-px bg-stone-500"
          style={{ left: `${pos(hurdle)}%` }}
        />
        {/* P50 marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            beats ? "bg-emerald-500" : "bg-rose-500"
          }`}
          style={{ left: `${pos(p50)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-stone-400 tabular-nums mt-1">
        <span>P10 {fmtPct(p10)}</span>
        <span className="text-stone-500">
          hurdle {fmtPct(hurdle)} · {prob}% clear
        </span>
        <span>P90 {fmtPct(p90)}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, detail, dist }: ScoreAxis) {
  const b = band(score);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${b.text}`}>
          {Math.round(score)}
          <span className="text-stone-400 font-normal"> / 100</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
        <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${score}%` }} />
      </div>
      {dist && <DistFan dist={dist} />}
      <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{detail}</p>
    </div>
  );
}

const gradeStyles: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-teal-500 text-white",
  C: "bg-amber-500 text-white",
  D: "bg-rose-500 text-white",
};

// Shared card language, matching the case Card primitive (rounded-xl, stone border).
const CARD = "rounded-xl border border-stone-200/80 bg-white p-6 shadow-sm";

export interface RiskScorecardProps {
  scorecard: Scorecard;
  // Accent classes for the composite hero card's left border + gradient. Default
  // to a neutral stone treatment when a caller has no accent to theme with.
  softBorder?: string; // e.g. "border-l-sky-500"
  softFrom?: string; // e.g. "from-sky-500/[0.08]"
}

export function RiskScorecard({
  scorecard,
  softBorder = "border-l-stone-400",
  softFrom = "from-stone-500/[0.08]",
}: RiskScorecardProps) {
  const { grade, composite, verdict, irr, risk, operational } = scorecard;
  return (
    <div className="space-y-4">
      <div className={`${CARD} border-l-4 ${softBorder} bg-gradient-to-b ${softFrom} to-white`}>
        <div className="flex items-center gap-5">
          <div
            className={`flex-none w-16 h-16 rounded-2xl grid place-items-center text-3xl font-black ${
              gradeStyles[grade] ?? "bg-stone-500 text-white"
            }`}
          >
            {grade}
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-800 tabular-nums leading-none">
              {Math.round(composite)}
              <span className="text-base font-medium text-stone-400"> / 100</span>
            </div>
            <p className="text-sm text-stone-600 mt-1 font-medium">{verdict}</p>
          </div>
        </div>
      </div>

      <div className={CARD}>
        <div className="space-y-5">
          <ScoreBar {...irr} />
          <ScoreBar {...risk} />
          <ScoreBar {...operational} />
        </div>
      </div>
    </div>
  );
}
