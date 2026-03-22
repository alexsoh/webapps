import type { MappingResult } from '../types.ts';

interface MappingPreviewProps {
  mapping: MappingResult;
}

export default function MappingPreview({ mapping }: MappingPreviewProps) {
  const matched = mapping.leaves.filter((l) => l.csvColumnIndex !== null);
  const unmatched = mapping.leaves.filter((l) => l.csvColumnIndex === null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Property Mapping
        </h2>
        <div className="flex items-center gap-3 text-xs text-[--color-text-muted]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-success]" />
            {matched.length} matched
          </span>
          {unmatched.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-text-muted]" />
              {unmatched.length} default
            </span>
          )}
          {mapping.ignoredColumns.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-warning]" />
              {mapping.ignoredColumns.length} ignored
            </span>
          )}
        </div>
      </div>

      {mapping.warnings.length > 0 && (
        <div className="bg-[--color-warning]/10 border border-[--color-warning]/30 rounded-lg px-3 py-2">
          {mapping.warnings.map((w, i) => (
            <p key={i} className="text-xs text-[--color-warning]">{w}</p>
          ))}
        </div>
      )}

      <div className="bg-[--color-bg-secondary] border border-[--color-border] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[--color-border]">
              <th className="text-left px-3 py-2 text-xs font-medium text-[--color-text-muted] uppercase tracking-wider">
                JSON Property
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-[--color-text-muted] uppercase tracking-wider">
                CSV Column
              </th>
              <th className="text-center px-3 py-2 text-xs font-medium text-[--color-text-muted] uppercase tracking-wider w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mapping.leaves.map((leaf, i) => (
              <tr
                key={i}
                className="border-b border-[--color-border]/50 last:border-b-0 hover:bg-[--color-bg-hover]/30"
              >
                <td className="px-3 py-1.5 font-mono text-xs text-[--color-syntax-blue]">
                  {leaf.path.join('.')}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-[--color-text-primary]">
                  {leaf.csvColumnIndex !== null ? leaf.leafKey : (
                    <span className="text-[--color-text-muted] italic">
                      {JSON.stringify(leaf.defaultValue)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-center">
                  {leaf.csvColumnIndex !== null ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[--color-success]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Matched
                    </span>
                  ) : (
                    <span className="text-xs text-[--color-text-muted]">Default</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mapping.ignoredColumns.length > 0 && (
        <p className="text-xs text-[--color-text-muted] px-1">
          Ignored CSV columns: {mapping.ignoredColumns.join(', ')}
        </p>
      )}
    </div>
  );
}
