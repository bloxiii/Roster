import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ProspectRecord, ProspectData } from "@/lib/agent/types";

/**
 * Stockage fichier simple pour le MVP.
 * En production, remplacer par une base de données (Postgres via Prisma/Drizzle,
 * ou un service comme Supabase/PlanetScale).
 *
 * Le fichier vit dans /tmp pour compatibilité Vercel (serverless = filesystem éphémère).
 * Les données ne persistent pas entre les cold starts — acceptable pour une démo,
 * à remplacer pour la production.
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

/** POST — Enregistrer une nouvelle fiche prospect. */
export async function POST(request: NextRequest) {
  let body: { data: ProspectData; agentId: string; conversationLength: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!body.data || !body.data.qualification) {
    return NextResponse.json({ error: "Données prospect incomplètes." }, { status: 422 });
  }

  const record: ProspectRecord = {
    id: randomUUID(),
    agentId: body.agentId ?? "qualification-immobilier",
    createdAt: new Date().toISOString(),
    data: body.data,
    conversationLength: body.conversationLength ?? 0,
  };

  const prospects = await readProspects();
  prospects.push(record);
  await writeProspects(prospects);

  return NextResponse.json({ success: true, id: record.id });
}

/** GET — Lister les fiches prospect (pour le dashboard démo). */
export async function GET() {
  const prospects = await readProspects();
  return NextResponse.json({ prospects: prospects.reverse() });
}
