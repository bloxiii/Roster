import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo — Velinova",
  robots: { index: false },
};

export default async function VideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-ink-soft">
          <video
            src="/demo-video.mov"
            controls
            autoPlay
            playsInline
            className="w-full"
          />
        </div>
        <div className="mt-4 text-center">
          <img src="/images/velinova-logo.svg" alt="" width={24} height={24} className="mx-auto" />
          <p className="mt-2 font-mono text-xs text-paper-dim/40">
            velinova.xyz
          </p>
        </div>
      </div>
    </div>
  );
}
