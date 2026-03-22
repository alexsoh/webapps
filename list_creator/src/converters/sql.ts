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

function convertVALUES(data: ParsedData): string {
  const { headers, rows } = data;
  const colNames =
    headers.length > 1
      ? headers
      : rows[0]?.map((_, i) => `col${i + 1}`) ?? ['col1'];

  const tuples = rows.map((row) => {
    const vals = row.map((v) => `'${escapeSQL(v)}'`).join(', ');
    return `  (${vals})`;
  });

  return `SELECT * FROM (VALUES\n${tuples.join(',\n')}\n) AS t(${colNames.join(', ')})`;
}

export const sqlValuesConverter: ConverterInfo = {
  id: 'sql-values',
  name: 'SQL VALUES',
  description: 'SELECT * FROM (VALUES ...) table expression',
  convert: convertVALUES,
};
