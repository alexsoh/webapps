import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { FlattenedRow, SortConfig, SeverityConfig } from '../types';
import { SEVERITY_COLORS } from '../types';
import { formatTimestamp } from '../utils/parser';
import LogDetailPanel from './LogDetailPanel';

interface Props {
  columns: string[];
  rows: FlattenedRow[];
  sortConfig: SortConfig | null;
  onSort: (config: SortConfig) => void;
  severityConfig: SeverityConfig;
  wordWrap: boolean;
}

const ROW_HEIGHT = 36;
const BUFFER = 10;
const DEFAULT_COL_WIDTH = 200;
const MIN_COL_WIDTH = 60;

export default function LogTable({ columns, rows, sortConfig, onSort, severityConfig, wordWrap }: Props) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  const resizing = useRef<{ col: string; startX: number; startW: number } | null>(null);
  const colWidthsRef = useRef(colWidths);
  colWidthsRef.current = colWidths;

  useEffect(() => {
    setColWidths({});
  }, [columns]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setContainerHeight(h);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIdx = Math.min(rows.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);
  const visibleRows = wordWrap ? rows : rows.slice(startIdx, endIdx);

  const getRowColor = useMemo(() => {
    if (!severityConfig.enabled || !severityConfig.field) return () => '';
    const ruleMap = new Map(
      severityConfig.rules.map((r) => [r.keyword.toUpperCase(), SEVERITY_COLORS[r.color] ?? '']),
    );
    return (row: FlattenedRow) => {
      const val = (row[severityConfig.field] ?? '').toUpperCase();
      return ruleMap.get(val) ?? '';
    };
  }, [severityConfig]);

  const handleSort = (col: string) => {
    if (sortConfig?.column === col) {
      onSort({ column: col, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ column: col, direction: 'asc' });
    }
  };

  const formatCell = (col: string, value: string) => {
    if (col === '@timestamp') return formatTimestamp(value);
    return value;
  };

  const getColWidth = (col: string) => colWidths[col] ?? DEFAULT_COL_WIDTH;

  const onResizeStart = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidthsRef.current[col] ?? DEFAULT_COL_WIDTH;
    resizing.current = { col, startX, startW };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const diff = ev.clientX - resizing.current.startX;
      const newW = Math.max(MIN_COL_WIDTH, resizing.current.startW + diff);
      setColWidths((prev) => ({ ...prev, [resizing.current!.col]: newW }));
    };

    const onUp = () => {
      resizing.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const totalWidth = columns.reduce((sum, col) => sum + getColWidth(col), 0);

  const cellClass = wordWrap
    ? 'px-3 py-1.5 text-sm text-[--color-text-secondary] font-mono flex-shrink-0 whitespace-pre-wrap break-all'
    : 'px-3 text-sm text-[--color-text-secondary] truncate font-mono flex-shrink-0';

  return (
    <>
      <div className="border border-[--color-border] rounded-lg overflow-hidden bg-[--color-bg-secondary] flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto flex-shrink-0" style={{ minWidth: totalWidth }}>
          <div className="flex bg-[--color-bg-tertiary]" style={{ width: totalWidth }}>
            {columns.map((col) => (
              <div
                key={col}
                className="relative px-3 py-2 text-left text-xs font-medium text-[--color-text-muted] uppercase tracking-wider cursor-pointer hover:text-[--color-text-secondary] select-none flex-shrink-0"
                style={{ width: getColWidth(col) }}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center gap-1 truncate">
                  {col}
                  {sortConfig?.column === col && (
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {sortConfig.direction === 'asc'
                        ? <path d="M5.293 9.707l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 7.414l-3.293 3.293a1 1 0 01-1.414-1.414z" />
                        : <path d="M14.707 10.293l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 12.586l3.293-3.293a1 1 0 111.414 1.414z" />
                      }
                    </svg>
                  )}
                </span>
                <div
                  onMouseDown={(e) => onResizeStart(col, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[--color-accent]/30 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto min-h-0"
        >
          {wordWrap ? (
            <div style={{ minWidth: totalWidth }}>
              {visibleRows.map((row, realIdx) => {
                const colorClass = getRowColor(row);
                return (
                  <div
                    key={realIdx}
                    onClick={() => setSelectedRow(realIdx)}
                    className={`flex items-stretch cursor-pointer border-b border-[--color-border]/30 hover:bg-[--color-bg-hover] transition-colors ${colorClass}`}
                    style={{ minWidth: totalWidth }}
                  >
                    {columns.map((col) => (
                      <div
                        key={col}
                        className={cellClass}
                        style={{ width: getColWidth(col) }}
                      >
                        {formatCell(col, row[col] ?? '')}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: rows.length * ROW_HEIGHT, position: 'relative', minWidth: totalWidth }}>
              {visibleRows.map((row, i) => {
                const realIdx = startIdx + i;
                const colorClass = getRowColor(row);
                return (
                  <div
                    key={realIdx}
                    onClick={() => setSelectedRow(realIdx)}
                    className={`flex items-center cursor-pointer border-b border-[--color-border]/30 hover:bg-[--color-bg-hover] transition-colors ${colorClass}`}
                    style={{ position: 'absolute', top: realIdx * ROW_HEIGHT, height: ROW_HEIGHT, width: '100%', minWidth: totalWidth }}
                  >
                    {columns.map((col) => (
                      <div
                        key={col}
                        className={cellClass}
                        style={{ width: getColWidth(col), lineHeight: `${ROW_HEIGHT}px` }}
                        title={row[col] ?? ''}
                      >
                        {formatCell(col, row[col] ?? '')}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedRow !== null && rows[selectedRow] && (
        <LogDetailPanel
          row={rows[selectedRow]}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </>
  );
}
