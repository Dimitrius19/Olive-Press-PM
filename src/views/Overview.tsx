import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { PROJECT_CONSTANTS } from "../data/seed";
import { useActivities } from "../hooks/useActivities";
import { useBudgetLines } from "../hooks/useBudget";
import { useRisks } from "../hooks/useRisks";
import { useDocuments } from "../hooks/useDocuments";
import {
  Building2,
  CalendarClock,
  ShieldAlert,
  FileText,
  Banknote,
  TrendingUp,
} from "lucide-react";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function currentQuarterLabel(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

export function Overview() {
  const { data: activities } = useActivities();
  const { data: budgetLines } = useBudgetLines();
  const { data: risks } = useRisks();
  const { data: documents } = useDocuments();
  const [imgError, setImgError] = useState(false);

  const daysToOp = daysUntil(PROJECT_CONSTANTS.operationDay1);

  const overallProgress = useMemo(() => {
    if (!activities?.length) return 0;
    return Math.round(
      activities.reduce((s, a) => s + a.progress_pct, 0) / activities.length,
    );
  }, [activities]);

  const activeRiskCount = useMemo(
    () => risks?.filter((r) => r.status !== "resolved").length ?? 0,
    [risks],
  );

  const totalSpent = useMemo(
    () => budgetLines?.reduce((s, l) => s + l.actual_amount, 0) ?? 0,
    [budgetLines],
  );

  const totalRevised = useMemo(
    () => budgetLines?.reduce((s, l) => s + l.anicon_revised, 0) ?? 0,
    [budgetLines],
  );

  const budgetPct =
    totalRevised > 0 ? Math.round((totalSpent / totalRevised) * 100) : 0;

  const currentQActivities = useMemo(() => {
    const q = currentQuarterLabel();
    return activities?.filter((a) => a.quarter === q) ?? [];
  }, [activities]);

  return (
    <div className="-mx-8 -mt-8">
      {/* ── Hero ── */}
      <div className="relative h-72 overflow-hidden">
        <img
          src="/hotel-aerial.jpg"
          alt="Olive Press Hotel — Aerial view"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1a]/90 via-[#1a2e1a]/40 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-6">
          <div className="flex items-end justify-between max-w-full">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                {PROJECT_CONSTANTS.projectName}
              </h1>
              <p className="text-emerald-200/80 text-sm mt-1 tracking-wide">
                {PROJECT_CONSTANTS.location}
              </p>
            </div>

            {/* Countdown */}
            <div className="text-right hidden sm:block">
              <p className="text-5xl font-bold text-white tabular-nums">
                {daysToOp}
              </p>
              <p className="text-emerald-200/60 text-[11px] uppercase tracking-widest mt-1">
                Days to Operation
              </p>
            </div>
          </div>

          {/* Progress inline in hero */}
          <div className="mt-5">
            <div className="flex justify-between text-[11px] text-emerald-200/60 uppercase tracking-widest mb-1.5">
              <span>Overall Progress</span>
              <span className="text-white font-semibold text-xs normal-case">
                {overallProgress}%
              </span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Heritage emblem — floating badge in hero */}
        <div className="absolute top-5 right-5 w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-lg backdrop-blur-sm bg-white/10">
          <img
            src="/heritage-stork-emblem.jpg"
            alt="ΣΗΜΑ ΚΑΤΑΤΕΘΕΝ"
            className="w-full h-full object-cover"
            title="Heritage Emblem — ΣΗΜΑ ΚΑΤΑΤΕΘΕΝ, 19th century olive press trademark"
          />
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              icon: Building2,
              label: "Rooms",
              value: `0 / ${PROJECT_CONSTANTS.totalRooms}`,
              sub: "Pending construction",
              color: "text-stone-600",
            },
            {
              icon: TrendingUp,
              label: "Cost / m\u00B2",
              value: `\u20AC${PROJECT_CONSTANTS.constructionCostPerSqm.toLocaleString()}`,
              sub: `${PROJECT_CONSTANTS.totalSqm.toLocaleString()} m\u00B2 total`,
              color: "text-stone-600",
            },
            {
              icon: ShieldAlert,
              label: "Active Risks",
              value: String(activeRiskCount),
              sub: `${risks?.filter((r) => r.status === "resolved").length ?? 0} resolved`,
              color:
                activeRiskCount > 10
                  ? "text-red-600"
                  : activeRiskCount > 5
                    ? "text-amber-600"
                    : "text-emerald-600",
            },
            {
              icon: FileText,
              label: "Documents",
              value: String(documents?.length ?? 0),
              sub: "Upload in Documents tab",
              color: "text-stone-600",
            },
            {
              icon: Banknote,
              label: "State Subsidy",
              value: fmt(PROJECT_CONSTANTS.stateSubsidy),
              sub: `\u0391\u03BD\u03B1\u03C0\u03C4\u03C5\u03BE\u03B9\u03B1\u03BA\u03CC\u03C2 50%`,
              color: "text-emerald-600",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                  {kpi.label}
                </span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>
                {kpi.value}
              </p>
              {kpi.sub && (
                <p className="text-[11px] text-stone-400 mt-0.5">{kpi.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-8 mt-8 space-y-6 pb-8">
        {/* Budget & Activities side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Gauge */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-4">
              Budget Utilisation
            </h3>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-3xl font-bold text-stone-800 tabular-nums">
                {fmt(totalSpent)}
              </span>
              <span className="text-sm text-stone-400">
                of {fmt(totalRevised)}
              </span>
            </div>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPct > 100
                    ? "bg-red-500"
                    : budgetPct > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[11px] text-stone-400">
                {budgetPct}% utilised
              </p>
              <p className="text-[11px] text-stone-400">
                {fmt(totalRevised - totalSpent)} remaining
              </p>
            </div>
          </div>

          {/* Current Quarter Activities */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                {currentQuarterLabel()} Activities
              </h3>
              <CalendarClock className="w-3.5 h-3.5 text-stone-300" />
            </div>
            {currentQActivities.length === 0 ? (
              <p className="text-stone-400 text-sm py-4">
                No activities scheduled for this quarter.
              </p>
            ) : (
              <div className="space-y-3">
                {currentQActivities.map((a) => (
                  <div key={a.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-sm text-stone-700 truncate pr-4"
                        title={`${a.number}. ${a.name}`}
                      >
                        <span className="text-stone-400 tabular-nums mr-1.5">
                          {a.number}.
                        </span>
                        {a.name}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-stone-400 tabular-nums">
                          {a.progress_pct}%
                        </span>
                        <StatusBadge value={a.status} />
                      </div>
                    </div>
                    <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/70 rounded-full transition-all"
                        style={{ width: `${a.progress_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Masterplan */}
        {!imgError && (
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-4">
              Site Masterplan
            </h3>
            <div className="rounded-lg overflow-hidden bg-stone-900">
              <img
                src="/masterplan.png"
                alt="Olive Press Hotel Masterplan"
                className="w-full"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
