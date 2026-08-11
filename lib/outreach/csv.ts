/**
 * Parseur CSV minimal pour l'import outreach en masse.
 *
 * Gère les champs entre guillemets (virgules/points-virgules et guillemets
 * échappés `""`), détecte automatiquement le séparateur (`,` ou `;` — les
 * exports Excel français utilisent généralement `;`), et recherche la
 * vraie ligne d'en-tête parmi les 10 premières lignes plutôt que de
 * supposer que c'est systématiquement la ligne 1 (certains exports ont une
 * ligne de titre du type "Coordonnées" avant les en-têtes de colonnes).
 * Suffisant pour ce cas d'usage ; ce n'est pas un parseur RFC 4180 complet
 * (pas de support des retours à la ligne à l'intérieur d'un champ entre
 * guillemets).
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

/**
 * Essaie de lire `line` comme ligne d'en-tête avec `delimiter`. Renvoie
 * l'index de colonne par champ si le nom d'agence ET l'email sont trouvés
 * (les 2 champs obligatoires), sinon `null` — ce n'est probablement pas la
 * ligne d'en-tête (ex: une ligne de titre comme "Coordonnées").
 */
function tryMatchHeader(
  line: string,
  delimiter: string,
): Partial<Record<keyof OutreachCsvRow, number>> | null {
  const headers = parseLine(line, delimiter).map(normalizeHeader);
  const columnIndex: Partial<Record<keyof OutreachCsvRow, number>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof OutreachCsvRow, string[]][]) {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  }
  if (columnIndex.agency_name === undefined || columnIndex.email === undefined) return null;
  return columnIndex;
}

/**
 * Excel convertit souvent une colonne "code postal" en nombre et perd le
 * zéro de tête (ex: "04100" affiché/exporté "4100"). Les codes postaux
 * français font toujours 5 chiffres : on repadde uniquement si la valeur
 * est purement numérique et plus courte, pour ne pas altérer autre chose.
 */
function normalizePostalCode(cp: string): string {
  return /^\d{1,4}$/.test(cp) ? cp.padStart(5, "0") : cp;
}

export function parseOutreachCsv(text: string): OutreachCsvParseResult {
  // Retire un éventuel BOM UTF-8 en tête de fichier (courant avec Excel).
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { rows: [], skipped: 0, total: 0 };
  }

  // Cherche la vraie ligne d'en-tête parmi les 10 premières lignes (au lieu
  // de supposer que c'est systématiquement la ligne 1), pour tolérer une
  // ligne de titre ou des lignes vides en tête de fichier.
  let delimiter = ",";
  let columnIndex: Partial<Record<keyof OutreachCsvRow, number>> | null = null;
  let headerLineIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const candidateDelimiter = detectDelimiter(lines[i]);
    const match = tryMatchHeader(lines[i], candidateDelimiter);
    if (match) {
      delimiter = candidateDelimiter;
      columnIndex = match;
      headerLineIndex = i;
      break;
    }
  }

  if (!columnIndex) {
    return { rows: [], skipped: 0, total: 0 };
  }

  const dataLines = lines.slice(headerLineIndex + 1);
  const rows: OutreachCsvRow[] = [];
  let skipped = 0;

  for (const line of dataLines) {
    const fields = parseLine(line, delimiter);
    const get = (key: keyof OutreachCsvRow) => {
      const idx = columnIndex![key];
      return idx !== undefined ? (fields[idx] ?? "").trim() : "";
    };

    const row: OutreachCsvRow = {
      agency_name: get("agency_name"),
      email: get("email"),
      city: get("city"),
      postal_code: normalizePostalCode(get("postal_code")),
      phone: get("phone"),
      address: get("address"),
    };

    if (!row.agency_name || !row.email) {
      skipped++;
      continue;
    }
    rows.push(row);
  }

  return { rows, skipped, total: dataLines.length };
}
