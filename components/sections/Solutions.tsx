import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";
import type { Agent } from "@/types";

export function Solutions() {
  const t = useTranslations("Solution");
  const root = useTranslations();
  const agents = root.raw("Agents") as Agent[];

  return (
    <section id="agents" className="border-t border-border/60 py-24">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-paper-dim">
              {t("description")}
            </p>
          </div>
        </Reveal>

        {/* Team header — "Votre équipe Velin" */}
        <Reveal delay={200}>
          <div className="mt-14 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-brass/20 font-mono text-[11px] font-medium text-brass"
                  >
                    {agent.avatar}
                  </div>
                ))}
              </div>
              <span className="font-mono text-xs text-paper-dim">
                {agents.length} employés numériques
              </span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-status">
                Tous actifs
              </span>
            </div>
          </div>
        </Reveal>

        {/* Grille des agents */}
        <div className="grid gap-5 sm:grid-cols-2">
          {agents.map((agent, index) => (
            <Reveal key={agent.id} delay={300 + index * 120}>
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-brass/40 hover:bg-surface-hover hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(122,46,38,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar de l'employé */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brass/15 font-mono text-base font-semibold text-brass transition-colors group-hover:bg-brass/25">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-medium text-paper">
                        {agent.name}
                      </h3>
                      <span className="text-xs text-paper-dim">{agent.role}</span>
                    </div>
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
                        className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-paper-dim transition-colors group-hover:border-brass/30 group-hover:text-paper-dim"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
