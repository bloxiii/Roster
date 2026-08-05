import { NextRequest, NextResponse } from "next/server";
import { AGENT_SYSTEM_PROMPT, AGENT_CONFIG } from "@/lib/agent/system-prompt";
import type { ChatRequest, ChatResponse, ProspectData, AgentMessage } from "@/lib/agent/types";
import { randomUUID } from "crypto";

/**
 * Extrait les données prospect du bloc <prospect_data> dans la réponse de l'agent.
 * Retourne null si aucun bloc n'est trouvé ou si le JSON est invalide.
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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée. L'agent est en mode démo." },
      { status: 503 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Messages manquants." }, { status: 422 });
  }

  // Limiter la longueur de la conversation pour éviter les abus
  const messages = body.messages.slice(-30) as AgentMessage[];
  const conversationId = body.conversationId ?? randomUUID();

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
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[agent/chat] Erreur API Anthropic:", response.status, errorBody);
      return NextResponse.json(
        { error: "Erreur de communication avec l'agent." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const rawReply = data.content
      ?.filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n") ?? "";

    const prospect = extractProspectData(rawReply);
    const cleanReply = cleanReplyForDisplay(rawReply);

    const result: ChatResponse = {
      reply: cleanReply,
      conversationId,
      ...(prospect ? { prospect } : {}),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[agent/chat] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 },
    );
  }
}
