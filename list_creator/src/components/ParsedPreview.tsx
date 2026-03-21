import type { ParsedData } from '../types';

interface ParsedPreviewProps {
  data: ParsedData;
}

const MAX_PREVIEW_ROWS = 10;

export default function ParsedPreview({ data }: ParsedPreviewProps) {
  const { headers, rows } = data;
  if (rows.length === 0) return null;

  const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const remaining = rows.length - MAX_PREVIEW_ROWS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[--color-text-secondary]">
          Preview ({rows.length} row{rows.length !== 1 ? 's' : ''}, {headers.length} column{headers.length !== 1 ? 's' : ''})
        </span>
      </div>
      <div className="overflow-x-auto border border-[--color-border] rounded">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="bg-[--color-bg-tertiary]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-1.5 text-[--color-syntax-blue] font-medium border-b border-[--color-border]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-[--color-border] last:border-b-0 hover:bg-[--color-bg-hover] transition-colors"
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-[--color-text-primary]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {remaining > 0 && (
          <div className="px-3 py-1.5 text-xs text-[--color-text-muted] bg-[--color-bg-tertiary] border-t border-[--color-border]">
            ...and {remaining} more row{remaining !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
