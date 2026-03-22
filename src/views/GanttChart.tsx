import type { ReactNode } from "react";

const PROJECT_START = new Date("2026-01-01");
const PROJECT_END = new Date("2029-06-30");
const TOTAL_DAYS =
  (PROJECT_END.getTime() - PROJECT_START.getTime()) / (1000 * 60 * 60 * 24);

interface Quarter {
  label: string;
  startPct: number;
  widthPct: number;
}

function generateQuarters(): Quarter[] {
  const quarters: Quarter[] = [];
  let year = 2026;
  let q = 1;
  while (year < 2029 || (year === 2029 && q <= 2)) {
    const startMonth = (q - 1) * 3;
    const qStart = new Date(year, startMonth, 1);
    const qEnd =
      q === 4
        ? new Date(year + 1, 0, 1)
        : new Date(year, startMonth + 3, 1);

    const clampedStart = qStart < PROJECT_START ? PROJECT_START : qStart;
    const clampedEnd = qEnd > PROJECT_END ? PROJECT_END : qEnd;

    const startPct =
      ((clampedStart.getTime() - PROJECT_START.getTime()) /
        (1000 * 60 * 60 * 24) /
        TOTAL_DAYS) *
      100;
    const widthPct =
      ((clampedEnd.getTime() - clampedStart.getTime()) /
        (1000 * 60 * 60 * 24) /
        TOTAL_DAYS) *
      100;

    quarters.push({ label: `Q${q} ${year}`, startPct, widthPct });

    q++;
    if (q > 4) {
      q = 1;
      year++;
    }
  }
  return quarters;
}

const QUARTERS = generateQuarters();

export function dayToPercent(date: Date): number {
  const days =
    (date.getTime() - PROJECT_START.getTime()) / (1000 * 60 * 60 * 24);
  return (days / TOTAL_DAYS) * 100;
}

export function durationToPercent(days: number): number {
  return (days / TOTAL_DAYS) * 100;
}

interface GanttChartProps {
  children: ReactNode;
}

export function GanttChart({ children }: GanttChartProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header row with labels + quarter columns */}
        <div className="flex items-center h-8 border-b border-stone-200 mb-1">
          {/* Match the info columns in GanttRow */}
          <div className="w-64 shrink-0" />
          <div className="w-20 shrink-0" />
          <div className="w-16 shrink-0" />

          {/* Quarter headers in the bar area */}
          <div className="flex-1 relative h-full">
            {QUARTERS.map((q) => (
              <div
                key={q.label}
                className="absolute top-0 h-full flex items-center border-l border-stone-200"
                style={{ left: `${q.startPct}%`, width: `${q.widthPct}%` }}
              >
                <span className="text-[10px] text-stone-400 pl-1 truncate">
                  {q.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-0">{children}</div>
      </div>
    </div>
  );
}
