import type { ConverterInfo, ParsedData } from '../types';

function escapeBash(val: string): string {
  return val.replace(/'/g, "'\\''");
}

function convert(data: ParsedData): string {
  const { rows } = data;
  const items = rows.map((r) => `'${escapeBash(r[0] ?? '')}'`);
  return `arr=(${items.join(' ')})`;
}

export const bashConverter: ConverterInfo = {
  id: 'bash',
  name: 'Bash Array',
  description: "Bash array: arr=('a' 'b' ...)",
  convert,
};
