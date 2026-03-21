import type { ConverterInfo, ParsedData } from '../types';

function escapePy(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  if (headers.length <= 1) {
    const items = rows.map((r) => `    '${escapePy(r[0] ?? '')}'`);
    return `[\n${items.join(',\n')}\n]`;
  }

  const items = rows.map((row) => {
    const fields = headers
      .map((h, i) => `'${escapePy(h)}': '${escapePy(row[i] ?? '')}'`)
      .join(', ');
    return `    {${fields}}`;
  });
  return `[\n${items.join(',\n')}\n]`;
}

export const pythonConverter: ConverterInfo = {
  id: 'python',
  name: 'Python List',
  description: 'Python list of strings or list of dicts',
  convert,
};
