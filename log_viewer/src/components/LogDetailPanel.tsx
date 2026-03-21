import { useState, useEffect, useCallback } from 'react';
import type { FlattenedRow } from '../types';
import { formatTimestamp } from '../utils/parser';

interface Props {
  row: FlattenedRow;
  onClose: () => void;
}

export default function LogDetailPanel({ row, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const entries = Object.entries(row).sort(([a], [b]) => a.localeCompare(b));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const copyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = () => {
    const text = entries
      .map(([k, v]) => `${k}: ${k === '@timestamp' ? formatTimestamp(v) : v}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied('__all__');
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-[--color-bg-secondary]/90 backdrop-blur-md border border-[--color-border] rounded-xl shadow-2xl flex flex-col max-h-[85vh] w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[--color-border] flex-shrink-0">
          <h2 className="text-sm font-semibold text-[--color-text-primary]">
            Log Entry Detail
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAll}
              className="px-3 py-1 text-xs font-medium bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-secondary] hover:bg-[--color-bg-hover] transition-colors"
            >
              {copied === '__all__' ? 'Copied!' : 'Copy All'}
            </button>
            <button
              onClick={onClose}
              className="text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-sm">
            <tbody>
              {entries.map(([key, value]) => {
                const display = key === '@timestamp' ? formatTimestamp(value) : value;
                return (
                  <tr key={key} className="border-b border-[--color-border]/20 hover:bg-[--color-bg-hover]/50 group">
                    <td className="py-2 pl-5 pr-3 font-mono text-xs text-[--color-accent] whitespace-nowrap align-top font-medium w-0">
                      {key}
                    </td>
                    <td className="py-2 pr-2 font-mono text-xs text-[--color-text-secondary] break-all whitespace-pre-wrap">
                      {display}
                    </td>
                    <td className="py-2 pr-4 w-0 align-top">
                      <button
                        onClick={() => copyValue(key, display)}
                        className="opacity-0 group-hover:opacity-100 text-[--color-text-muted] hover:text-[--color-text-primary] transition-opacity"
                        title="Copy value"
                      >
                        {copied === key ? (
                          <svg className="w-4 h-4 text-[--color-success]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
