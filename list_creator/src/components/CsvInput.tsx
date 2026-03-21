import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import type { Delimiter } from '../types';

interface CsvInputProps {
  value: string;
  onChange: (value: string) => void;
  delimiter: Delimiter;
  onDelimiterChange: (d: Delimiter) => void;
  hasHeaders: boolean;
  onHasHeadersChange: (v: boolean) => void;
}

const DELIMITER_OPTIONS: { label: string; value: Delimiter }[] = [
  { label: 'Comma', value: ',' },
  { label: 'Tab', value: '\t' },
  { label: 'Pipe', value: '|' },
  { label: 'Semicolon', value: ';' },
];

export default function CsvInput({
  value,
  onChange,
  delimiter,
  onDelimiterChange,
  hasHeaders,
  onHasHeadersChange,
}: CsvInputProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result;
          if (typeof text === 'string') onChange(text);
        };
        reader.readAsText(file);
      }
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') onChange(text);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[--color-text-secondary]">Delimiter:</label>
          <select
            value={delimiter}
            onChange={(e) => onDelimiterChange(e.target.value as Delimiter)}
            className="bg-[--color-bg-tertiary] border border-[--color-border] rounded px-2 py-1 text-sm text-[--color-text-primary] focus:border-[--color-border-focus] focus:outline-none"
          >
            {DELIMITER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[--color-text-secondary] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasHeaders}
            onChange={(e) => onHasHeadersChange(e.target.checked)}
            className="accent-[--color-accent] w-4 h-4"
          />
          First row is header
        </label>
        <label className="ml-auto text-sm text-[--color-accent] cursor-pointer hover:text-[--color-accent-hover] transition-colors">
          <span>Browse file...</span>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      <div
        className={`relative rounded border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-[--color-accent] bg-[--color-accent]/10'
            : 'border-[--color-border] hover:border-[--color-text-muted]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste CSV data here, or drag & drop a .csv / .txt file..."
          spellCheck={false}
          className="w-full h-64 bg-transparent font-mono text-sm p-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] resize-y focus:outline-none"
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[--color-bg-primary]/80 rounded pointer-events-none">
            <span className="text-[--color-accent] text-lg font-medium">
              Drop file here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
