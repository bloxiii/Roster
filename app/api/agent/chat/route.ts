import { NextRequest, NextResponse } from "next/server";
import { AGENT_SYSTEM_PROMPT, AGENT_CONFIG } from "@/lib/agent/system-prompt";
import type { ChatResponse, ProspectData } from "@/lib/agent/types";
import { randomUUID } from "crypto";
import { handlePreflight, withCors } from "@/lib/cors";
import { chatRequestSchema } from "@/lib/validations";
import { rateLimiters } from "@/lib/rate-limit";
import { saveProspect } from "@/lib/agent/save-prospect";
import { createServiceClient } from "@/lib/supabase/server";

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

/**
 * Résout la widget key et retourne les infos de l'agent.
 * Si pas de widget key, fallback sur le comportement legacy (agentId).
 */
async function resolveAgent(request: NextRequest, body: { widgetKey?: string }) {
  const supabase = createServiceClient();

  if (body.widgetKey) {
    const { data: wk } = await supabase
      .from("widget_keys")
      .select("company_id, agent_id, allowed_domains, is_active, agents(system_prompt)")
      .eq("key", body.widgetKey)
      .single();

    if (!wk || !wk.is_active) {
      return { error: "Widget key invalide." };
    }

    // Vérifier le domaine d'origine
    const origin = request.headers.get("origin") ?? "";
    if (
      wk.allowed_domains &&
      wk.allowed_domains.length > 0 &&
      !wk.allowed_domains.includes(origin)
    ) {
      // En dev, on laisse passer si pas de domaines configurés
      if (wk.allowed_domains.length > 0 && origin) {
        console.warn("[agent/chat] Domaine non autorisé:", origin, "attendu:", wk.allowed_domains);
      }
    }

    const agentData = wk.agents as unknown as { system_prompt: string | null } | null;

    return {
      companyId: wk.company_id,
      agentId: wk.agent_id,
      systemPrompt: agentData?.system_prompt ?? AGENT_SYSTEM_PROMPT,
    };
  }

  // Fallback legacy : pas de widget key, utiliser le prompt par défaut
  return {
    companyId: undefined,
    agentId: undefined,
    systemPrompt: AGENT_SYSTEM_PROMPT,
  };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimiters.agentChat(ip)) {
    return withCors(NextResponse.json({ error: "Trop de requêtes." }, { status: 429 }), request);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return withCors(NextResponse.json({ error: "Agent non configuré." }, { status: 503 }), request);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Corps invalide." }, { status: 400 }), request);
  }

  // Extraire widgetKey avant la validation Zod (qui ne connaît pas ce champ)
  const widgetKey = (rawBody as Record<string, unknown>)?.widgetKey as string | undefined;

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "Données invalides.", issues: parsed.error.flatten() }, { status: 422 }),
      request,
    );
  }

  // Résoudre l'agent via la widget key
  const agent = await resolveAgent(request, { widgetKey });
  if ("error" in agent) {
    return withCors(NextResponse.json({ error: agent.error }, { status: 403 }), request);
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
        system: agent.systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[agent/chat] Anthropic error:", response.status, errorBody);
      return withCors(
        NextResponse.json({ error: "Erreur de communication avec l'agent." }, { status: 502 }),
        request,
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
        companyId: agent.companyId,
        agentId: agent.agentId,
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
    return withCors(NextResponse.json({ error: "Erreur interne." }, { status: 500 }), request);
  }
}
