import type { FlattenedRow, ParsedData } from '../types';

function flattenObject(
  obj: unknown,
  prefix: string,
  result: Record<string, string>,
): void {
  if (obj === null || obj === undefined) return;

  if (Array.isArray(obj)) {
    result[prefix] = obj.map(String).join(', ');
    return;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (key === 'text' && prefix === 'payload') {
        result[path] = String(value);
      } else {
        flattenObject(value, path, result);
      }
    }
    return;
  }

  result[prefix] = String(obj);
}

export function flattenEntry(obj: Record<string, unknown>): FlattenedRow {
  const result: Record<string, string> = {};
  flattenObject(obj, '', result);
  return result;
}

export function parseNDJSON(text: string): ParsedData {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const columnsSet = new Set<string>();
  const rows: FlattenedRow[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if ('Done' in parsed) continue;
      const flat = flattenEntry(parsed);
      for (const key of Object.keys(flat)) {
        columnsSet.add(key);
      }
      rows.push(flat);
    } catch {
      // skip malformed lines
    }
  }

  const columns = Array.from(columnsSet).sort((a, b) => {
    const aIsTimestamp = a === '@timestamp';
    const bIsTimestamp = b === '@timestamp';
    if (aIsTimestamp && !bIsTimestamp) return -1;
    if (!aIsTimestamp && bIsTimestamp) return 1;
    return a.localeCompare(b);
  });

  return { columns, rows };
}

export function formatTimestamp(value: string): string {
  const num = Number(value);
  if (!Number.isNaN(num) && num > 1e12) {
    return new Date(num).toISOString().replace('T', ' ').replace('Z', '');
  }
  return value;
}
