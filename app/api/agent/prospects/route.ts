import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ProspectRecord, ProspectData, AgentMessage } from "@/lib/agent/types";
import { handlePreflight, withCors } from "@/lib/cors";
import { notifyHotProspect } from "@/lib/agent/notifications";

/**
 * Stockage fichier simple pour le MVP.
 * En production, remplacer par une base de données (Postgres via Prisma/Drizzle,
 * ou un service comme Supabase/PlanetScale).
 */
const DATA_DIR = join("/tmp", "roster-data");
const PROSPECTS_FILE = join(DATA_DIR, "prospects.json");

async function readProspects(): Promise<ProspectRecord[]> {
  try {
    const raw = await readFile(PROSPECTS_FILE, "utf-8");
    return JSON.parse(raw) as ProspectRecord[];
  } catch {
    return [];
  }
}

async function writeProspects(records: ProspectRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PROSPECTS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export function OPTIONS() {
  return handlePreflight();
}

/** POST — Enregistrer une nouvelle fiche prospect. */
export async function POST(request: NextRequest) {
  let body: {
    data: ProspectData;
    agentId: string;
    clientId?: string;
    conversation?: AgentMessage[];
    conversationLength: number;
  };
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Corps invalide." }, { status: 400 }));
  }

  if (!body.data || !body.data.qualification) {
    return withCors(NextResponse.json({ error: "Données prospect incomplètes." }, { status: 422 }));
  }

  const record: ProspectRecord = {
    id: randomUUID(),
    agentId: body.agentId ?? "qualification-immobilier",
    clientId: body.clientId ?? "default",
    createdAt: new Date().toISOString(),
    data: body.data,
    conversation: body.conversation ?? [],
    conversationLength: body.conversationLength ?? 0,
    notifiedAt: null,
  };

  // Notification email si prospect HOT
  if (record.data.qualification === "HOT") {
    const sent = await notifyHotProspect(record.data, record.id);
    if (sent) {
      record.notifiedAt = new Date().toISOString();
    }
  }

  const prospects = await readProspects();
  prospects.push(record);
  await writeProspects(prospects);

  return withCors(NextResponse.json({ success: true, id: record.id }));
}

/** GET — Lister les fiches prospect (pour le dashboard). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qualification = searchParams.get("qualification");
  const clientId = searchParams.get("clientId") ?? "default";

  let prospects = await readProspects();

  // Filtrage par client
  prospects = prospects.filter((p) => p.clientId === clientId);

  // Filtrage par qualification
  if (qualification && ["HOT", "WARM", "COLD"].includes(qualification)) {
    prospects = prospects.filter((p) => p.data.qualification === qualification);
  }

  return NextResponse.json({ prospects: prospects.reverse() });
}
