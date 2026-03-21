import type { ParsedData, Delimiter } from '../types';

const DELIMITER_CANDIDATES: Delimiter[] = [',', '\t', '|', ';'];

export function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split('\n')[0] ?? '';

  let best: Delimiter = ',';
  let bestCount = 0;

  for (const d of DELIMITER_CANDIDATES) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseLine(line: string, delimiter: Delimiter): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(
  text: string,
  delimiter: Delimiter,
  hasHeaders: boolean
): ParsedData {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], hasHeaders };
  }

  const allRows = lines.map((line) => parseLine(line, delimiter));

  const colCount = Math.max(...allRows.map((r) => r.length));

  const normalized = allRows.map((row) => {
    while (row.length < colCount) row.push('');
    return row;
  });

  if (hasHeaders && normalized.length > 0) {
    const headers = normalized[0];
    const rows = normalized.slice(1);
    return { headers, rows, hasHeaders };
  }

  const headers = Array.from({ length: colCount }, (_, i) => `col${i + 1}`);
  return { headers, rows: normalized, hasHeaders };
}

export function filterColumns(
  data: ParsedData,
  selectedColumns: boolean[]
): ParsedData {
  const indices = selectedColumns
    .map((selected, i) => (selected ? i : -1))
    .filter((i) => i !== -1);

  return {
    headers: indices.map((i) => data.headers[i]),
    rows: data.rows.map((row) => indices.map((i) => row[i] ?? '')),
    hasHeaders: data.hasHeaders,
  };
}
