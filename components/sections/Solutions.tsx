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
    <section id="agents" className="canvas-veil section-glow-border py-36">
      <Container className="relative z-10">
        <Reveal animation="fade-scale" duration={1000}>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-paper-dim md:text-lg">
              {t("description")}
            </p>
          </div>
        </Reveal>

        <Reveal animation="fade-blur" delay={300} duration={900}>
          <div className="mt-16 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-brass/20 font-mono text-xs font-medium text-brass">
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
              <span className="font-mono text-[11px] uppercase tracking-widest text-status">Tous actifs</span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {agents.map((agent, index) => (
            <Reveal key={agent.id} animation="zoom-in" delay={400 + index * 150} duration={1000}>
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-500 hover:border-brass/40 hover:bg-surface-hover hover:-translate-y-2 hover:shadow-[0_16px_50px_rgba(122,46,38,0.1)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/15 font-mono text-lg font-semibold text-brass transition-all duration-500 group-hover:bg-brass/25 group-hover:scale-110">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-medium text-paper">{agent.name}</h3>
                      <span className="text-sm text-paper-dim">{agent.role}</span>
                    </div>
                  </div>
                  <StatusBadge label={t("statusValue")} />
                </div>

                <p className="mt-5 text-sm leading-relaxed text-paper-dim">
                  {agent.description}
                </p>

                <div className="mt-6 border-t border-border/60 pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">{t("skillsLabel")}</span>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {agent.skills.map((skill) => (
                      <li key={skill} className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-paper-dim transition-all duration-300 group-hover:border-brass/30">
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
