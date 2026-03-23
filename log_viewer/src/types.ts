export type FlattenedRow = Record<string, string>;

export interface ParsedData {
  columns: string[];
  rows: FlattenedRow[];
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface SeverityColorRule {
  keyword: string;
  color: string;
}

export interface SeverityConfig {
  enabled: boolean;
  field: string;
  rules: SeverityColorRule[];
}

export const SEVERITY_COLORS: Record<string, string> = {
  red: 'bg-[var(--color-sev-error)]',
  amber: 'bg-[var(--color-sev-warn)]',
  blue: 'bg-[var(--color-sev-debug)]',
  purple: 'bg-[var(--color-sev-trace)]',
};

export const DEFAULT_SEVERITY_RULES: SeverityColorRule[] = [
  { keyword: 'ERROR', color: 'red' },
  { keyword: 'WARN', color: 'amber' },
  { keyword: 'WARNING', color: 'amber' },
  { keyword: 'DEBUG', color: 'blue' },
  { keyword: 'TRACE', color: 'purple' },
];

export const DEFAULT_COLUMNS = [
  '@timestamp',
  'payload.fields.severity',
  'payload.fields.endpoint',
  'payload.fields.source_file',
  'payload.fields.message',
  'severity',
  'message',
  'source_file',
  'context.endpoint',
  'trace_id',
];
