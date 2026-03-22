import { useState, useCallback } from "react";
import type { BudgetLine } from "../lib/types";
import { PROJECT_CONSTANTS } from "../data/seed";

interface BudgetRowProps {
  line: BudgetLine;
  onActualChange: (id: string, actual: number) => void;
}

function varianceClass(variance: number): string {
  if (variance <= 0) return "text-green-600";
  if (variance <= 10) return "text-amber-600";
  return "text-red-600";
}

const formatEuro = (v: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

export function BudgetRow({ line, onActualChange }: BudgetRowProps) {
  const [localActual, setLocalActual] = useState(String(line.actual_amount));

  const variancePct =
    line.anicon_revised > 0
      ? ((line.actual_amount - line.anicon_revised) / line.anicon_revised) * 100
      : 0;

  const costPerSqm = line.cost_per_sqm ?? line.anicon_revised / PROJECT_CONSTANTS.totalSqm;
  const costPerKey = line.cost_per_key ?? line.anicon_revised / PROJECT_CONSTANTS.totalRooms;

  const handleBlur = useCallback(() => {
    const parsed = parseFloat(localActual);
    if (!isNaN(parsed) && parsed !== line.actual_amount) {
      onActualChange(line.id, parsed);
    }
  }, [localActual, line.id, line.actual_amount, onActualChange]);

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50">
      <td className="py-2 px-3 text-sm text-stone-700">
        <div className="flex items-center gap-2">
          {line.description}
          {line.flagged && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              REVIEW
            </span>
          )}
        </div>
      </td>
      <td className="py-2 px-3 text-sm text-stone-600 text-right">
        {formatEuro(line.original_estimate)}
      </td>
      <td className="py-2 px-3 text-sm text-stone-600 text-right">
        {formatEuro(line.anicon_revised)}
      </td>
      <td className="py-2 px-3 text-right">
        <input
          type="number"
          value={localActual}
          onChange={(e) => setLocalActual(e.target.value)}
          onBlur={handleBlur}
          className="w-28 text-sm text-right border border-stone-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
      </td>
      <td className={`py-2 px-3 text-sm text-right font-medium ${varianceClass(variancePct)}`}>
        {variancePct > 0 ? "+" : ""}
        {variancePct.toFixed(1)}%
      </td>
      <td className="py-2 px-3 text-sm text-stone-500 text-right">
        {formatEuro(costPerSqm)}
      </td>
      <td className="py-2 px-3 text-sm text-stone-500 text-right">
        {formatEuro(costPerKey)}
      </td>
    </tr>
  );
}
