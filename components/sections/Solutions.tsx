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
    <section id="agents" className="section-glow-border relative py-36">
      <Container>
        <Reveal animation="fade-scale" duration={1100}>
          <div className="max-w-3xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-paper-dim md:text-lg">
              {t("description")}
            </p>
          </div>
        </Reveal>

        <Reveal animation="fade-blur" delay={400} duration={900}>
          <div className="mt-20 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-brass/15 font-mono text-sm font-medium text-brass transition-all duration-300 hover:scale-110 hover:z-10">
                    {agent.avatar}
                  </div>
                ))}
              </div>
              <span className="font-mono text-xs text-paper-dim">{agents.length} employés numériques</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-status">Tous actifs</span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {agents.map((agent, index) => (
            <Reveal key={agent.id} animation="zoom-in" delay={500 + index * 180} duration={1100}>
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-7 transition-all duration-500 hover:border-brass/40 hover:bg-surface-hover hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(122,46,38,0.12)]">
                {/* Glow interne au hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brass/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/15 font-mono text-xl font-semibold text-brass transition-all duration-500 group-hover:bg-brass/25 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(122,46,38,0.2)]">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-medium text-paper">{agent.name}</h3>
                      <span className="text-sm text-paper-dim">{agent.role}</span>
                    </div>
                  </div>
                  <StatusBadge label={t("statusValue")} />
                </div>

                <p className="relative mt-5 text-sm leading-relaxed text-paper-dim">{agent.description}</p>

                <div className="relative mt-6 border-t border-border/60 pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/40">{t("skillsLabel")}</span>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {agent.skills.map((skill) => (
                      <li key={skill} className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-paper-dim transition-all duration-300 group-hover:border-brass/30 group-hover:text-paper-dim">
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
