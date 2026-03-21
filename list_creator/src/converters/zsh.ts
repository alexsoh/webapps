import type { ConverterInfo, ParsedData } from '../types';

function escapeZsh(val: string): string {
  return val.replace(/'/g, "'\\''");
}

function convert(data: ParsedData): string {
  const { rows } = data;
  const items = rows.map((r) => `'${escapeZsh(r[0] ?? '')}'`);
  return `arr=(${items.join(' ')})`;
}

export const zshConverter: ConverterInfo = {
  id: 'zsh',
  name: 'Zsh Array',
  description: "Zsh array: arr=('a' 'b' ...)",
  convert,
};
