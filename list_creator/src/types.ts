export interface ParsedData {
  headers: string[];
  rows: string[][];
  hasHeaders: boolean;
}

export type ConverterFn = (
  data: ParsedData,
  options?: Record<string, unknown>
) => string;

export interface ConverterInfo {
  name: string;
  id: string;
  convert: ConverterFn;
  description: string;
}

export type Delimiter = ',' | '\t' | '|' | string;
