interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantBorderClass: Record<NonNullable<KpiCardProps["variant"]>, string> =
  {
    default: "border-stone-200",
    success: "border-green-200",
    warning: "border-amber-200",
    danger: "border-red-200",
  };

export function KpiCard({
  label,
  value,
  subtitle,
  variant = "default",
}: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border-2 bg-white p-5 ${variantBorderClass[variant]}`}
    >
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-stone-400">{subtitle}</p>
      )}
    </div>
  );
}
