"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { contactFormSchema } from "@/lib/validations";

type Status = "idle" | "sending" | "success" | "error";

const FIELD_CLASSES =
  "w-full rounded-lg border border-border bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper-dim/50 outline-none transition-colors focus:border-brass";

export function ContactSection() {
  const t = useTranslations("Contact");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""), // honeypot
    };

    const parsed = contactFormSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(t("form.error"));
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) throw new Error("request_failed");

      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setErrorMessage(t("form.error"));
    }
  }

  return (
    <section id="contact" className="section-glow-border py-36">
      <Container className="relative z-10 grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-paper-dim">
            {t("subtitle")}
          </p>
          <p className="mt-8 text-sm text-paper-dim">
            {t("direct")}{" "}
            <a href="mailto:contact@velinova.xyz" className="text-brass-bright hover:underline">
              contact@velinova.xyz
            </a>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-2xl border border-border bg-surface p-6 sm:p-8"
        >
          {/* Honeypot anti-spam : masqué visuellement, laissé accessible aux bots */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs text-paper-dim">
                {t("form.name")}
              </label>
              <input id="name" name="name" type="text" required minLength={2} className={FIELD_CLASSES} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs text-paper-dim">
                {t("form.email")}
              </label>
              <input id="email" name="email" type="email" required className={FIELD_CLASSES} />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="mb-1.5 block text-xs text-paper-dim">
              {t("form.company")}
            </label>
            <input id="company" name="company" type="text" required minLength={2} className={FIELD_CLASSES} />
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-xs text-paper-dim">
              {t("form.message")}
            </label>
            <textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={4}
              className={FIELD_CLASSES}
            />
          </div>

          <Button type="submit" disabled={status === "sending"} className="w-full sm:w-auto">
            {status === "sending" ? t("form.sending") : t("form.submit")}
          </Button>

          <div role="status" aria-live="polite">
            {status === "success" && (
              <p className="text-sm text-status">{t("form.success")}</p>
            )}
            {status === "error" && errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
          </div>
        </form>
      </Container>
    </section>
  );
}
