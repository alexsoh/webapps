import { useState, useMemo, useCallback } from 'react';
import { parseNDJSON } from './utils/parser';
import type { ParsedData, SortConfig, SeverityConfig } from './types';
import { DEFAULT_COLUMNS, DEFAULT_SEVERITY_RULES } from './types';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SeveritySettings from './components/SeveritySettings';
import TextFilter from './components/TextFilter';
import LogTable from './components/LogTable';

type AppPhase = 'upload' | 'configure' | 'view';

function detectSeverityField(columns: string[]): string {
  const preferred = ['payload.fields.severity', 'payload.json.severity', 'severity'];
  for (const p of preferred) {
    if (columns.includes(p)) return p;
  }
  return columns.find((c) => c.toLowerCase().includes('severity')) ?? columns[0] ?? '';
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [filename, setFilename] = useState('');
  const [parsed, setParsed] = useState<ParsedData>({ columns: [], rows: [] });
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [wordWrap, setWordWrap] = useState(false);
  const [severityConfig, setSeverityConfig] = useState<SeverityConfig>({
    enabled: true,
    field: '',
    rules: [...DEFAULT_SEVERITY_RULES],
  });

  const handleFileLoaded = useCallback((content: string, name: string) => {
    const data = parseNDJSON(content);
    setParsed(data);
    setFilename(name);

    const defaults = new Set(
      DEFAULT_COLUMNS.filter((c) => data.columns.includes(c)),
    );
    if (defaults.size === 0) {
      data.columns.slice(0, 5).forEach((c) => defaults.add(c));
    }
    setSelectedColumns(defaults);

    setSeverityConfig((prev) => ({
      ...prev,
      field: detectSeverityField(data.columns),
    }));

    setFilterText('');
    setSortConfig(null);
    setPhase('configure');
  }, []);

  const activeColumns = useMemo(
    () => parsed.columns.filter((c) => selectedColumns.has(c)),
    [parsed.columns, selectedColumns],
  );

  const filteredRows = useMemo(() => {
    if (!filterText) return parsed.rows;
    const lower = filterText.toLowerCase();
    return parsed.rows.filter((row) =>
      activeColumns.some((col) => (row[col] ?? '').toLowerCase().includes(lower)),
    );
  }, [parsed.rows, filterText, activeColumns]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    const { column, direction } = sortConfig;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[column] ?? '';
      const bVal = b[column] ?? '';
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortConfig]);

  const handleReset = () => {
    setPhase('upload');
    setParsed({ columns: [], rows: [] });
    setFilename('');
    setFilterText('');
    setSortConfig(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="h-screen flex flex-col bg-[--color-bg-primary] text-[--color-text-primary]">
      <header className="border-b border-[--color-border] bg-[--color-bg-secondary] flex-shrink-0">
        <div className="mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold">Log Viewer</h1>
          <span className="text-xs text-[--color-text-muted] bg-[--color-bg-tertiary] px-2 py-0.5 rounded">
            v1.0
          </span>
          {phase !== 'upload' && (
            <>
              <span className="text-sm text-[--color-text-muted] ml-2">
                {filename} ({parsed.rows.length.toLocaleString()} entries)
              </span>
              <button
                onClick={handleReset}
                className="ml-auto text-sm text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
              >
                Load New File
              </button>
            </>
          )}
        </div>
      </header>

      {phase === 'upload' && (
        <main className="max-w-[1600px] mx-auto px-4 py-6 w-full">
          <FileUpload onFileLoaded={handleFileLoaded} />
        </main>
      )}

      {phase === 'configure' && (
        <main className="max-w-[1600px] mx-auto px-4 py-6 flex flex-col gap-5 w-full overflow-y-auto">
          <ColumnSelector
            columns={parsed.columns}
            selected={selectedColumns}
            onChange={setSelectedColumns}
          />
          <SeveritySettings
            columns={parsed.columns}
            config={severityConfig}
            onChange={setSeverityConfig}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('view')}
              disabled={selectedColumns.size === 0}
              className="px-6 py-2.5 text-sm font-medium bg-[--color-accent] text-white rounded-lg hover:bg-[--color-accent-hover] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              View Logs ({selectedColumns.size} columns)
            </button>
            <span className="text-sm text-[--color-text-muted]">
              {parsed.rows.length.toLocaleString()} log entries loaded
            </span>
          </div>
        </main>
      )}

      {phase === 'view' && (
        <main className="flex-1 flex flex-col gap-3 px-4 py-3 min-h-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setPhase('configure')}
              className="px-3 py-1.5 text-sm font-medium bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-secondary] hover:bg-[--color-bg-hover] transition-colors"
            >
              Configure Columns
            </button>
            <TextFilter
              value={filterText}
              onChange={setFilterText}
              totalRows={parsed.rows.length}
              filteredRows={sortedRows.length}
            />
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`px-3 py-1.5 text-sm font-medium border rounded transition-colors ${
                wordWrap
                  ? 'bg-[--color-accent]/15 border-[--color-accent]/50 text-[--color-accent]'
                  : 'bg-[--color-bg-tertiary] border-[--color-border] text-[--color-text-secondary] hover:bg-[--color-bg-hover]'
              }`}
              title={wordWrap ? 'Switch to truncated rows' : 'Switch to word-wrapped rows'}
            >
              Wrap
            </button>
          </div>
          <LogTable
            columns={activeColumns}
            rows={sortedRows}
            sortConfig={sortConfig}
            onSort={setSortConfig}
            severityConfig={severityConfig}
            wordWrap={wordWrap}
          />
        </main>
      )}
    </div>
  );
}
