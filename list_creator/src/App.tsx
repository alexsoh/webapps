import { useState, useMemo, useEffect } from 'react';
import CsvInput from './components/CsvInput';
import ColumnSelector from './components/ColumnSelector';
import ParsedPreview from './components/ParsedPreview';
import FormatSelector from './components/FormatSelector';
import OutputDisplay from './components/OutputDisplay';
import { parseCSV, detectDelimiter, filterColumns } from './utils/csvParser';
import { converters } from './converters';
import type { Delimiter } from './types';

export default function App() {
  const [rawText, setRawText] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState(converters[0].id);
  const [selectedColumns, setSelectedColumns] = useState<boolean[]>([]);

  const parsed = useMemo(
    () => parseCSV(rawText, delimiter, hasHeaders),
    [rawText, delimiter, hasHeaders]
  );

  useEffect(() => {
    setSelectedColumns(parsed.headers.map(() => true));
  }, [parsed.headers.length]);

  const filteredData = useMemo(
    () =>
      selectedColumns.length === parsed.headers.length
        ? filterColumns(parsed, selectedColumns)
        : parsed,
    [parsed, selectedColumns]
  );

  const converter = converters.find((c) => c.id === selectedFormat) ?? converters[0];

  const output = useMemo(() => {
    if (filteredData.rows.length === 0) return '';
    try {
      return converter.convert(filteredData);
    } catch {
      return '// Error generating output';
    }
  }, [filteredData, converter]);

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text && text !== rawText) {
      const detected = detectDelimiter(text);
      setDelimiter(detected);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-bg-primary] text-[--color-text-primary]">
      <header className="border-b border-[--color-border] bg-[--color-bg-secondary]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[--color-text-primary]">
            CSV List Converter
          </h1>
          <span className="text-xs text-[--color-text-muted] bg-[--color-bg-tertiary] px-2 py-0.5 rounded">
            v1.0
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
            Input
          </h2>
          <CsvInput
            value={rawText}
            onChange={handleTextChange}
            delimiter={delimiter}
            onDelimiterChange={setDelimiter}
            hasHeaders={hasHeaders}
            onHasHeadersChange={setHasHeaders}
          />
        </section>

        {parsed.headers.length > 1 && (
          <section>
            <ColumnSelector
              headers={parsed.headers}
              selected={selectedColumns}
              onChange={setSelectedColumns}
            />
          </section>
        )}

        {parsed.rows.length > 0 && (
          <section>
            <ParsedPreview data={filteredData} />
          </section>
        )}

        {parsed.rows.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
              Output Format
            </h2>
            <FormatSelector
              selected={selectedFormat}
              onChange={setSelectedFormat}
            />
            <OutputDisplay output={output} formatName={converter.name} />
          </section>
        )}
      </main>
    </div>
  );
}
