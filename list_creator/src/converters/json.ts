import type { ConverterInfo, ParsedData } from '../types';

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  if (headers.length <= 1) {
    const flat = rows.map((r) => r[0] ?? '');
    return JSON.stringify(flat, null, 2);
  }

  const objects = rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

export const jsonConverter: ConverterInfo = {
  id: 'json',
  name: 'JSON',
  description: 'Array of objects or array of strings',
  convert,
};
