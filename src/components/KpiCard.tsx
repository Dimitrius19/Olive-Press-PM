interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles: Record<
  NonNullable<KpiCardProps["variant"]>,
  { border: string; bg: string; accent: string }
> = {
  default: {
    border: "border-stone-200",
    bg: "bg-amber-50/40",
    accent: "text-stone-900",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    accent: "text-emerald-800",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    accent: "text-amber-800",
  },
  danger: {
    border: "border-red-200",
    bg: "bg-red-50/50",
    accent: "text-red-800",
  },
};

export function KpiCard({
  label,
  value,
  subtitle,
  variant = "default",
}: KpiCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} p-5`}
    >
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${styles.accent}`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-stone-400">{subtitle}</p>
      )}
    </div>
  );
}
