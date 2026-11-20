import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CV_AGENT_SYSTEM_PROMPT, CV_AGENT_CONFIG } from "@/lib/cv/system-prompt";
import { chatRequestSchema } from "@/lib/validations";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * Endpoint de l'agent CV interactif (POC personnel, app/[locale]/cv).
 * Volontairement indépendant de /api/agent/chat : pas de widget key, pas de
 * qualification de prospect, pas d'écriture en base — juste un aller-retour
 * avec Claude sur le system prompt d'Enzo.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.cvChat(ip)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Agent non configuré." }, { status: 503 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { messages } = parsed.data;
  const conversationId = parsed.data.conversationId ?? randomUUID();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CV_AGENT_CONFIG.model,
        max_tokens: CV_AGENT_CONFIG.maxTokens,
        temperature: CV_AGENT_CONFIG.temperature,
        system: CV_AGENT_SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[cv/chat] Anthropic error:", response.status, errorBody);
      return NextResponse.json({ error: "Erreur de communication avec l'agent." }, { status: 502 });
    }

    const data = await response.json();
    const reply: string =
      data.content
        ?.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n") ?? "";

    return NextResponse.json({ reply, conversationId });
  } catch (error) {
    console.error("[cv/chat] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
