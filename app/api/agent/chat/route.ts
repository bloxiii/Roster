import { NextRequest, NextResponse } from "next/server";
import { AGENT_SYSTEM_PROMPT, AGENT_CONFIG } from "@/lib/agent/system-prompt";
import type { ChatResponse, ProspectData } from "@/lib/agent/types";
import { randomUUID } from "crypto";
import { handlePreflight, withCors } from "@/lib/cors";
import { chatRequestSchema } from "@/lib/validations";
import { rateLimiters } from "@/lib/rate-limit";
import { saveProspect } from "@/lib/agent/save-prospect";

/** Pré-flight CORS pour les appels depuis le widget externe. */
export function OPTIONS() {
  return handlePreflight();
}

/**
 * Extrait les données prospect du bloc <prospect_data> dans la réponse de l'agent.
 */
function extractProspectData(text: string): ProspectData | null {
  const match = text.match(/<prospect_data>\s*([\s\S]*?)\s*<\/prospect_data>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ProspectData;
  } catch {
    console.error("[agent/chat] JSON prospect invalide:", match[1]);
    return null;
  }
}

/**
 * Retire le bloc <prospect_data> du message visible pour le prospect.
 */
function cleanReplyForDisplay(text: string): string {
  return text.replace(/<prospect_data>[\s\S]*?<\/prospect_data>/, "").trim();
}

export async function POST(request: NextRequest) {
  // [CRITIQUE-1] Rate limiting — 20 requêtes / 10 min par IP
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.agentChat(ip)) {
    return withCors(
      NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques minutes." }, { status: 429 }),
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée." }, { status: 503 }),
    );
  }

  // [CRITIQUE-2] Validation Zod des messages entrants
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }));
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "Données invalides.", issues: parsed.error.flatten() }, { status: 422 }),
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
        model: AGENT_CONFIG.model,
        max_tokens: AGENT_CONFIG.maxTokens,
        temperature: AGENT_CONFIG.temperature,
        system: AGENT_SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[agent/chat] Erreur API Anthropic:", response.status, errorBody);
      return withCors(
        NextResponse.json({ error: "Erreur de communication avec l'agent." }, { status: 502 }),
      );
    }

    const data = await response.json();
    const rawReply =
      data.content
        ?.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n") ?? "";

    const prospect = extractProspectData(rawReply);
    const cleanReply = cleanReplyForDisplay(rawReply);

    // [IMPORTANT-2] Sauvegarde prospect côté serveur (plus fiable que côté client)
    if (prospect) {
      const assistantMsg = { role: "assistant" as const, content: cleanReply };
      const fullConversation = [...messages, assistantMsg];

      await saveProspect({
        data: prospect,
        conversation: fullConversation,
        conversationLength: fullConversation.length,
      }).catch((err) => console.error("[agent/chat] Échec sauvegarde prospect:", err));
    }

    const result: ChatResponse = {
      reply: cleanReply,
      conversationId,
      ...(prospect ? { prospect } : {}),
    };

    return withCors(NextResponse.json(result));
  } catch (error) {
    console.error("[agent/chat] Erreur inattendue:", error);
    return withCors(
      NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 }),
    );
  }
}
