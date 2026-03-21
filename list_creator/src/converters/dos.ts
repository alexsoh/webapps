import type { ConverterInfo, ParsedData } from '../types';

function convert(data: ParsedData): string {
  const { rows } = data;
  const items = rows.map((r) => r[0] ?? '');

  const setLine = `set "list=${items.join(' ')}"`;
  const forLine = `for %%i in (${items.join(' ')}) do (\n    echo %%i\n)`;

  return `@echo off\n${setLine}\n\nREM Or use a FOR loop:\n${forLine}`;
}

export const dosConverter: ConverterInfo = {
  id: 'dos',
  name: 'DOS/Batch',
  description: 'DOS batch set and for loop',
  convert,
};
