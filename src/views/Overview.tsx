import { useMemo, useState } from "react";
import { KpiCard } from "../components/KpiCard";
import { StatusBadge } from "../components/StatusBadge";
import { PROJECT_CONSTANTS } from "../data/seed";
import { useActivities } from "../hooks/useActivities";
import { useBudgetLines } from "../hooks/useBudget";
import { useRisks } from "../hooks/useRisks";
import { useDocuments } from "../hooks/useDocuments";

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

export function Overview() {
  const { data: activities } = useActivities();
  const { data: budgetLines } = useBudgetLines();
  const { data: risks } = useRisks();
  const { data: documents } = useDocuments();
  const [imgError, setImgError] = useState(false);

  const daysToOperation = daysUntil(PROJECT_CONSTANTS.operationDay1);

  const overallProgress = useMemo(() => {
    if (!activities?.length) return 0;
    const total = activities.reduce((sum, a) => sum + a.progress_pct, 0);
    return Math.round(total / activities.length);
  }, [activities]);

  const activeRiskCount = useMemo(() => {
    if (!risks) return 0;
    return risks.filter((r) => r.status !== "resolved").length;
  }, [risks]);

  const totalSpent = useMemo(() => {
    if (!budgetLines) return 0;
    return budgetLines.reduce((sum, l) => sum + l.actual_amount, 0);
  }, [budgetLines]);

  const totalRevised = useMemo(() => {
    if (!budgetLines) return 0;
    return budgetLines.reduce((sum, l) => sum + l.anicon_revised, 0);
  }, [budgetLines]);

  const budgetPct = totalRevised > 0 ? Math.round((totalSpent / totalRevised) * 100) : 0;

  const currentQActivities = useMemo(() => {
    const qLabel = currentQuarterLabel();
    if (!activities) return [];
    return activities.filter((a) => a.quarter === qLabel);
  }, [activities]);

  const formatEuro = (v: number) =>
    new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden -mx-8 -mt-8 mb-4">
        <img
          src="/hotel-aerial.jpg"
          alt="Olive Press Hotel — Aerial view, Molyvos, Lesvos"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            {PROJECT_CONSTANTS.projectName}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {PROJECT_CONSTANTS.location}
          </p>
          <p className="text-amber-300 text-sm mt-1 font-semibold">
            {daysToOperation > 0
              ? `${daysToOperation} days until operation`
              : "Operational"}
          </p>
        </div>
      </div>

      {/* Mediterranean divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />

      {/* Hotel Photo Strip */}
      <div className="grid grid-cols-3 gap-3 -mt-2">
        <div className="rounded-xl overflow-hidden h-28">
          <img src="/hotel-pool.jpg" alt="Pool & Castle view" className="w-full h-full object-cover" />
        </div>
        <div className="rounded-xl overflow-hidden h-28">
          <img src="/hotel-view.jpg" alt="Hotel from sea" className="w-full h-full object-cover" />
        </div>
        <div className="rounded-xl overflow-hidden h-28">
          <img src="/hotel-exterior.jpg" alt="Hotel exterior" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Overall Progress */}
      <div>
        <div className="flex justify-between text-sm text-stone-600 mb-1">
          <span className="font-medium">Overall Progress</span>
          <span className="font-semibold">{overallProgress}%</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-3">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Construction Cost / m2"
          value={formatEuro(PROJECT_CONSTANTS.constructionCostPerSqm)}
          subtitle={`${PROJECT_CONSTANTS.totalSqm.toLocaleString()} m2 total`}
        />
        <KpiCard
          label="Rooms Completed"
          value={`0 / ${PROJECT_CONSTANTS.totalRooms}`}
          subtitle="Pending construction"
        />
        <KpiCard
          label="Active Risks"
          value={String(activeRiskCount)}
          variant={activeRiskCount > 5 ? "danger" : activeRiskCount > 2 ? "warning" : "default"}
        />
        <KpiCard
          label="Documents"
          value={String(documents?.length ?? 0)}
        />
        <KpiCard
          label="State Subsidy"
          value={formatEuro(PROJECT_CONSTANTS.stateSubsidy)}
          subtitle={`\u0391\u03BD\u03B1\u03C0\u03C4\u03C5\u03BE\u03B9\u03B1\u03BA\u03CC\u03C2 \u039D\u03CC\u03BC\u03BF\u03C2, ${PROJECT_CONSTANTS.subsidyRate * 100}% of ${formatEuro(PROJECT_CONSTANTS.approvedSubsidyBudget)}`}
        />
      </div>

      {/* Budget Gauge */}
      <div className="bg-amber-50/40 rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-medium text-stone-500 mb-3">
          Budget Utilisation
        </h3>
        <div className="flex items-end gap-4 mb-2">
          <span className="text-2xl font-bold text-stone-900">
            {formatEuro(totalSpent)}
          </span>
          <span className="text-sm text-stone-400 pb-0.5">
            of {formatEuro(totalRevised)} revised
          </span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              budgetPct > 100 ? "bg-red-500" : budgetPct > 80 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1">{budgetPct}% utilised</p>
      </div>

      {/* Current Quarter Activities */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-medium text-stone-500 mb-4">
          {currentQuarterLabel()} Activities
        </h3>
        {currentQActivities.length === 0 ? (
          <p className="text-stone-400 text-sm">
            No activities scheduled for this quarter.
          </p>
        ) : (
          <div className="space-y-3">
            {currentQActivities.map((a) => (
              <div key={a.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700" title={`${a.number}. ${a.name}`}>
                    {a.number}. {a.name}
                  </p>
                  <div className="w-full bg-stone-100 rounded-full h-2 mt-1">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${a.progress_pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-stone-400 w-10 text-right shrink-0">
                  {a.progress_pct}%
                </span>
                <StatusBadge value={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Masterplan */}
      {!imgError && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-medium text-stone-500 mb-3">
            Site Masterplan
          </h3>
          <img
            src="/masterplan.png"
            alt="Olive Press Hotel Masterplan"
            className="w-full rounded-lg"
            onError={() => setImgError(true)}
          />
        </div>
      )}
    </div>
  );
}
