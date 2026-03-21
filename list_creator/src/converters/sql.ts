import type { ConverterInfo, ParsedData } from '../types';

function escapeSQL(val: string): string {
  return val.replace(/'/g, "''");
}

function convertIN(data: ParsedData): string {
  const { rows } = data;
  const items = rows.map((r) => `'${escapeSQL(r[0] ?? '')}'`);
  return `(${items.join(', ')})`;
}

function convertINSERT(data: ParsedData): string {
  const { headers, rows } = data;
  const colList = headers.join(', ');
  const lines = rows.map((row) => {
    const vals = row.map((v) => `'${escapeSQL(v)}'`).join(', ');
    return `INSERT INTO table_name (${colList}) VALUES (${vals});`;
  });
  return lines.join('\n');
}

export const sqlInConverter: ConverterInfo = {
  id: 'sql-in',
  name: 'SQL IN List',
  description: "SQL IN clause values: ('a', 'b', ...)",
  convert: convertIN,
};

export const sqlInsertConverter: ConverterInfo = {
  id: 'sql-insert',
  name: 'SQL INSERT',
  description: 'SQL INSERT INTO statements',
  convert: convertINSERT,
};
