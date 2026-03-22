export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export type Delimiter = ',' | '\t' | '|' | string;

export interface LeafInfo {
  path: string[];
  leafKey: string;
  defaultValue: unknown;
}

export interface LeafMapping {
  path: string[];
  leafKey: string;
  csvColumnIndex: number | null;
  defaultValue: unknown;
}

export interface MappingResult {
  leaves: LeafMapping[];
  warnings: string[];
  ignoredColumns: string[];
}
