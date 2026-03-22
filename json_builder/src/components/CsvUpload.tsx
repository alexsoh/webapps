import { useState, useCallback, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

interface CsvUploadProps {
  value: string;
  onChange: (text: string) => void;
}

export default function CsvUpload({ value, onChange }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') onChange(text);
      };
      reader.readAsText(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    onChange('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[--color-text-secondary]">
          CSV Data
        </label>
        {value && (
          <button
            onClick={handleClear}
            className="text-xs text-[--color-text-muted] hover:text-[--color-error] transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors
          ${isDragging
            ? 'border-[--color-accent] bg-[--color-accent]/5'
            : 'border-[--color-border] hover:border-[--color-text-muted]'}
        `}
      >
        {!value ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
            <svg className="w-8 h-8 text-[--color-text-muted]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm text-[--color-text-muted] text-center">
              <span className="text-[--color-accent] font-medium">Drop a CSV file</span> here, or{' '}
              <label className="text-[--color-accent] font-medium cursor-pointer hover:underline">
                browse
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-[--color-text-muted]">or paste CSV text below</span>
          </div>
        ) : (
          <div className="p-1">
            {fileName && (
              <div className="px-3 pt-2 pb-1 text-xs text-[--color-text-muted] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {fileName}
              </div>
            )}
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full bg-transparent text-sm text-[--color-text-primary] font-mono
                         px-3 py-2 resize-y focus:outline-none"
              placeholder="name,age,email&#10;Alice,30,alice@example.com&#10;Bob,25,bob@example.com"
            />
          </div>
        )}
      </div>

      {!value && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          spellCheck={false}
          className="w-full bg-[--color-bg-secondary] border border-[--color-border] rounded-lg
                     text-sm text-[--color-text-primary] font-mono px-3 py-2
                     focus:outline-none focus:border-[--color-border-focus]
                     resize-y placeholder:text-[--color-text-muted]"
          placeholder="name,age,email&#10;Alice,30,alice@example.com&#10;Bob,25,bob@example.com"
        />
      )}
    </div>
  );
}
