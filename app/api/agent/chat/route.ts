import { NextRequest, NextResponse } from "next/server";
import { AGENT_SYSTEM_PROMPT, AGENT_CONFIG } from "@/lib/agent/system-prompt";
import type { ChatResponse, ProspectData } from "@/lib/agent/types";
import { randomUUID } from "crypto";
import { handlePreflight, withCors } from "@/lib/cors";
import { chatRequestSchema } from "@/lib/validations";
import { rateLimiters } from "@/lib/rate-limit";
import { saveProspect } from "@/lib/agent/save-prospect";

export function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

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

function cleanReplyForDisplay(text: string): string {
  return text.replace(/<prospect_data>[\s\S]*?<\/prospect_data>/, "").trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.agentChat(ip)) {
    return withCors(
      NextResponse.json({ error: "Trop de requêtes." }, { status: 429 }), request,
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "Agent non configuré." }, { status: 503 }), request,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Corps invalide." }, { status: 400 }), request);
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "Données invalides.", issues: parsed.error.flatten() }, { status: 422 }), request,
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
      console.error("[agent/chat] Anthropic error:", response.status, errorBody);
      return withCors(
        NextResponse.json({ error: "Erreur de communication avec l'agent." }, { status: 502 }), request,
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

    if (prospect) {
      const assistantMsg = { role: "assistant" as const, content: cleanReply };
      const fullConversation = [...messages, assistantMsg];
      await saveProspect({
        data: prospect,
        conversation: fullConversation,
        conversationLength: fullConversation.length,
      }).catch((err) => console.error("[agent/chat] Save failed:", err));
    }

    const result: ChatResponse = {
      reply: cleanReply,
      conversationId,
      ...(prospect ? { prospect } : {}),
    };

    return withCors(NextResponse.json(result), request);
  } catch (error) {
    console.error("[agent/chat] Unexpected error:", error);
    return withCors(
      NextResponse.json({ error: "Erreur interne." }, { status: 500 }), request,
    );
  }
}
