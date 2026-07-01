import type { ReactNode } from "react";
import type { Row } from "./data";

// Mani-flavoured UI primitives — same card language as the rest of the app
// (stone palette, rounded-xl, soft borders) with warm amber / terracotta accents
// matching the Mavromichali brand.

export function Section({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-5">
        {eyebrow && (
          <span className="text-[11px] uppercase tracking-widest text-amber-700/80 font-semibold">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight mt-1">
          {title}
        </h2>
        {intro && (
          <p className="text-sm text-stone-500 mt-2 max-w-3xl leading-relaxed">
            {intro}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-stone-200/80 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, em }: { children: ReactNode; em?: string }) {
  return (
    <h3 className="flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-4">
      <span>{children}</span>
      {em && <span className="text-sm font-bold text-amber-700 normal-case tracking-normal">{em}</span>}
    </h3>
  );
}

export function Stat({
  value,
  unit,
  label,
  note,
}: {
  value: string;
  unit?: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-amber-50/30 p-4">
      <div className="text-xl font-bold text-stone-800 tabular-nums leading-tight">
        {value}{" "}
        {unit && <span className="text-xs font-medium text-stone-400">{unit}</span>}
      </div>
      <div className="text-sm font-medium text-stone-600 mt-1">{label}</div>
      {note && <div className="text-[11px] text-stone-400 mt-0.5">{note}</div>}
    </div>
  );
}

type PillTone = "default" | "olive" | "terra" | "ghost";

const pillTones: Record<PillTone, string> = {
  default: "bg-stone-100 text-stone-600 border-stone-200",
  olive: "bg-[#6b7242]/10 text-[#4f5530] border-[#6b7242]/20",
  terra: "bg-[#b4582f]/10 text-[#8a4221] border-[#b4582f]/20",
  ghost: "bg-white/10 text-stone-200 border-white/20",
};

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

type CalloutTone = "info" | "warn";

const calloutTones: Record<CalloutTone, string> = {
  info: "border-sky-200 bg-sky-50/60 text-sky-900",
  warn: "border-amber-300 bg-amber-50/70 text-amber-900",
};

export function Callout({
  tone = "warn",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 text-sm leading-relaxed ${calloutTones[tone]}`}>
      {title && <strong className="font-semibold mr-1.5">{title}:</strong>}
      <span>{children}</span>
    </div>
  );
}

export function Rows({ items }: { items: Row[] }) {
  return (
    <div className="divide-y divide-stone-100">
      {items.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-2">
          <span className="text-sm text-stone-500">{r.label}</span>
          <span className="text-sm font-semibold text-stone-800 tabular-nums text-right">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
