import type { ConverterInfo, ParsedData } from '../types';

function escapePS(val: string): string {
  return val.replace(/'/g, "''");
}

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  if (headers.length <= 1) {
    const items = rows.map((r) => `'${escapePS(r[0] ?? '')}'`);
    return `@(${items.join(', ')})`;
  }

  const lines = rows.map((row) => {
    const props = headers
      .map((h, i) => `${h} = '${escapePS(row[i] ?? '')}'`)
      .join('; ');
    return `  @{${props}}`;
  });
  return `@(\n${lines.join('\n')}\n)`;
}

export const powershellConverter: ConverterInfo = {
  id: 'powershell',
  name: 'PowerShell',
  description: 'PowerShell array or array of hashtables',
  convert,
};
