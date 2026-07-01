import { Section, Card, Stat, BulletList } from "../ui";
import { StatusBadge } from "../../../components/StatusBadge";
import { useCase } from "../context";

export function CaseRisks() {
  const c = useCase();
  const risks = c.risks;
  const high = risks.filter((r) => r.severity === "high").length;
  const open = risks.filter((r) => r.status === "open").length;
  const mitigating = risks.filter((r) => r.status === "mitigating").length;

  return (
    <div>
      <Section
        eyebrow="Risk register"
        title="Risks & watch-points"
        intro="The issues flagged in the teaser and first-pass review, each rated by severity and likelihood with the mitigation needed before capital is committed."
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={String(risks.length)} label="Tracked risks" />
          <Stat value={String(high)} label="High severity" note="priority items" />
          <Stat value={String(open)} label="Open" note="not yet mitigated" />
          <Stat value={String(mitigating)} label="Mitigating" note="in progress" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {risks.map((r, i) => (
            <Card key={r.title} className="!p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-bold text-stone-300 tabular-nums leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-stone-800 leading-snug">{r.title}</h3>
                    <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                      {r.category}
                    </span>
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[11px] text-stone-400 font-medium">Severity</span>
                <StatusBadge value={r.severity} />
              </div>

              <p className="text-[13px] text-stone-500 leading-relaxed mt-3">
                <span className="font-semibold text-stone-600">Mitigation: </span>
                {r.mitigation}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {c.dueDiligence && c.dueDiligence.length > 0 && (
        <Section
          eyebrow="Confirm before committing"
          title="Due-diligence checklist"
          intro="Specific items to verify with source documents, surveys and counsel."
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {c.dueDiligence.map((d) => (
              <Card key={d.title} className="!p-5">
                <h3 className="text-sm font-bold text-stone-800 leading-snug">{d.title}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed mt-1.5">{d.detail}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {c.nextSteps && c.nextSteps.length > 0 && (
        <Section eyebrow="The path forward" title="Recommended next steps">
          <Card>
            <BulletList items={c.nextSteps} />
          </Card>
        </Section>
      )}
    </div>
  );
}
