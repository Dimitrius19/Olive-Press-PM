import type { Activity } from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";
import { dayToPercent, durationToPercent } from "./GanttChart";

const BAR_COLORS: Record<Activity["status"], string> = {
  complete: "bg-emerald-500",
  in_progress: "bg-blue-500",
  not_started: "bg-stone-400",
};

const STATUS_CYCLE: Activity["status"][] = [
  "not_started",
  "in_progress",
  "complete",
];

interface GanttRowProps {
  activity: Activity;
  onStatusChange: (id: string, status: Activity["status"]) => void;
}

export function GanttRow({ activity, onStatusChange }: GanttRowProps) {
  const startDate = new Date(activity.start_date);
  const leftPct = dayToPercent(startDate);
  const isMilestone = activity.duration_days === 0;
  const widthPct = isMilestone ? 0 : durationToPercent(activity.duration_days);

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(activity.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(activity.id, next);
  }

  return (
    <div className="flex items-center h-10 border-b border-stone-100 hover:bg-stone-50 group">
      {/* Info section — activity name */}
      <div className="w-64 shrink-0 flex items-center gap-2 px-2 overflow-hidden">
        <span className="text-xs text-stone-400 w-6 text-right shrink-0">
          {activity.number}
        </span>
        <span
          className="text-xs text-stone-700 truncate flex-1"
          title={activity.name}
        >
          {activity.name}
        </span>
      </div>

      {/* Status badge - clickable */}
      <div className="w-20 shrink-0 px-1">
        <button onClick={cycleStatus} className="cursor-pointer">
          <StatusBadge value={activity.status} />
        </button>
      </div>

      {/* Progress */}
      <div className="w-16 shrink-0 text-right pr-2">
        <span className="text-[10px] text-stone-400">
          {activity.progress_pct}%
        </span>
      </div>

      {/* Gantt bar area */}
      <div className="flex-1 relative h-full">
        {isMilestone ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-amber-500"
            style={{ left: `${leftPct}%` }}
            title={activity.name}
          />
        ) : (
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${BAR_COLORS[activity.status]}`}
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(widthPct, 0.5)}%`,
            }}
            title={`${activity.name} (${activity.progress_pct}%)`}
          >
            {widthPct > 3 && (
              <div
                className="h-full bg-white/30 rounded-r"
                style={{ width: `${100 - activity.progress_pct}%`, marginLeft: "auto" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
