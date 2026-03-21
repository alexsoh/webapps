import type { ConverterInfo, ParsedData } from '../types';

function escapeXML(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeTag(name: string): string {
  let tag = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  if (/^[^a-zA-Z_]/.test(tag)) tag = '_' + tag;
  return tag;
}

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  const items = rows.map((row) => {
    const fields = headers
      .map((h, i) => {
        const tag = sanitizeTag(h);
        return `    <${tag}>${escapeXML(row[i] ?? '')}</${tag}>`;
      })
      .join('\n');
    return `  <item>\n${fields}\n  </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<items>\n${items.join('\n')}\n</items>`;
}

export const xmlConverter: ConverterInfo = {
  id: 'xml',
  name: 'XML',
  description: 'XML document with items/fields',
  convert,
};
