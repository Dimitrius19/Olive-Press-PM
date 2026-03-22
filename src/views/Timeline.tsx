import { useActivities, useUpdateActivity } from "../hooks/useActivities";
import { GanttChart } from "./GanttChart";
import { GanttRow } from "./GanttRow";
import type { Activity } from "../lib/types";

export function Timeline() {
  const { data: activities, isLoading, error } = useActivities();
  const updateActivity = useUpdateActivity();

  function handleStatusChange(id: string, status: Activity["status"]) {
    const progressMap: Record<Activity["status"], number> = {
      not_started: 0,
      in_progress: 50,
      complete: 100,
    };

    updateActivity.mutate({
      id,
      updates: {
        status,
        progress_pct: progressMap[status],
      },
    });
  }

  if (isLoading) {
    return <p className="text-stone-400">Loading timeline...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500">
        Failed to load activities: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">Timeline</h2>
      <p className="text-stone-500 text-sm">
        Click a status badge to cycle: Not Started &rarr; In Progress &rarr;
        Complete
      </p>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <GanttChart>
          {activities?.map((a) => (
            <GanttRow
              key={a.id}
              activity={a}
              onStatusChange={handleStatusChange}
            />
          ))}
        </GanttChart>
      </div>
    </div>
  );
}
