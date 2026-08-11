/**
 * Parseur CSV minimal pour l'import outreach en masse.
 *
 * Gère les champs entre guillemets (virgules/points-virgules et guillemets
 * échappés `""`) et détecte automatiquement le séparateur (`,` ou `;`)
 * depuis l'en-tête — les exports Excel/Google Sheets en français utilisent
 * généralement `;`. Suffisant pour ce cas d'usage ; ce n'est pas un
 * parseur RFC 4180 complet (pas de support des retours à la ligne à
 * l'intérieur d'un champ entre guillemets).
 */

export type OutreachCsvRow = {
  agency_name: string;
  email: string;
  city: string;
  postal_code: string;
  phone: string;
  address: string;
};

export type OutreachCsvParseResult = {
  rows: OutreachCsvRow[];
  skipped: number; // lignes ignorées : pas de nom d'agence et/ou pas d'email
  total: number; // nombre de lignes de données (hors en-tête)
};

// Alias reconnus par colonne, comparés après normalisation (minuscules, sans accent).
const HEADER_ALIASES: Record<keyof OutreachCsvRow, string[]> = {
  agency_name: ["nom agence", "agence", "nom"],
  email: ["mail", "email", "e-mail", "courriel"],
  city: ["ville", "city"],
  postal_code: ["cp", "code postal"],
  phone: ["telephone", "tel"],
  address: ["adresse", "address"],
};

function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** minuscules, sans accents, sans "*" final (ex: "CP*" -> "cp") */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents (diacritiques combinants, U+0300-U+036F)
    .replace(/\*+$/, "")
    .trim();
}

export function parseOutreachCsv(text: string): OutreachCsvParseResult {
  // Retire un éventuel BOM UTF-8 en tête de fichier (courant avec Excel).
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { rows: [], skipped: 0, total: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter).map(normalizeHeader);

  const columnIndex: Partial<Record<keyof OutreachCsvRow, number>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof OutreachCsvRow, string[]][]) {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  }

  const rows: OutreachCsvRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const fields = parseLine(line, delimiter);
    const get = (key: keyof OutreachCsvRow) => {
      const idx = columnIndex[key];
      return idx !== undefined ? (fields[idx] ?? "").trim() : "";
    };

    const row: OutreachCsvRow = {
      agency_name: get("agency_name"),
      email: get("email"),
      city: get("city"),
      postal_code: get("postal_code"),
      phone: get("phone"),
      address: get("address"),
    };

    if (!row.agency_name || !row.email) {
      skipped++;
      continue;
    }
    rows.push(row);
  }

  return { rows, skipped, total: lines.length - 1 };
}
