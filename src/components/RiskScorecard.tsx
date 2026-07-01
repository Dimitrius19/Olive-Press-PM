import type { Scorecard, ScoreAxis } from "../projects/cases/model";

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

function ScoreBar({ label, score, detail }: ScoreAxis) {
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
