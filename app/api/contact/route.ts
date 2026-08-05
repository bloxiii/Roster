import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { sendContactNotification } from "@/lib/email";
import { rateLimiters } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (rateLimiters.contact(ip)) {
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
