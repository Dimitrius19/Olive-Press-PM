import { ArrowRight, MapPin } from "lucide-react";
import type { AccentKey } from "../projects/types";
import { projects } from "../projects/registry";

const ACCENT_BADGE: Record<AccentKey, string> = {
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  sky: "bg-sky-100 text-sky-700 ring-sky-600/20",
  amber: "bg-amber-100 text-amber-700 ring-amber-600/20",
  orange: "bg-orange-100 text-orange-700 ring-orange-600/20",
  violet: "bg-violet-100 text-violet-700 ring-violet-600/20",
  rose: "bg-rose-100 text-rose-700 ring-rose-600/20",
  teal: "bg-teal-100 text-teal-700 ring-teal-600/20",
  indigo: "bg-indigo-100 text-indigo-700 ring-indigo-600/20",
};

const ACCENT_CTA: Record<AccentKey, string> = {
  emerald: "text-emerald-700",
  sky: "text-sky-700",
  amber: "text-amber-700",
  orange: "text-orange-700",
  violet: "text-violet-700",
  rose: "text-rose-700",
  teal: "text-teal-700",
  indigo: "text-indigo-700",
};

// Tinted background + border for the headline-economics band. Full literal
// strings so the Tailwind JIT scanner keeps every class.
const ACCENT_SOFT: Record<AccentKey, string> = {
  emerald: "bg-emerald-50/70 border-emerald-100",
  sky: "bg-sky-50/70 border-sky-100",
  amber: "bg-amber-50/70 border-amber-100",
  orange: "bg-orange-50/70 border-orange-100",
  violet: "bg-violet-50/70 border-violet-100",
  rose: "bg-rose-50/70 border-rose-100",
  teal: "bg-teal-50/70 border-teal-100",
  indigo: "bg-indigo-50/70 border-indigo-100",
};

// Solid fill for the risk-adjusted grade chip, matching the scorecard's grade
// colours (A strong → D marginal). Keyed by the A–D letter grade.
const GRADE_BADGE: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-teal-500",
  C: "bg-amber-500",
  D: "bg-rose-500",
};

interface Props {
  onOpenProject: (id: string) => void;
}

export function PortfolioLanding({ onOpenProject }: Props) {
  return (
    <div className="min-h-screen bg-stone-100">
      {/* ── Masthead ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(16,185,129,0.35), transparent 40%), radial-gradient(circle at 85% 10%, rgba(56,189,248,0.3), transparent 40%), radial-gradient(circle at 60% 90%, rgba(245,158,11,0.3), transparent 45%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-14">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            Tryfon Group · Real Estate
          </span>
          <h1 className="text-4xl font-bold text-white tracking-tight mt-4">
            Development Portfolio
          </h1>
          <p className="text-stone-300/80 text-sm mt-2 max-w-2xl leading-relaxed">
            A project-management workspace across the group's active developments and acquisition
            studies. Select a project to open its dedicated dashboard.
          </p>
          <div className="mt-6 flex gap-8 text-white/90">
            <div>
              <span className="block text-2xl font-bold tabular-nums">{projects.length}</span>
              <span className="text-[11px] uppercase tracking-widest text-white/50">Projects</span>
            </div>
            <div>
              <span className="block text-2xl font-bold tabular-nums">6</span>
              <span className="text-[11px] uppercase tracking-widest text-white/50">Regions</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Project grid ── */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="group text-left bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="relative h-44 overflow-hidden bg-stone-200">
                <img
                  src={p.cover}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span
                  className={`absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${ACCENT_BADGE[p.accent]}`}
                >
                  {p.stage}
                </span>
                {p.score && (
                  <span
                    title={`${p.score.verdict} · risk-adjusted grade ${p.score.grade} (${p.score.composite}/100)`}
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur"
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-black text-white ${GRADE_BADGE[p.score.grade] ?? "bg-stone-500"}`}
                    >
                      {p.score.grade}
                    </span>
                    <span className="text-[11px] font-bold tabular-nums text-stone-700">
                      {p.score.composite}
                      <span className="font-medium text-stone-400">/100</span>
                    </span>
                  </span>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                    {p.name}
                  </h2>
                  <span className="flex items-center gap-1 text-xs text-white/80 mt-0.5">
                    <MapPin size={11} />
                    {p.location}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm text-stone-500 leading-relaxed min-h-[40px]">{p.tagline}</p>

                {p.economics && (
                  <div className={`mt-4 flex rounded-xl border ${ACCENT_SOFT[p.accent]}`}>
                    <div className="flex-1 px-4 py-3">
                      <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                        Total project cost
                      </span>
                      <span className="block text-lg font-bold text-stone-800 tabular-nums mt-0.5">
                        {p.economics.totalCost}
                      </span>
                    </div>
                    <div className="flex-1 px-4 py-3 border-l border-stone-200/70">
                      <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                        IRR
                      </span>
                      <span
                        className={`block text-lg font-bold tabular-nums mt-0.5 ${ACCENT_CTA[p.accent]}`}
                      >
                        {p.economics.irr}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-100">
                  {p.kpis.slice(0, 4).map((k) => (
                    <div key={k.label}>
                      <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                        {k.label}
                      </span>
                      <span className="block text-sm font-bold text-stone-800 tabular-nums mt-0.5">
                        {k.value}
                      </span>
                    </div>
                  ))}
                </div>

                <span
                  className={`flex items-center gap-1.5 text-sm font-semibold mt-5 ${ACCENT_CTA[p.accent]}`}
                >
                  Open project
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
