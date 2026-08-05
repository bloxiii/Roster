import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ProspectRecord, ProspectData, AgentMessage } from "./types";
import { notifyHotProspect } from "./notifications";

/**
 * Stockage fichier simple pour le MVP.
 * TODO CRITIQUE-5 : migrer vers Vercel KV (voir rapport QA).
 */
const DATA_DIR = join("/tmp", "roster-data");
const PROSPECTS_FILE = join(DATA_DIR, "prospects.json");

export async function readProspects(): Promise<ProspectRecord[]> {
  try {
    const raw = await readFile(PROSPECTS_FILE, "utf-8");
    return JSON.parse(raw) as ProspectRecord[];
  } catch {
    return [];
  }
}

export async function writeProspects(records: ProspectRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PROSPECTS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

/**
 * Enregistre un prospect et déclenche la notification HOT si applicable.
 * Appelée depuis /api/agent/chat (côté serveur, fiable) et /api/agent/prospects (fallback).
 */
export async function saveProspect(params: {
  data: ProspectData;
  agentId?: string;
  clientId?: string;
  conversation?: AgentMessage[];
  conversationLength?: number;
}): Promise<ProspectRecord> {
  const record: ProspectRecord = {
    id: randomUUID(),
    agentId: params.agentId ?? "qualification-immobilier",
    clientId: params.clientId ?? "default",
    createdAt: new Date().toISOString(),
    data: params.data,
    conversation: params.conversation ?? [],
    conversationLength: params.conversationLength ?? 0,
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

  return record;
}
