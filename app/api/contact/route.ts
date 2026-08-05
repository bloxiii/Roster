import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { sendContactNotification } from "@/lib/email";

// Rate limiting en mémoire, volontairement simple pour un MVP mono-instance.
// À remplacer par un store partagé (Redis/Upstash) avant un scaling multi-instance.
const submissionsByIp = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionsByIp.get(ip) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return timestamps.length > MAX_SUBMISSIONS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Merci de réessayer plus tard." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Honeypot rempli => très probablement un bot, on répond "succès" sans rien faire
  // pour ne pas révéler la détection.
  if (parsed.data.website) {
    return NextResponse.json({ success: true });
  }

  try {
    await sendContactNotification(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/contact] Échec de l'envoi", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi." },
      { status: 500 },
    );
  }
}
