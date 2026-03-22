import { useState, useMemo } from 'react';
import CsvUpload from './components/CsvUpload.tsx';
import JsonTemplateInput from './components/JsonTemplateInput.tsx';
import MappingPreview from './components/MappingPreview.tsx';
import OutputDisplay from './components/OutputDisplay.tsx';
import { parseCSV, detectDelimiter } from './utils/csvParser.ts';
import { computeMapping, mapRows } from './utils/jsonMapper.ts';

export default function App() {
  const [csvText, setCsvText] = useState('');
  const [templateText, setTemplateText] = useState('');

  const delimiter = useMemo(() => detectDelimiter(csvText), [csvText]);
  const parsed = useMemo(() => parseCSV(csvText, delimiter), [csvText, delimiter]);

  const templateParse = useMemo<{
    value: Record<string, unknown> | null;
    error: string | null;
  }>(() => {
    if (!templateText.trim()) return { value: null, error: null };
    try {
      const obj = JSON.parse(templateText);
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return { value: null, error: 'Template must be a JSON object (not array or primitive)' };
      }
      return { value: obj as Record<string, unknown>, error: null };
    } catch (e) {
      return { value: null, error: (e as Error).message };
    }
  }, [templateText]);

  const mapping = useMemo(() => {
    if (!templateParse.value || parsed.headers.length === 0) return null;
    return computeMapping(templateParse.value, parsed.headers);
  }, [templateParse.value, parsed.headers]);

  const outputRows = useMemo(() => {
    if (!templateParse.value || !mapping || parsed.rows.length === 0) return [];
    return mapRows(templateParse.value, mapping, parsed.rows);
  }, [templateParse.value, mapping, parsed.rows]);

  const outputJson = useMemo(() => {
    if (outputRows.length === 0) return '';
    return JSON.stringify(outputRows, null, 2);
  }, [outputRows]);

  const hasInput = parsed.headers.length > 0 && templateParse.value !== null;

  return (
    <div className="min-h-screen bg-[--color-bg-primary] text-[--color-text-primary]">
      <header className="border-b border-[--color-border] bg-[--color-bg-secondary]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[--color-text-primary]">
            CSV JSON Builder
          </h1>
          <span className="text-xs text-[--color-text-muted] bg-[--color-bg-tertiary] px-2 py-0.5 rounded">
            v1.0
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide mb-4">
            Input
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CsvUpload value={csvText} onChange={setCsvText} />
            <JsonTemplateInput
              value={templateText}
              onChange={setTemplateText}
              parsedTemplate={templateParse.value}
              parseError={templateParse.error}
            />
          </div>
        </section>

        {parsed.headers.length > 0 && (
          <section className="bg-[--color-bg-secondary]/50 border border-[--color-border]/50 rounded-lg px-4 py-3">
            <p className="text-xs text-[--color-text-muted]">
              CSV: <span className="text-[--color-text-secondary]">{parsed.headers.length} columns</span>,{' '}
              <span className="text-[--color-text-secondary]">{parsed.rows.length} rows</span>
              <span className="mx-2 text-[--color-border]">|</span>
              Headers: <span className="font-mono text-[--color-syntax-blue]">{parsed.headers.join(', ')}</span>
            </p>
          </section>
        )}

        {hasInput && mapping && (
          <section>
            <MappingPreview mapping={mapping} />
          </section>
        )}

        {outputJson && (
          <section>
            <OutputDisplay output={outputJson} rowCount={outputRows.length} />
          </section>
        )}
      </main>
    </div>
  );
}
