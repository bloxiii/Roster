import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Agent } from "@/types";

export function Solutions() {
  const t = useTranslations("Solution");
  const root = useTranslations();
  const agents = root.raw("Agents") as Agent[];

  return (
    <section id="agents" className="border-t border-border/60 py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper-dim">
            {t("description")}
          </p>
        </div>

        {/* Chaque agent est présenté comme une fiche employé,
            pas comme une simple "feature card" — ancre visuellement le
            positionnement "employés numériques". */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {agents.map((agent, index) => (
            <article
              key={agent.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-brass/40 hover:bg-surface-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim/60">
                    Agent #{String(index + 1).padStart(3, "0")}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-medium text-paper">
                    {agent.role}
                  </h3>
                </div>
                <StatusBadge label={t("statusValue")} />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-paper-dim">
                {agent.description}
              </p>

              <div className="mt-6 border-t border-border/60 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
                  {t("skillsLabel")}
                </span>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {agent.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-paper-dim"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
