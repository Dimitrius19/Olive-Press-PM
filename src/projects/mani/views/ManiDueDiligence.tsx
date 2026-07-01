import { Section, Card, CardTitle, Callout, Rows, Pill, Chips } from "../ui";
import { land, ownership, redFlags, sources } from "../data";

export function ManiDueDiligence() {
  return (
    <div>
      <Section
        eyebrow="The asset"
        title="Land & Assets"
        intro="The stated land area differs significantly between document versions — a key item for due diligence."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {land.areaVersions.map((v) => (
            <Card key={v.source}>
              <span className="block text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                {v.source}
              </span>
              <span className="block text-2xl font-bold text-stone-800 tabular-nums mt-1">
                {v.total}
              </span>
              <ul className="space-y-1.5 mt-3">
                {v.breakdown.map((b) => (
                  <li key={b} className="text-sm text-stone-600 flex gap-2">
                    <span className="text-amber-600">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card>
          <CardTitle>On the land today</CardTitle>
          <Chips>
            {land.assets.map((a) => (
              <Pill key={a}>{a}</Pill>
            ))}
          </Chips>
        </Card>
      </Section>

      <Section eyebrow="Title" title="Ownership & Title" intro={ownership.deed}>
        <Callout tone="warn">{ownership.condition}</Callout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardTitle>Transaction</CardTitle>
            <Rows items={ownership.values} />
            <p className="text-[12px] text-stone-400 mt-3">Sellers: {ownership.sellers}</p>
          </Card>
          <Card>
            <CardTitle>{ownership.buyer.name}</CardTitle>
            <ul className="space-y-1.5">
              {ownership.buyer.details.map((d) => (
                <li key={d} className="text-sm text-stone-600 flex gap-2">
                  <span className="text-amber-600">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card>
          <CardTitle>Parcels</CardTitle>
          <ul className="space-y-1.5">
            {ownership.parcels.map((p) => (
              <li key={p} className="text-sm text-stone-600 flex gap-2">
                <span className="text-amber-600">•</span>
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section
        eyebrow="Watch-list"
        title="Due Diligence Flags"
        intro="Items to resolve before committing capital."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {redFlags.map((r, i) => (
            <Card key={r.title} className="relative !p-5">
              <span className="text-2xl font-bold text-amber-700/30 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-sm font-bold text-stone-800 mt-1">{r.title}</h3>
              <p className="text-[13px] text-stone-500 leading-relaxed mt-1.5">{r.detail}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Provenance" title="Source documents">
        <Card>
          <ul className="space-y-1.5">
            {sources.map((s) => (
              <li key={s} className="text-sm text-stone-600 flex gap-2">
                <span className="text-amber-600">•</span>
                {s}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-stone-400 leading-relaxed mt-4 pt-4 border-t border-stone-100">
            Prepared as an internal pre-investment study. All financial figures are draft and require
            independent verification.
          </p>
        </Card>
      </Section>
    </div>
  );
}
