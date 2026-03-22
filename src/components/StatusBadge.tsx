import type { Activity, Risk } from "../lib/types.ts";

type BadgeValue = Activity["status"] | Risk["status"] | Risk["severity"];

const config: Record<BadgeValue, { label: string; className: string }> = {
  complete: {
    label: "Complete",
    className: "bg-green-100 text-green-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800",
  },
  not_started: {
    label: "Not Started",
    className: "bg-stone-100 text-stone-800",
  },
  open: {
    label: "Open",
    className: "bg-red-100 text-red-800",
  },
  mitigating: {
    label: "Mitigating",
    className: "bg-amber-100 text-amber-800",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-800",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-800",
  },
  low: {
    label: "Low",
    className: "bg-green-100 text-green-800",
  },
};

interface StatusBadgeProps {
  value: BadgeValue;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const { label, className } = config[value];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
