import type { ConverterInfo, ParsedData } from '../types';

function convert(data: ParsedData): string {
  const { headers, rows } = data;

  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(
    (row) => `| ${row.map((v) => v.replace(/\|/g, '\\|')).join(' | ')} |`
  );

  return [headerRow, separator, ...dataRows].join('\n');
}

export const markdownConverter: ConverterInfo = {
  id: 'markdown',
  name: 'Markdown Table',
  description: 'Markdown-formatted table',
  convert,
};
