import { useMemo, useCallback } from "react";
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

  const isLoading = catLoading || linesLoading;

  if (isLoading) {
    return <p className="text-stone-400">Loading budget...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800">Budget Tracker</h2>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Category tables */}
      {categories?.map((cat) => {
        const catLines = lines?.filter((l) => l.category_id === cat.id) ?? [];
        if (catLines.length === 0) return null;

        const catTotal = catLines.reduce((s, l) => s + l.anicon_revised, 0);

        return (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-stone-200 overflow-hidden"
          >
            <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 mr-2">{cat.code}</span>
                <span className="text-sm font-semibold text-stone-700">
                  {cat.name}
                </span>
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
