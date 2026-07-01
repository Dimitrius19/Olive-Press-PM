import type { ReactNode } from "react";
import type { CaseRow } from "./types";
import { useAccentUI } from "./context";

// Shared card language (stone palette, rounded-xl, soft borders) reused across
// all opportunity-case views. Accent-dependent bits read the active case's
// accent from context so a single set of primitives themes every project.

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
  const a = useAccentUI();
  return (
    <section className="mb-10">
      <div className="mb-5">
        {eyebrow && (
          <span className={`text-[11px] uppercase tracking-widest font-semibold ${a.eyebrow}`}>
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight mt-1">{title}</h2>
        {intro && (
          <p className="text-sm text-stone-500 mt-2 max-w-3xl leading-relaxed">{intro}</p>
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
    <div className={`rounded-xl border border-stone-200/80 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, em }: { children: ReactNode; em?: string }) {
  const a = useAccentUI();
  return (
    <h3 className="flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-4">
      <span>{children}</span>
      {em && <span className={`text-sm font-bold normal-case tracking-normal ${a.em}`}>{em}</span>}
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
  const a = useAccentUI();
  return (
    <div className={`rounded-xl border border-stone-200/80 p-4 ${a.statBg}`}>
      <div className="text-xl font-bold text-stone-800 tabular-nums leading-tight">
        {value}{" "}
        {unit && <span className="text-xs font-medium text-stone-400">{unit}</span>}
      </div>
      <div className="text-sm font-medium text-stone-600 mt-1">{label}</div>
      {note && <div className="text-[11px] text-stone-400 mt-0.5">{note}</div>}
    </div>
  );
}

export function Pill({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  const a = useAccentUI();
  const tone = accent ? a.pill : "bg-stone-100 text-stone-600 border-stone-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

type CalloutTone = "info" | "warn" | "good";

const calloutTones: Record<CalloutTone, string> = {
  info: "border-sky-200 bg-sky-50/60 text-sky-900",
  warn: "border-amber-300 bg-amber-50/70 text-amber-900",
  good: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
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

export function Rows({ items }: { items: CaseRow[] }) {
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

// Bulleted list with an accent glyph — used for highlights, uses, next steps.
export function BulletList({ items }: { items: string[] }) {
  const a = useAccentUI();
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="text-sm text-stone-600 flex gap-2">
          <span className={a.bullet}>•</span>
          {t}
        </li>
      ))}
    </ul>
  );
}
