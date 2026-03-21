import type { ConverterInfo, ParsedData } from '../types';

function escapeYAML(val: string): string {
  if (/[:{}\[\],&*?|>!%#@`"']/.test(val) || val.trim() !== val || val === '') {
    return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return val;
}

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  if (headers.length <= 1) {
    return rows.map((r) => `- ${escapeYAML(r[0] ?? '')}`).join('\n');
  }

  return rows
    .map((row) => {
      const fields = headers
        .map((h, i) => `    ${h}: ${escapeYAML(row[i] ?? '')}`)
        .join('\n');
      return `  -\n${fields}`;
    })
    .join('\n');
}

export const yamlConverter: ConverterInfo = {
  id: 'yaml',
  name: 'YAML',
  description: 'YAML list or list of mappings',
  convert,
};
