import { Section, Card, CardTitle, Callout, BulletList } from "../ui";
import { useCase } from "../context";

export function CaseOverview() {
  const c = useCase();
  const [g0, g1, g2] = c.heroGradient;

  return (
    <div className="-mx-8 -mt-8">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom right, ${g0}, ${g1}, ${g2})` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18), transparent 40%)",
          }}
        />
        <div className="relative p-8 pt-10 pb-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              {c.location}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              {c.assetType}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mt-4">{c.name}</h1>
          <p className="text-white/75 text-sm mt-2 max-w-2xl leading-relaxed">{c.tagline}</p>
          <div className="flex flex-wrap gap-x-10 gap-y-3 mt-6">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/45">
                Asking price
              </span>
              <span className="text-lg font-bold text-white tabular-nums">
                {c.price}
                {c.priceNote && (
                  <span className="text-xs font-medium text-white/60 ml-2">({c.priceNote})</span>
                )}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/45">
                Recommendation
              </span>
              <span className="text-sm text-white/90 max-w-md">{c.recommendation.verdict}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {c.kpis.map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm"
            >
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                {k.label}
              </span>
              <p className="text-lg font-bold text-stone-800 tabular-nums mt-1 leading-tight">
                {k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-8 mt-8 pb-8">
        <Section eyebrow="The opportunity" title="Investment thesis">
          <Card>
            {c.summary.map((p, i) => (
              <p
                key={i}
                className={`text-stone-600 leading-relaxed ${i === 0 ? "text-base text-stone-700" : "text-sm mt-3"}`}
              >
                {p}
              </p>
            ))}
          </Card>

          <Callout tone="good" title={c.recommendation.verdict}>
            {c.recommendation.detail}
          </Callout>

          {c.highlights && c.highlights.length > 0 && (
            <Card>
              <CardTitle>Why it stands out</CardTitle>
              <BulletList items={c.highlights} />
            </Card>
          )}
        </Section>

        {c.gallery && c.gallery.length > 0 && (
          <Section eyebrow="On site" title="Photographs & exhibits">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {c.gallery.map((img) => (
                <figure
                  key={img.src}
                  className="m-0 rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-sm"
                >
                  <img
                    src={img.src}
                    alt={img.caption}
                    loading="lazy"
                    className="block w-full h-56 object-cover border-b border-stone-200"
                  />
                  <figcaption className="px-4 py-3 text-[12.5px] text-stone-500 leading-relaxed">
                    {img.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
