import { Section, Card, CardTitle, Stat, Pill, Callout, Chips } from "../ui";
import {
  project,
  kpis,
  location,
  history,
  concept,
} from "../data";

export function ManiOverview() {
  const { rooms, amenities, offGrid, timeline, assetValues } = concept;

  return (
    <div className="-mx-8 -mt-8">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2b211a] via-[#3d3225] to-[#6b7242]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(180,88,47,0.4), transparent 40%)",
          }}
        />
        <div className="relative p-8 pt-10 pb-9">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-amber-100">
            {project.location}
          </span>
          <h1 className="text-4xl font-bold text-white tracking-tight mt-4">
            {project.name}
          </h1>
          <p className="text-amber-100/80 text-sm mt-2 max-w-2xl leading-relaxed">
            {project.tagline}
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-3 mt-6">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-amber-200/50">
                Concept
              </span>
              <span className="text-sm text-white/90 max-w-md">{project.concept}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-amber-200/50">
                Benchmark
              </span>
              <span className="text-sm text-white/90">{project.benchmark}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm"
            >
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                {k.label}
              </span>
              <p className="text-lg font-bold text-stone-800 tabular-nums mt-1 leading-tight">
                {k.value}{" "}
                <span className="text-xs font-medium text-stone-400">{k.unit}</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{k.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-8 mt-8 pb-8">
        <Callout tone="warn" title="Status">
          {project.status}
        </Callout>

        <div className="h-8" />

        <Section
          eyebrow="Where it is"
          title="Location & Access"
          intro={location.setting}
        >
          <Card>
            <p className="text-sm text-stone-600 mb-4">{location.address}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {location.distances.map((d) => (
                <div
                  key={d.place}
                  className="rounded-lg border border-stone-200/70 bg-stone-50/60 p-3"
                >
                  <span className="block text-xs font-medium text-stone-700">
                    {d.place}
                  </span>
                  <span className="block text-base font-bold text-stone-800 tabular-nums mt-1">
                    {d.km}
                  </span>
                  <span className="block text-[11px] text-stone-400">{d.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section eyebrow="Provenance" title="History">
          <Card>
            <p className="text-base text-stone-700 leading-relaxed">{history.summary}</p>
            <p className="text-sm text-stone-500 mt-3 leading-relaxed">{history.figure}</p>
          </Card>
        </Section>

        <Section
          eyebrow="The plan"
          title="Development Concept"
          intro={`A ${rooms.total}-key resort across towers, farmhouses and studios, plus a full agro-tourism programme.`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {rooms.breakdown.map((r) => (
              <Card key={r.type} className="!p-4">
                <div className="text-2xl font-bold text-amber-700 tabular-nums">
                  {r.keys}
                </div>
                <div className="text-sm font-semibold text-stone-700">{r.type}</div>
                <div className="text-[11px] text-stone-400 mt-1">
                  {r.units} × {r.perUnit} keys
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">{r.rate}</div>
              </Card>
            ))}
          </div>

          <Card>
            <CardTitle>Amenities</CardTitle>
            <Chips>
              {amenities.map((a) => (
                <Pill key={a}>{a}</Pill>
              ))}
            </Chips>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardTitle>Off-grid infrastructure</CardTitle>
              <Chips>
                {offGrid.map((o) => (
                  <Pill key={o} tone="olive">
                    {o}
                  </Pill>
                ))}
              </Chips>
            </Card>
            <Card>
              <CardTitle>Indicative asset values</CardTitle>
              <ul className="space-y-1.5">
                {assetValues.map((v) => (
                  <li key={v} className="text-sm text-stone-600 flex gap-2">
                    <span className="text-amber-600">•</span>
                    {v}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <CardTitle>Timeline</CardTitle>
            <ul className="space-y-1.5">
              {timeline.map((t) => (
                <li key={t} className="text-sm text-stone-600 flex gap-2">
                  <span className="text-amber-600">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>
    </div>
  );
}

// Re-export KPI shorthand for the Stat primitive (kept for parity with the
// original fundamentals app). Unused elsewhere but handy for ad-hoc panels.
export { Stat };
