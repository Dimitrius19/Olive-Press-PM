import { useMemo, useCallback, useState } from "react";
import { Info, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { PROJECT_CONSTANTS } from "../data/seed";
import {
  useBudgetCategories,
  useBudgetLines,
  useUpdateBudgetLine,
} from "../hooks/useBudget";
import { BudgetRow } from "./BudgetRow";

const formatEuro = (v: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

export function Budget() {
  const { data: categories, isLoading: catLoading } = useBudgetCategories();
  const { data: lines, isLoading: linesLoading } = useBudgetLines();
  const updateLine = useUpdateBudgetLine();

  const handleActualChange = useCallback(
    (id: string, actual: number) => {
      updateLine.mutate({ id, updates: { actual_amount: actual } });
    },
    [updateLine],
  );

  const totals = useMemo(() => {
    if (!lines) return { base: 0, contingency: 0, inflation: 0, grand: 0, actual: 0 };
    const base = lines.reduce((s, l) => s + l.anicon_revised, 0);
    const contingency = base * (1 + PROJECT_CONSTANTS.contingencyRate);
    const inflation = contingency * (1 + PROJECT_CONSTANTS.inflationRate);
    const grand = inflation * (1 + PROJECT_CONSTANTS.vatRate);
    const actual = lines.reduce((s, l) => s + l.actual_amount, 0);
    return { base, contingency, inflation, grand, actual };
  }, [lines]);

  const costPerRoom = totals.base > 0 ? totals.base / PROJECT_CONSTANTS.totalRooms : 0;
  const costPerSqm = totals.base > 0 ? totals.base / PROJECT_CONSTANTS.totalSqm : 0;

  const flaggedCount = lines?.filter((l) => l.flagged).length ?? 0;

  // Soft cost ratio: D-category total / (A + B category totals)
  const softCostRatio = useMemo(() => {
    if (!lines || !categories) return null;
    const dCats = categories.filter((c) => c.code.startsWith("D"));
    const abCats = categories.filter(
      (c) => c.code.startsWith("A") || c.code.startsWith("B"),
    );
    const dTotal = lines
      .filter((l) => dCats.some((c) => c.id === l.category_id))
      .reduce((s, l) => s + l.anicon_revised, 0);
    const abTotal = lines
      .filter((l) => abCats.some((c) => c.id === l.category_id))
      .reduce((s, l) => s + l.anicon_revised, 0);
    if (abTotal === 0) return null;
    return (dTotal / abTotal) * 100;
  }, [lines, categories]);

  const [contextExpanded, setContextExpanded] = useState(false);

  const isLoading = catLoading || linesLoading;

  if (isLoading) {
    return <p className="text-stone-400">Loading budget...</p>;
  }

  // OP II category codes
  const OP2_CODES = new Set(["A2", "B2", "C2"]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800">Budget Tracker</h2>

      {/* ANICON Report Context Card */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-stone-800">ANICON Report Context</h3>
            <p className="text-sm text-stone-600 mt-1">
              This budget is based on ANICON&apos;s{" "}
              <strong>High Level Sanity Check</strong> (Χονδρική Εκτίμηση),
              dated 20 March 2026. It is a desk-based review of the original
              budget &mdash; not a detailed cost estimate.
            </p>
            <button
              onClick={() => setContextExpanded(!contextExpanded)}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              {contextExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Report Limitations &amp; Pending Items
            </button>
            {contextExpanded && (
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <p>
                  <strong>Key limitations noted by ANICON:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No site visit was conducted</li>
                  <li>No contact with the design team during the review</li>
                  <li>
                    No quantity verification against drawings (BoQ quantities
                    assumed accurate)
                  </li>
                  <li>No technical specifications were provided</li>
                  <li>No MEP technical descriptions were provided</li>
                  <li>
                    Structural drawings only show reinforcement &mdash; no full
                    structural report
                  </li>
                  <li>
                    Analysis based solely on documents provided by the client
                  </li>
                </ul>
                <p className="mt-2">
                  <strong>Pending client confirmations:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Contractor procurement method and overhead/profit rates
                  </li>
                  <li>
                    Insurance contribution estimates (not yet budgeted)
                  </li>
                  <li>
                    Interior Designer engagement (awaiting confirmation)
                  </li>
                  <li>PM/CM appointment (awaiting confirmation)</li>
                  <li>
                    Application Studies contracts (existing contracts for
                    Definitive Study only)
                  </li>
                </ul>
                <p className="mt-2 text-amber-700 font-medium">
                  ANICON recommends updating this estimate after completion of
                  all Application Studies and submission of required technical
                  documents, in collaboration with the full project design team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Original Budget Comparison */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 text-sm text-stone-600">
          <span className="font-medium text-stone-700">Original estimate:</span>{" "}
          {formatEuro(140_000)}/room &rarr;{" "}
          <span className="font-medium text-stone-700">ANICON revised:</span>{" "}
          {formatEuro(219_957)}/room{" "}
          <span className="text-red-600 font-semibold">(+57%)</span>
        </div>
        <p className="text-xs text-stone-500 italic max-w-md">
          ANICON conclusion: &ldquo;&euro;140K/room is inadequate for full
          renovation of a preserved heritage 4-star hotel&rdquo;
        </p>
      </div>

      {/* Flagged items count */}
      {flaggedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{flaggedCount} item{flaggedCount !== 1 ? "s" : ""}</strong>{" "}
            flagged by ANICON for unit price review
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Base Revised"
          value={formatEuro(totals.base)}
          subtitle="ANICON revised total"
        />
        <KpiCard
          label="+Contingency 10%"
          value={formatEuro(totals.contingency)}
        />
        <KpiCard
          label="+Inflation 4%"
          value={formatEuro(totals.inflation)}
        />
        <KpiCard
          label="Grand Total incl. VAT"
          value={formatEuro(totals.grand)}
          variant="warning"
        />
      </div>

      {/* Per-unit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Cost / Room"
          value={formatEuro(costPerRoom)}
          subtitle={`${PROJECT_CONSTANTS.totalRooms} rooms`}
        />
        <KpiCard
          label="Cost / m²"
          value={formatEuro(costPerSqm)}
          subtitle={`${PROJECT_CONSTANTS.totalSqm.toLocaleString()} m²`}
        />
        {softCostRatio !== null && (
          <KpiCard
            label="Soft Cost Ratio"
            value={`${softCostRatio.toFixed(1)}%`}
            subtitle={`ANICON benchmark: 13–15%`}
          />
        )}
      </div>

      {/* Category tables */}
      {categories?.map((cat) => {
        const catLines = lines?.filter((l) => l.category_id === cat.id) ?? [];
        if (catLines.length === 0) return null;

        const catTotal = catLines.reduce((s, l) => s + l.anicon_revised, 0);
        const isOp2 = OP2_CODES.has(cat.code);

        return (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-stone-200 overflow-hidden"
          >
            <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center flex-wrap gap-y-1">
                <span className="text-xs text-stone-400 mr-2">{cat.code}</span>
                <span className="text-sm font-semibold text-stone-700">
                  {cat.name}
                </span>
                {isOp2 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                    Added by ANICON (not in original budget)
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-stone-600">
                {formatEuro(catTotal)}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] text-stone-400 uppercase">
                  <th className="py-2 px-3 text-left font-medium">Description</th>
                  <th className="py-2 px-3 text-right font-medium">Original</th>
                  <th className="py-2 px-3 text-right font-medium">ANICON Revised</th>
                  <th className="py-2 px-3 text-right font-medium">Actual</th>
                  <th className="py-2 px-3 text-right font-medium">Variance</th>
                  <th className="py-2 px-3 text-right font-medium">&euro;/m²</th>
                  <th className="py-2 px-3 text-right font-medium">&euro;/key</th>
                </tr>
              </thead>
              <tbody>
                {catLines.map((line) => (
                  <BudgetRow
                    key={line.id}
                    line={line}
                    onActualChange={handleActualChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
